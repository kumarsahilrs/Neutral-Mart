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
from app.routers.credits import check_and_deduct

router = APIRouter()

from app.services.provider import GPT4O, GPT4O_MINI
SONNET = GPT4O
HAIKU  = GPT4O_MINI

CAPTION_SYSTEM = """You are NirmalMandi's marketing assistant for Indian resellers.
Generate social media captions for dead inventory deals.
Always return valid JSON with keys: hook, body, cta, hashtags, full_caption.
- hook: viral opening line (max 15 words)
- body: 2-3 lines describing the deal
- cta: call to action (WhatsApp/link)
- hashtags: array of 8-10 strings (empty array for WhatsApp)
- full_caption: complete post text ready to copy-paste
End every caption with: 'Sourced from NirmalMandi | nirmalmandi.com'
WhatsApp: no hashtags, under 500 chars, use emojis. Instagram: under 2200 chars.

Language codes and expected script:
- en: English
- hi: Hindi (Devanagari script)
- hinglish: Hindi-English mix (Roman script)
- gu: Gujarati (ગુજરાતી script)
- pa: Punjabi (ਪੰਜਾਬੀ / Gurmukhi script)
- mr: Marathi (मराठी / Devanagari script)
Always write in the exact language/script requested."""


class CaptionRequest(BaseModel):
    listing_id: str
    product_title: str
    sector: str
    price: float
    mrp: Optional[float] = None
    grade: str = "A"
    city: str
    state: str
    language: Literal["en", "hi", "hinglish", "gu", "pa", "mr"] = "hi"
    tone: Literal["urgent", "premium", "casual", "bulk"] = "urgent"
    platform: Literal["instagram", "whatsapp", "facebook", "telegram"] = "whatsapp"
    user_id: Optional[str] = None
    buyer_profile_id: Optional[str] = None


@router.post("/caption")
async def generate_caption(req: CaptionRequest):
    if req.buyer_profile_id:
        await check_and_deduct(req.buyer_profile_id, cost=1, reason="caption_gen")

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

        return {"success": True, "data": {**parsed, "cost_credits": 1}, "provider": active_provider()}
    except Exception as e:
        await log_ai_error(req.user_id, "caption_gen", SONNET, str(e))
        raise HTTPException(status_code=500, detail=str(e))


REEL_SYSTEM = """You are a short-form video content creator for Indian resellers on NirmalMandi.
Create a punchy 15–30 second reel/short video script for a dead inventory deal.

Return ONLY valid JSON with this structure:
{
  "duration_sec": 20,
  "hook_line": "opening spoken line — grabs attention in 3 seconds",
  "segments": [
    { "time": "0-3s",  "text": "hook spoken line", "action": "show product close-up" },
    { "time": "3-10s", "text": "main sell point",  "action": "show price tag / stack of product" },
    { "time": "10-20s","text": "urgency + CTA",    "action": "WhatsApp number on screen" }
  ],
  "caption": "short caption for Instagram/Facebook Reels",
  "hashtags": ["#NirmalMandi","#DeadStock"],
  "voiceover_style": "energetic",
  "background_music": "upbeat Indian pop"
}

Language codes: en=English, hi=Hindi (Devanagari), hinglish=Hindi-English mix, gu=Gujarati, pa=Punjabi, mr=Marathi.
Write ALL text fields in the requested language."""


class ReelScriptRequest(BaseModel):
    product_title: str
    sector: str
    price: float
    mrp: Optional[float] = None
    condition_grade: str = "A"
    city: str = ""
    language: Literal["en", "hi", "hinglish", "gu", "pa", "mr"] = "hi"
    duration: Literal[15, 20, 30] = 20
    user_id: Optional[str] = None
    buyer_profile_id: Optional[str] = None


@router.post("/reel-script")
async def generate_reel_script(req: ReelScriptRequest):
    if req.buyer_profile_id:
        await check_and_deduct(req.buyer_profile_id, cost=1, reason="reel_script")

    discount_pct = round((1 - req.price / req.mrp) * 100) if req.mrp and req.mrp > req.price else 0
    prompt = (
        f"Product: {req.product_title}\n"
        f"Sector: {req.sector} | Grade: {req.condition_grade}\n"
        f"Price: ₹{req.price:,.0f}{f' ({discount_pct}% off MRP)' if discount_pct else ''}\n"
        f"Location: {req.city or 'India'}\n"
        f"Language: {req.language} | Duration: {req.duration} seconds\n"
        f"Generate the reel script now."
    )
    start = __import__('time').time()
    try:
        ai = await complete(REEL_SYSTEM, prompt, preferred_model=HAIKU, max_tokens=600)
        latency_ms = int((__import__('time').time() - start) * 1000)
        await log_ai_call(
            user_id=req.user_id, action_type="reel_script", model=ai.model,
            input_tokens=ai.input_tokens, output_tokens=ai.output_tokens,
            cost_usd=estimate_cost(ai.model, ai.input_tokens, ai.output_tokens),
            latency_ms=latency_ms,
            metadata={"language": req.language, "duration": req.duration},
        )
        json_match = __import__('re').search(r'\{.*\}', ai.text, __import__('re').DOTALL)
        parsed = {}
        if json_match:
            try:
                parsed = __import__('json').loads(json_match.group())
            except Exception:
                parsed = {"hook_line": ai.text.strip()}
        return {"success": True, "data": {**parsed, "cost_credits": 1}, "provider": active_provider()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class DealHookRequest(BaseModel):
    product_title: str
    sector: str
    discount_pct: float
    language: Literal["en", "hi", "hinglish", "gu", "pa", "mr"] = "hi"
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
