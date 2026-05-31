"""
AI Provider Abstraction — use Claude or OpenAI interchangeably.
Priority: ANTHROPIC_API_KEY → Claude (preferred, better instruction-following)
Fallback: OPENAI_API_KEY → GPT-4o

Set whichever key you have. Both work. Both keys = Claude wins.
"""
import os
import json
import re
from typing import Optional

ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")

USE_CLAUDE = bool(ANTHROPIC_KEY and ANTHROPIC_KEY != "<claude-api-key>")
USE_OPENAI = bool(OPENAI_KEY and OPENAI_KEY != "<whisper-api-key>")

if not USE_CLAUDE and not USE_OPENAI:
    raise RuntimeError("No AI provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env")

# Model mapping — equivalent capability tiers
MODEL_MAP = {
    # Claude model → OpenAI equivalent
    "claude-3-5-sonnet-20241022": "gpt-4o",
    "claude-3-haiku-20240307": "gpt-4o-mini",
}

# OpenAI cost rates per token (input, output)
OPENAI_RATES = {
    "gpt-4o": (0.0000025, 0.00001),
    "gpt-4o-mini": (0.00000015, 0.0000006),
}


class AIResponse:
    """Normalised response from either provider."""
    def __init__(self, text: str, input_tokens: int, output_tokens: int, model: str):
        self.text = text
        self.input_tokens = input_tokens
        self.output_tokens = output_tokens
        self.model = model


async def complete(
    system: str,
    user_message: str,
    preferred_model: str = "claude-3-5-sonnet-20241022",
    max_tokens: int = 1024,
    conversation_history: Optional[list] = None,
) -> AIResponse:
    """
    Single completion call — Claude if available, otherwise GPT-4o.
    Returns a normalised AIResponse.
    """
    if USE_CLAUDE:
        return await _claude_complete(system, user_message, preferred_model, max_tokens, conversation_history)
    else:
        return await _openai_complete(system, user_message, preferred_model, max_tokens, conversation_history)


async def _claude_complete(system, user_message, model, max_tokens, history) -> AIResponse:
    import anthropic
    client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
    messages = (history or []) + [{"role": "user", "content": user_message}]
    resp = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=messages,
    )
    text = resp.content[0].text if resp.content else ""
    return AIResponse(
        text=text,
        input_tokens=resp.usage.input_tokens,
        output_tokens=resp.usage.output_tokens,
        model=model,
    )


async def _openai_complete(system, user_message, claude_model, max_tokens, history) -> AIResponse:
    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_KEY)
    oai_model = MODEL_MAP.get(claude_model, "gpt-4o")
    messages = [{"role": "system", "content": system}]
    for h in (history or []):
        if isinstance(h.get("content"), str):
            messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": user_message})

    resp = client.chat.completions.create(
        model=oai_model,
        max_tokens=max_tokens,
        messages=messages,
    )
    text = resp.choices[0].message.content or ""
    return AIResponse(
        text=text,
        input_tokens=resp.usage.prompt_tokens,
        output_tokens=resp.usage.completion_tokens,
        model=oai_model,
    )


def estimate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    """Unified cost estimate — works for both Claude and OpenAI models."""
    RATES = {
        # Claude
        "claude-3-5-sonnet-20241022": (0.000003, 0.000015),
        "claude-3-haiku-20240307":    (0.00000025, 0.00000125),
        # OpenAI
        "gpt-4o":                     (0.0000025, 0.00001),
        "gpt-4o-mini":                (0.00000015, 0.0000006),
        # Whisper (audio)
        "whisper-1":                  (0.000006, 0),
    }
    in_rate, out_rate = RATES.get(model, (0.000003, 0.000015))
    return round(input_tokens * in_rate + output_tokens * out_rate, 8)


def active_provider() -> str:
    return "claude" if USE_CLAUDE else "openai"
