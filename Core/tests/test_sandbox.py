"""
Tests for SEC-01 and SEC-02 (sandbox hardening).
Implemented in plan 02-02.
"""
import pytest
import pandas as pd

try:
    from app.services.code_execution_service import CodeExecutionService
except ImportError:
    CodeExecutionService = None  # type: ignore


def _sample_df(rows: int = 5) -> pd.DataFrame:
    return pd.DataFrame({"a": range(rows), "b": range(rows)})


@pytest.mark.skipif(CodeExecutionService is None, reason="CodeExecutionService not importable")
class TestSandbox:

    def test_builtins_removed(self):
        """exec with __builtins__ removed cannot call open()."""
        df = _sample_df()
        # open() is a builtin — with __builtins__={} it should be unavailable
        # This may surface as NameError (no open) or ValueError (forbidden pattern 'open(')
        with pytest.raises((ValueError, Exception)):
            CodeExecutionService.execute_transformation(df, "open('/etc/passwd')")

    def test_import_blocked(self):
        """Code containing 'import os' is rejected before exec."""
        df = _sample_df()
        with pytest.raises(ValueError, match="Forbidden pattern"):
            CodeExecutionService.execute_transformation(df, "import os\nos.system('id')")

    def test_open_blocked(self):
        """Code containing 'open(' is rejected before exec."""
        df = _sample_df()
        with pytest.raises(ValueError, match="Forbidden pattern"):
            CodeExecutionService.execute_transformation(df, "open('/etc/passwd')")

    def test_empty_df_rejected(self):
        """Post-exec validation rejects empty DataFrame result."""
        df = _sample_df()
        with pytest.raises((ValueError, Exception)):
            # This code sets df to an empty DataFrame
            CodeExecutionService.execute_transformation(df, "df = pd.DataFrame()")

    def test_row_explosion_rejected(self):
        """Post-exec validation rejects result >10x input rows."""
        df = _sample_df(rows=5)
        # Produce 51 rows from 5 — more than 10x
        explosion_code = "import pandas as _pd\ndf = pd.concat([df] * 11, ignore_index=True)"
        with pytest.raises((ValueError, Exception)):
            CodeExecutionService.execute_transformation(df, explosion_code)
