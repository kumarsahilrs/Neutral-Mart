"""
AI Layer 4 — Pricing Intelligence
Recommends optimal liquidation prices per listing.
"""
import time
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.provider import complete, estimate_cost, active_provider, GPT4O, GPT4O_MINI
from app.services.ai_logger import log_ai_call

router = APIRouter()

SONNET = GPT4O
HAIKU  = GPT4O_MINI

PRICING_SYSTEM = """You are a pricing expert for NirmalMandi, India's dead inventory marketplace.
Recommend an optimal liquidation price for this listing.
Based on typical liquidation pricing for the given sector and condition, return JSON only — no prose.
Format:
{{
  "recommended_price": 0,
  "confidence": 0.0,
  "range_low": 0,
  "range_high": 0,
  "rationale": "",
  "velocity_at_price": {{"7_days": 0.0, "14_days": 0.0, "30_days": 0.0}},
  "pricing_tips": []
}}"""


class PricingRequest(BaseModel):
    sector: str
    product_title: str
    condition_grade: str
    quantity: int
    unit: str
    state: str
    city: str
    dead_stock_type: str
    urgency_days: Optional[int] = 30
    asking_price: float
    mrp: Optional[float] = None
    user_id: Optional[str] = None


@router.post("/recommend")
async def pricing_recommendation(req: PricingRequest):
    prompt = (
        f"Sector: {req.sector}\n"
        f"Product: {req.product_title}\n"
        f"Condition Grade: {req.condition_grade}\n"
        f"Quantity: {req.quantity} {req.unit}\n"
        f"Location: {req.state}, {req.city}\n"
        f"Dead stock type: {req.dead_stock_type}\n"
        f"Must sell in: {req.urgency_days or 30} days\n"
        f"Seller asking price: ₹{req.asking_price:,.0f}\n"
        f"Original MRP: ₹{req.mrp:,.0f}" if req.mrp else "Original MRP: Unknown"
    )
    start = time.time()
    try:
        ai = await complete(PRICING_SYSTEM, prompt, preferred_model=HAIKU, max_tokens=512)
        latency_ms = int((time.time() - start) * 1000)
        cost = estimate_cost(ai.model, ai.input_tokens, ai.output_tokens)

        await log_ai_call(
            user_id=req.user_id, action_type="pricing_rec", model=ai.model,
            input_tokens=ai.input_tokens, output_tokens=ai.output_tokens,
            cost_usd=cost, latency_ms=latency_ms,
        )

        import json, re
        json_match = re.search(r'\{.*\}', ai.text, re.DOTALL)
        parsed = json.loads(json_match.group()) if json_match else {}
        return {"success": True, "data": parsed, "provider": active_provider()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/fair-offer")
async def fair_offer_suggestion(body: dict):
    """Suggest a fair counter-offer price during negotiation."""
    asking = body.get("asking_price", 0)
    buyer_offer = body.get("buyer_offer", 0)
    sector = body.get("sector", "")
    start = time.time()
    try:
        prompt = (
            f"In {sector} dead inventory market, seller asks ₹{asking:,.0f}, "
            f"buyer offers ₹{buyer_offer:,.0f}. "
            f"Suggest a fair deal price. Return JSON only: {{\"fair_price\": 0, \"rationale\": \"\"}}"
        )
        ai = await complete("You are a fair pricing mediator. Return JSON only.", prompt, preferred_model=HAIKU, max_tokens=200)
        latency_ms = int((time.time() - start) * 1000)
        await log_ai_call(
            user_id=body.get("user_id"), action_type="pricing_rec", model=ai.model,
            input_tokens=ai.input_tokens, output_tokens=ai.output_tokens,
            cost_usd=estimate_cost(ai.model, ai.input_tokens, ai.output_tokens),
            latency_ms=latency_ms,
        )
        import json, re
        json_match = re.search(r'\{.*\}', ai.text, re.DOTALL)
        parsed = json.loads(json_match.group()) if json_match else {"fair_price": (asking + buyer_offer) / 2}
        return {"success": True, "data": parsed, "provider": active_provider()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
