"""
Wave 0 test stubs for CHAT-01 and SEC-02 (LLMService with litellm routing,
prompt injection separation).
All tests are skipped until plan 02-02 implements LLMService refactor.
"""
import pytest

try:
    from app.services.llm_service import LLMService
except ImportError:
    LLMService = None  # type: ignore


@pytest.mark.skipif(LLMService is None, reason="LLMService not importable")
class TestLLMService:

    @pytest.mark.skip(reason="Wave 0 stub — implemented in plan 02-02")
    def test_litellm_model_routing(self):
        """litellm.completion is called with model string from LLM_MODEL env var."""
        pass

    @pytest.mark.skip(reason="Wave 0 stub — implemented in plan 02-02")
    def test_prompt_not_in_system(self):
        """User prompt appears in user role message, NOT in system message content."""
        pass
