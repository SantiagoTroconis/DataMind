"""
Tests for CHAT-01 and SEC-02 (LLMService with litellm routing,
prompt injection separation).
Implemented in plan 02-02.
"""
import json
import os
import pytest
from unittest.mock import patch, MagicMock

try:
    from app.services.llm_service import LLMService
except ImportError:
    LLMService = None  # type: ignore


@pytest.mark.skipif(LLMService is None, reason="LLMService not importable")
class TestLLMService:

    def _make_mock_response(self, payload: dict) -> MagicMock:
        """Build a litellm-shaped mock response."""
        msg = MagicMock()
        msg.content = json.dumps(payload)
        choice = MagicMock()
        choice.message = msg
        response = MagicMock()
        response.choices = [choice]
        return response

    def test_litellm_model_routing(self):
        """litellm.completion is called with model string from LLM_MODEL env var."""
        payload = {"code": "df['x'] = 1", "explanation": "sets x", "intent": "DATA_MUTATION"}
        mock_resp = self._make_mock_response(payload)

        with patch.dict(os.environ, {"LLM_MODEL": "openai/gpt-4o"}):
            with patch("litellm.completion", return_value=mock_resp) as mock_completion:
                result = LLMService.generate_transformation_code(
                    prompt="add column x",
                    columns=["a", "b"],
                )
                call_kwargs = mock_completion.call_args
                assert call_kwargs is not None, "litellm.completion was not called"
                # model may be positional or keyword
                called_model = (
                    call_kwargs.kwargs.get("model")
                    or (call_kwargs.args[0] if call_kwargs.args else None)
                )
                assert called_model == "openai/gpt-4o", (
                    f"Expected model='openai/gpt-4o', got {called_model!r}"
                )

        assert result["code"] == "df['x'] = 1"
        assert result["intent"] == "DATA_MUTATION"

    def test_prompt_not_in_system(self):
        """User prompt appears in user role message, NOT in system message content."""
        user_prompt = "UNIQUE_CANARY_STRING_XYZ_12345"
        payload = {"code": "pass", "explanation": "noop", "intent": "DATA_MUTATION"}
        mock_resp = self._make_mock_response(payload)

        with patch("litellm.completion", return_value=mock_resp) as mock_completion:
            LLMService.generate_transformation_code(
                prompt=user_prompt,
                columns=["col1"],
            )
            call_kwargs = mock_completion.call_args
            assert call_kwargs is not None, "litellm.completion was not called"

            messages = (
                call_kwargs.kwargs.get("messages")
                or (call_kwargs.args[1] if len(call_kwargs.args) > 1 else None)
            )
            assert messages is not None, "messages argument not found in litellm.completion call"

            system_messages = [m for m in messages if m.get("role") == "system"]
            user_messages = [m for m in messages if m.get("role") == "user"]

            assert system_messages, "No system message found"
            assert user_messages, "No user message found"

            system_content = system_messages[0]["content"]
            assert user_prompt not in system_content, (
                "User prompt was interpolated into system message — prompt injection risk!"
            )

            user_content = user_messages[0]["content"]
            assert user_prompt in user_content, (
                "User prompt not found in user role message"
            )
