"""
AI Layer 1 — Prompt Listing Engine
Sellers describe dead inventory in natural language (Hindi/English/Hinglish).
AI extracts all structured fields. No traditional forms.
"""
import time
import base64
import json
import re
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.ai_logger import log_ai_call, log_ai_error
from app.services.provider import complete, estimate_cost, active_provider, get_client, GPT4O

router = APIRouter()

MODEL = GPT4O

SECTOR_LIST = [
    "automobiles", "clothing", "furniture", "fmcg", "pharma", "software", "machinery"
]

LISTING_SYSTEM_PROMPT = """You are NirmalMandi's listing assistant. Your job is to help sellers list
their dead inventory as quickly as possible.

When a seller describes their stock:
1. Identify the most likely sector from: {sector_list}
2. Return a confidence score (0-1)
3. If confidence < 0.7, ask ONE clarifying question
4. Extract all fields present in the sector schema: {sector_schema}
5. For missing required fields, ask conversationally — one question at a time
6. Never ask for fields that are optional and not mentioned

Always respond in the same language the seller used (Hindi/English/Hinglish).
Be brief, warm, and practical. The seller is a busy businessperson.

Return structured JSON for field extractions alongside your conversational response.
Format: {{ "extracted_fields": {{}}, "missing_required": [], "questions": [], "confidence": 0.0, "detected_sector": "", "conversational_response": "" }}"""

VISION_PROMPT = """Analyze this product image for a dead inventory marketplace listing.
Extract all visible information:
- Product type and category
- Brand name if visible
- Condition assessment (A/B/C/D) based on visible wear/damage
- Quantity estimate if multiple units visible
- Any visible text: price tags, batch numbers, expiry dates, barcodes
- Packaging condition
- Any damage or defects visible

Return as structured JSON only. Be conservative — only report what you can clearly see.
Format: {{ "product_type": "", "brand": "", "condition_grade": "", "quantity_estimate": null, "visible_text": [], "packaging_condition": "", "defects": [], "confidence": 0.0 }}"""


class PromptRequest(BaseModel):
    seller_prompt: str
    sector_slug: Optional[str] = None
    sector_schema: Optional[dict] = None
    conversation_history: list[dict] = []
    user_id: Optional[str] = None


class VisionRequest(BaseModel):
    image_base64: str
    image_mime: str = "image/jpeg"
    user_id: Optional[str] = None


@router.post("/prompt")
async def listing_prompt(req: PromptRequest):
    """
    Step 1-4 of AI listing flow: natural language → structured fields.
    """
    start = time.time()
    system = LISTING_SYSTEM_PROMPT.format(
        sector_list=", ".join(SECTOR_LIST),
        sector_schema=req.sector_schema or "{}",
    )
    messages = req.conversation_history + [{"role": "user", "content": req.seller_prompt}]

    try:
        ai = await complete(system, req.seller_prompt, preferred_model=MODEL, max_tokens=1024, conversation_history=req.conversation_history)
        latency_ms = int((time.time() - start) * 1000)
        cost = estimate_cost(ai.model, ai.input_tokens, ai.output_tokens)

        await log_ai_call(
            user_id=req.user_id,
            action_type="listing_prompt",
            model=ai.model,
            input_tokens=ai.input_tokens,
            output_tokens=ai.output_tokens,
            cost_usd=cost,
            latency_ms=latency_ms,
        )

        import json, re
        json_match = re.search(r'\{.*\}', ai.text, re.DOTALL)
        parsed = {}
        if json_match:
            try:
                parsed = json.loads(json_match.group())
            except json.JSONDecodeError:
                pass

        return {
            "success": True,
            "data": {
                "raw_response": ai.text,
                "extracted_fields": parsed.get("extracted_fields", {}),
                "missing_required": parsed.get("missing_required", []),
                "questions": parsed.get("questions", []),
                "confidence": parsed.get("confidence", 0.5),
                "detected_sector": parsed.get("detected_sector", req.sector_slug),
                "conversational_response": parsed.get("conversational_response", ai.text),
                "conversation_history": req.conversation_history + [
                    {"role": "user", "content": req.seller_prompt},
                    {"role": "assistant", "content": ai.text},
                ],
                "provider": active_provider(),
            }
        }
    except Exception as e:
        await log_ai_error(req.user_id, "listing_prompt", MODEL, str(e))
        raise HTTPException(status_code=500, detail=f"AI listing engine error: {str(e)}")


@router.post("/vision")
async def listing_vision(req: VisionRequest):
    """Analyze product image and extract visible listing fields (gpt-4o vision)."""
    start = time.time()
    try:
        resp = await get_client().chat.completions.create(
            model=MODEL,
            max_tokens=512,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{req.image_mime};base64,{req.image_base64}",
                        },
                    },
                    {"type": "text", "text": VISION_PROMPT},
                ],
            }],
        )
        latency_ms = int((time.time() - start) * 1000)
        content = resp.choices[0].message.content or ""
        input_tokens = resp.usage.prompt_tokens
        output_tokens = resp.usage.completion_tokens

        await log_ai_call(
            user_id=req.user_id,
            action_type="vision_analysis",
            model=MODEL,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_usd=estimate_cost(MODEL, input_tokens, output_tokens),
            latency_ms=latency_ms,
        )

        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        parsed = {}
        if json_match:
            try:
                parsed = json.loads(json_match.group())
            except json.JSONDecodeError:
                pass

        return {"success": True, "data": parsed}
    except Exception as e:
        await log_ai_error(req.user_id, "vision_analysis", MODEL, str(e))
        raise HTTPException(status_code=500, detail=f"Vision analysis error: {str(e)}")


@router.post("/category/suggest")
async def suggest_category(body: dict):
    """If no sector matches >60% confidence, AI generates a new category."""
    description = body.get("description", "")
    start = time.time()
    try:
        ai = await complete(
            system="You are NirmalMandi's category manager.",
            user_message=(
                f'A seller described their product as: "{description}"\n'
                'This does not match any existing sector well. Generate a new category for NirmalMandi.\n'
                'Return JSON: { "name": "", "slug": "", "description": "", '
                '"schema_fields": [{ "key": "", "label": "", "type": "text|number|date|select", '
                '"required": true/false, "options": [] }] }'
            ),
            preferred_model=MODEL,
            max_tokens=512,
        )
        latency_ms = int((time.time() - start) * 1000)
        await log_ai_call(
            user_id=body.get("user_id"),
            action_type="listing_prompt",
            model=ai.model,
            input_tokens=ai.input_tokens,
            output_tokens=ai.output_tokens,
            cost_usd=estimate_cost(ai.model, ai.input_tokens, ai.output_tokens),
            latency_ms=latency_ms,
        )
        json_match = re.search(r'\{.*\}', ai.text, re.DOTALL)
        parsed = json.loads(json_match.group()) if json_match else {}
        return {"success": True, "data": parsed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
