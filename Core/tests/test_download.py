import pytest
from app import create_app


class TestDownloadEndpoint:
    """FILE-03: User can download the modified .xlsx file."""

    @pytest.mark.skip(reason="download endpoint not yet implemented")
    def test_download_returns_xlsx(self, client):
        """GET /excel/download/<session_id> with valid session returns 200 and xlsx content-type."""
        resp = client.get('/excel/download/test-session-id')
        assert resp.status_code == 200
        assert resp.content_type == (
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

    @pytest.mark.skip(reason="download endpoint not yet implemented")
    def test_download_cross_user_returns_403(self, client):
        """GET /excel/download/<session_id> with a different user's session returns 403."""
        resp = client.get('/excel/download/other-user-session-id')
        assert resp.status_code == 403

    @pytest.mark.skip(reason="download endpoint not yet implemented")
    def test_download_missing_session_returns_error(self, client):
        """GET /excel/download/<session_id> where session_id does not exist returns 400 or 404."""
        resp = client.get('/excel/download/nonexistent-session-id')
        assert resp.status_code in (400, 404)
