import pytest


class TestFileUpload:
    """FILE-01: User can upload .xlsx or .xls files. Tests implemented in plan 01-02."""

    @pytest.mark.skip(reason="Implemented in plan 01-02 after upload guardrails are added")
    def test_upload_file_too_large(self, client):
        pass

    @pytest.mark.skip(reason="Implemented in plan 01-02 after upload guardrails are added")
    def test_upload_invalid_extension(self, client):
        pass

    @pytest.mark.skip(reason="Implemented in plan 01-02 after upload guardrails are added")
    def test_upload_multi_sheet_first_only(self, client):
        pass
