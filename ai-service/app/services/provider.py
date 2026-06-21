"""
AI Provider — OpenAI only.
Set OPENAI_API_KEY in .env.
"""
import os
import json
from typing import Optional
from openai import AsyncOpenAI

OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")
if not OPENAI_KEY:
    raise RuntimeError("OPENAI_API_KEY not set. Add it to .env")

_client: Optional[AsyncOpenAI] = None

def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=OPENAI_KEY)
    return _client

# Canonical model aliases used across routers
GPT4O       = "gpt-4o"
GPT4O_MINI  = "gpt-4o-mini"
DALLE3      = "dall-e-3"

# Cost per token (input, output) in USD
_RATES = {
    GPT4O:      (0.0000025, 0.00001),
    GPT4O_MINI: (0.00000015, 0.0000006),
    DALLE3:     (0, 0),  # charged per image, not tokens
}

_DALLE_PRICES = {
    "standard": {"1024x1024": 0.040, "1024x1792": 0.080, "1792x1024": 0.080},
    "hd":       {"1024x1024": 0.080, "1024x1792": 0.120, "1792x1024": 0.120},
}


class AIResponse:
    def __init__(self, text: str, input_tokens: int, output_tokens: int, model: str):
        self.text = text
        self.input_tokens = input_tokens
        self.output_tokens = output_tokens
        self.model = model


async def complete(
    system: str,
    user_message: str,
    preferred_model: str = GPT4O,
    max_tokens: int = 1024,
    conversation_history: Optional[list] = None,
) -> AIResponse:
    # Map legacy Claude model names → OpenAI equivalents
    model = _resolve_model(preferred_model)
    messages = [{"role": "system", "content": system}]
    for h in (conversation_history or []):
        if isinstance(h.get("content"), str):
            messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": user_message})

    resp = await get_client().chat.completions.create(
        model=model,
        max_tokens=max_tokens,
        messages=messages,
    )
    text = resp.choices[0].message.content or ""
    return AIResponse(
        text=text,
        input_tokens=resp.usage.prompt_tokens,
        output_tokens=resp.usage.completion_tokens,
        model=model,
    )


async def generate_image(
    prompt: str,
    size: str = "1024x1024",
    quality: str = "standard",
) -> str:
    """Returns the URL of the generated image (valid for ~1 hour from OpenAI CDN)."""
    resp = await get_client().images.generate(
        model=DALLE3,
        prompt=prompt,
        n=1,
        size=size,
        quality=quality,
        response_format="url",
    )
    return resp.data[0].url or ""


def estimate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    model = _resolve_model(model)
    in_rate, out_rate = _RATES.get(model, (0.0000025, 0.00001))
    return round(input_tokens * in_rate + output_tokens * out_rate, 8)


def estimate_image_cost(size: str = "1024x1024", quality: str = "standard") -> float:
    return _DALLE_PRICES.get(quality, {}).get(size, 0.040)


def active_provider() -> str:
    return "openai"


def _resolve_model(name: str) -> str:
    """Map legacy Claude model names to OpenAI equivalents."""
    _map = {
        "claude-3-5-sonnet-20241022": GPT4O,
        "claude-3-haiku-20240307":    GPT4O_MINI,
        "claude-3-opus-20240229":     GPT4O,
    }
    return _map.get(name, name)
