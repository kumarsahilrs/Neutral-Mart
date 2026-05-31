"""
AI Layer 2 — Marketing Content Generator
One-tap AI captions, hashtags, and branded content for resellers.
"""
import time
from typing import Literal, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import re, json

from app.services.provider import complete, estimate_cost, active_provider
from app.services.ai_logger import log_ai_call, log_ai_error

router = APIRouter()

SONNET = "claude-3-5-sonnet-20241022"
HAIKU  = "claude-3-haiku-20240307"

CAPTION_SYSTEM = """You are NirmalMandi's marketing assistant for Indian resellers.
Generate social media captions for dead inventory deals.
Always return valid JSON with keys: hook, body, cta, hashtags, full_caption.
- hook: viral opening line (max 15 words)
- body: 2-3 lines describing the deal
- cta: call to action (WhatsApp/link)
- hashtags: array of 8-10 strings (empty array for WhatsApp)
- full_caption: complete post text ready to copy-paste
End every caption with: 'Sourced from NirmalMandi | nirmalmandi.com'
WhatsApp: no hashtags, under 500 chars, use emojis. Instagram: under 2200 chars."""


class CaptionRequest(BaseModel):
    listing_id: str
    product_title: str
    sector: str
    price: float
    mrp: Optional[float] = None
    grade: str = "A"
    city: str
    state: str
    language: Literal["en", "hi", "hinglish"] = "hi"
    tone: Literal["urgent", "premium", "casual", "bulk"] = "urgent"
    platform: Literal["instagram", "whatsapp", "facebook", "telegram"] = "whatsapp"
    user_id: Optional[str] = None


@router.post("/caption")
async def generate_caption(req: CaptionRequest):
    discount_pct = round((1 - req.price / req.mrp) * 100) if req.mrp and req.mrp > req.price else 0
    prompt = (
        f"Product: {req.product_title}\n"
        f"Sector: {req.sector} | Grade: {req.grade}\n"
        f"Price: ₹{req.price:,.0f} ({discount_pct}% off MRP)\n"
        f"Location: {req.city}, {req.state}\n"
        f"Language: {req.language} | Tone: {req.tone} | Platform: {req.platform}\n"
        f"Generate the marketing caption now."
    )
    start = time.time()
    try:
        ai = await complete(CAPTION_SYSTEM, prompt, preferred_model=SONNET, max_tokens=600)
        latency_ms = int((time.time() - start) * 1000)
        cost = estimate_cost(ai.model, ai.input_tokens, ai.output_tokens)

        await log_ai_call(
            user_id=req.user_id, action_type="caption_gen", model=ai.model,
            input_tokens=ai.input_tokens, output_tokens=ai.output_tokens,
            cost_usd=cost, latency_ms=latency_ms,
            metadata={"platform": req.platform, "language": req.language, "listing_id": req.listing_id},
        )

        json_match = re.search(r'\{.*\}', ai.text, re.DOTALL)
        parsed = {}
        if json_match:
            try:
                parsed = json.loads(json_match.group())
            except json.JSONDecodeError:
                parsed = {"full_caption": ai.text}

        return {"success": True, "data": {**parsed, "cost_credits": 5}, "provider": active_provider()}
    except Exception as e:
        await log_ai_error(req.user_id, "caption_gen", SONNET, str(e))
        raise HTTPException(status_code=500, detail=str(e))


class DealHookRequest(BaseModel):
    product_title: str
    sector: str
    discount_pct: float
    language: Literal["en", "hi", "hinglish"] = "hi"
    user_id: Optional[str] = None


@router.post("/hook")
async def generate_deal_hook(req: DealHookRequest):
    """Generate just the opening hook line — used in deal feed previews."""
    start = time.time()
    try:
        prompt = (
            f"Write ONE powerful opening line in {req.language} for this dead stock deal: "
            f"{req.product_title} ({req.sector}) at {req.discount_pct:.0f}% off. "
            f"Max 15 words. Make it feel urgent. Return plain text only, no JSON."
        )
        ai = await complete("You write viral marketing hooks for Indian resellers.", prompt, preferred_model=HAIKU, max_tokens=100)
        latency_ms = int((time.time() - start) * 1000)
        await log_ai_call(
            user_id=req.user_id, action_type="caption_gen", model=ai.model,
            input_tokens=ai.input_tokens, output_tokens=ai.output_tokens,
            cost_usd=estimate_cost(ai.model, ai.input_tokens, ai.output_tokens),
            latency_ms=latency_ms,
        )
        return {"success": True, "data": {"hook": ai.text.strip()}, "provider": active_provider()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
