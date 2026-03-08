"""
Tests for EDIT-03 and CHAT-02: SSE /excel/transform endpoint.

These tests mock the LLM so no real API calls are made.
"""
import json
import pytest
from unittest.mock import patch


def _parse_sse_frames(raw: bytes) -> list[dict]:
    """Parse SSE byte stream into a list of {'event': str, 'data': dict}."""
    text = raw.decode('utf-8')
    frames = []
    for block in text.split('\n\n'):
        block = block.strip()
        if not block:
            continue
        event = None
        data = None
        for line in block.splitlines():
            if line.startswith('event:'):
                event = line[len('event:'):].strip()
            elif line.startswith('data:'):
                data = json.loads(line[len('data:'):].strip())
        if data is not None:
            frames.append({'event': event or 'message', 'data': data})
    return frames


def _make_authenticated_client(client):
    """Register + login a test user and return (client, token)."""
    client.post('/auth/register', json={'email': 'ssetest@example.com', 'password': 'Password1!'})
    resp = client.post('/auth/login', json={'email': 'ssetest@example.com', 'password': 'Password1!'})
    data = resp.get_json()
    token = data.get('token') or data.get('access_token') or ''
    return token


def _upload_test_xlsx(client, token):
    """Upload a minimal .xlsx and return session_id."""
    import io
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws['A1'] = 'Name'
    ws['B1'] = 'Value'
    ws['A2'] = 'Alice'
    ws['B2'] = 100
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)

    resp = client.post(
        '/excel/upload',
        data={'file': (buf, 'test.xlsx')},
        headers={'Authorization': f'Bearer {token}'},
        content_type='multipart/form-data'
    )
    assert resp.status_code == 200, f"Upload failed: {resp.data}"
    return resp.get_json()['session_id']


def test_transform_sse_events(client):
    """POST /excel/transform yields SSE events: progress(Interpretando), progress(Ejecutando), done."""
    token = _make_authenticated_client(client)
    session_id = _upload_test_xlsx(client, token)

    mock_code_data = {
        'code': "df['Value'] = df['Value'] * 2",
        'explanation': 'Doubled the values.',
        'intent': 'DATA_MUTATION'
    }

    with patch('app.services.llm_service.LLMService.generate_transformation_code', return_value=mock_code_data):
        resp = client.post(
            '/excel/transform',
            data={'session_id': str(session_id), 'prompt': 'double all values'},
            headers={'Authorization': f'Bearer {token}'},
        )

    assert resp.status_code == 200
    assert 'text/event-stream' in resp.content_type

    frames = _parse_sse_frames(resp.data)
    events = [f['event'] for f in frames]

    assert 'progress' in events, f"No 'progress' events found. Events: {events}"
    assert 'done' in events, f"No 'done' event found. Events: {events}"

    progress_frames = [f for f in frames if f['event'] == 'progress']
    steps = [f['data'].get('step', '') for f in progress_frames]
    assert any('Interpretando' in s for s in steps), f"Expected 'Interpretando' step, got: {steps}"
    assert any('Ejecutando' in s for s in steps), f"Expected 'Ejecutando' step, got: {steps}"


def test_explanation_in_done_event(client):
    """done SSE event payload contains 'explanation' key with non-empty string."""
    token = _make_authenticated_client(client)
    session_id = _upload_test_xlsx(client, token)

    mock_code_data = {
        'code': "df['Value'] = df['Value'] + 1",
        'explanation': 'Incremented values by 1.',
        'intent': 'DATA_MUTATION'
    }

    with patch('app.services.llm_service.LLMService.generate_transformation_code', return_value=mock_code_data):
        resp = client.post(
            '/excel/transform',
            data={'session_id': str(session_id), 'prompt': 'increment values'},
            headers={'Authorization': f'Bearer {token}'},
        )

    assert resp.status_code == 200
    frames = _parse_sse_frames(resp.data)
    done_frames = [f for f in frames if f['event'] == 'done']
    assert len(done_frames) == 1, f"Expected exactly one done event, got: {done_frames}"

    payload = done_frames[0]['data']
    assert 'explanation' in payload, f"'explanation' key missing from done payload: {payload}"
    assert payload['explanation'], f"'explanation' is empty in done payload: {payload}"
