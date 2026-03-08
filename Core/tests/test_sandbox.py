"""
Wave 0 test stubs for SEC-01 and SEC-02 (sandbox hardening).
All tests are skipped until plan 02-02 implements CodeExecutionService hardening.
"""
import pytest

try:
    from app.services.code_execution_service import CodeExecutionService
except ImportError:
    CodeExecutionService = None  # type: ignore


@pytest.mark.skipif(CodeExecutionService is None, reason="CodeExecutionService not importable")
class TestSandbox:

    @pytest.mark.skip(reason="Wave 0 stub — implemented in plan 02-02")
    def test_builtins_removed(self):
        """exec with __builtins__ removed cannot call open()."""
        pass

    @pytest.mark.skip(reason="Wave 0 stub — implemented in plan 02-02")
    def test_import_blocked(self):
        """Code containing 'import os' is rejected before exec."""
        pass

    @pytest.mark.skip(reason="Wave 0 stub — implemented in plan 02-02")
    def test_open_blocked(self):
        """Code containing 'open(' is rejected before exec."""
        pass

    @pytest.mark.skip(reason="Wave 0 stub — implemented in plan 02-02")
    def test_empty_df_rejected(self):
        """Post-exec validation rejects empty DataFrame result."""
        pass

    @pytest.mark.skip(reason="Wave 0 stub — implemented in plan 02-02")
    def test_row_explosion_rejected(self):
        """Post-exec validation rejects result >10x input rows."""
        pass
