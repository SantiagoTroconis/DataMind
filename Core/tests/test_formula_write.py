"""
Wave 0 test stubs for EDIT-04 (formula write to disk).
All tests are skipped until plan 02-03 implements FORMULA_WRITE intent handling.
"""
import pytest


@pytest.mark.skip(reason="Wave 0 stub — implemented in plan 02-03")
def test_formula_written_to_disk(client):
    """After FORMULA_WRITE, .xlsx file on disk contains formula string in target cell."""
    pass
