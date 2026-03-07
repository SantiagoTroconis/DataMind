import io
import pytest


def _make_xlsx_bytes(num_sheets: int = 1) -> bytes:
    """Create a minimal valid .xlsx file in memory."""
    import openpyxl
    wb = openpyxl.Workbook()
    wb.active.title = 'Sheet1'
    wb.active['A1'] = 'hello'
    wb.active['B1'] = 'world'
    if num_sheets > 1:
        wb.create_sheet('Sheet2')
        wb.worksheets[1]['A1'] = 'second_sheet_only_data'
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf.read()


def _auth_header(client) -> dict:
    """Register a test user and return the Authorization header."""
    resp = client.post('/auth/register', json={
        'email': 'uploadtest@example.com',
        'password': 'password123'
    })
    # Accept 201 (new) or 400 with "registrado" (already exists from prior test run)
    if resp.status_code == 201:
        token = resp.get_json()['token']
    else:
        resp2 = client.post('/auth/login', json={
            'email': 'uploadtest@example.com',
            'password': 'password123'
        })
        token = resp2.get_json()['token']
    return {'Authorization': f'Bearer {token}'}


class TestFileUpload:
    """FILE-01: User can upload .xlsx or .xls files."""

    def test_upload_file_too_large(self, client):
        """POST /excel/upload returns 400 when file > 10 MB."""
        headers = _auth_header(client)
        # Create a >10MB payload (11MB of zeros in an xlsx-named file)
        large_data = b'\x00' * (11 * 1024 * 1024)
        data = {
            'file': (io.BytesIO(large_data), 'toolarge.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        }
        resp = client.post(
            '/excel/upload',
            data=data,
            content_type='multipart/form-data',
            headers=headers
        )
        assert resp.status_code == 400
        body = resp.get_json()
        assert 'error' in body

    def test_upload_invalid_extension(self, client):
        """POST /excel/upload returns 400 for .csv and .txt extensions."""
        headers = _auth_header(client)
        for filename in ('data.csv', 'data.txt'):
            data = {
                'file': (io.BytesIO(b'col1,col2\n1,2'), filename, 'text/plain')
            }
            resp = client.post(
                '/excel/upload',
                data=data,
                content_type='multipart/form-data',
                headers=headers
            )
            assert resp.status_code == 400, f"Expected 400 for {filename}, got {resp.status_code}"
            body = resp.get_json()
            assert 'error' in body

    def test_upload_multi_sheet_first_only(self, client):
        """POST /excel/upload with multi-sheet workbook returns grid data from first sheet."""
        headers = _auth_header(client)
        xlsx_bytes = _make_xlsx_bytes(num_sheets=2)
        data = {
            'file': (io.BytesIO(xlsx_bytes), 'multisheet.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        }
        resp = client.post(
            '/excel/upload',
            data=data,
            content_type='multipart/form-data',
            headers=headers
        )
        assert resp.status_code == 200
        body = resp.get_json()
        # Must contain grid data from first sheet — 'second_sheet_only_data' must NOT appear
        assert 'data' in body or 'columns' in body or 'rows' in body
        body_str = str(body)
        assert 'second_sheet_only_data' not in body_str, (
            "Multi-sheet workbook returned data from second sheet — sheet_name=0 not enforced"
        )
