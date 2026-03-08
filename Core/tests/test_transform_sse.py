"""
Wave 0 test stubs for EDIT-03 and CHAT-02 (SSE transform endpoint integration).
All tests are skipped until plan 02-03 implements the SSE /excel/transform endpoint.
"""
import pytest


@pytest.mark.skip(reason="Wave 0 stub — implemented in plan 02-03")
def test_transform_sse_events(client):
    """POST /excel/transform yields SSE events: progress(Interpretando), progress(Ejecutando), done."""
    pass


@pytest.mark.skip(reason="Wave 0 stub — implemented in plan 02-03")
def test_explanation_in_done_event(client):
    """done SSE event payload contains 'explanation' key."""
    pass
