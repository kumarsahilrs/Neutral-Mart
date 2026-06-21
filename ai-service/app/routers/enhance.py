"""
Sprint 15 — AI Image Enhancement
Two-stage pipeline:
  Stage 1: Pillow auto-enhancement (free, instant) — brightness/contrast/sharpness/colour correction
  Stage 2 (optional): GPT-4o vision analysis → DALL-E 3 regeneration (1 AI credit)

Returns the enhanced image as base64 JPEG. Never stored server-side.
"""
import io
import base64
from typing import Optional, Literal
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from PIL import Image, ImageEnhance, ImageFilter

from app.services.provider import get_client, GPT4O, DALLE3, generate_image
from app.services.ai_logger import log_ai_call, estimate_cost
from app.routers.credits import check_and_deduct

router = APIRouter()


class EnhanceRequest(BaseModel):
    image_b64: str                            # base64 data URI or raw base64
    image_mime: str = "image/jpeg"
    mode: Literal["auto", "ai"] = "auto"     # auto = Pillow only, ai = DALL-E regen
    user_id: Optional[str] = None
    buyer_profile_id: Optional[str] = None


def _strip_data_uri(b64: str) -> bytes:
    """Strip 'data:image/...;base64,' prefix if present."""
    if b64.startswith("data:"):
        b64 = b64.split(",", 1)[1]
    return base64.b64decode(b64)


def _pillow_enhance(img: Image.Image) -> Image.Image:
    """Auto-enhance: brightness, contrast, colour, sharpness."""
    img = img.convert("RGB")
    # Slight brightness boost
    img = ImageEnhance.Brightness(img).enhance(1.08)
    # Contrast boost
    img = ImageEnhance.Contrast(img).enhance(1.15)
    # Colour saturation boost
    img = ImageEnhance.Color(img).enhance(1.12)
    # Moderate sharpness
    img = ImageEnhance.Sharpness(img).enhance(1.25)
    # Mild unsharp mask for edge clarity
    img = img.filter(ImageFilter.UnsharpMask(radius=1, percent=80, threshold=3))
    return img


def _to_b64_jpeg(img: Image.Image, quality: int = 90) -> str:
    buf = io.BytesIO()
    img.convert("RGB").save(buf, format="JPEG", quality=quality, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


async def _describe_and_regen(img: Image.Image, b64_raw: str, mime: str) -> str:
    """Use GPT-4o vision to describe the product, then DALL-E 3 to regenerate a clean version."""
    client = get_client()

    # Step 1: Describe with GPT-4o vision
    vision_resp = await client.chat.completions.create(
        model=GPT4O,
        max_tokens=300,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{mime};base64,{b64_raw}"},
                },
                {
                    "type": "text",
                    "text": (
                        "Describe this product image for regeneration. "
                        "Focus on: product type, colour, packaging, condition, background. "
                        "Keep it under 80 words. Be specific and factual."
                    ),
                },
            ],
        }],
    )
    description = vision_resp.choices[0].message.content or "product on white background"

    # Step 2: DALL-E 3 regeneration
    prompt = (
        f"Professional product photography: {description}. "
        "Clean white background, soft studio lighting, sharp focus, "
        "high resolution, suitable for e-commerce catalogue. No text overlaid."
    )
    image_url = await generate_image(prompt, size="1024x1024", quality="standard")

    # Download and return
    import httpx
    async with httpx.AsyncClient(timeout=20) as http:
        resp = await http.get(image_url)
        resp.raise_for_status()
        img_data = resp.content

    enhanced = Image.open(io.BytesIO(img_data))
    return _to_b64_jpeg(enhanced)


@router.post("/enhance-image")
async def enhance_image(req: EnhanceRequest):
    raw_bytes = _strip_data_uri(req.image_b64)
    try:
        img = Image.open(io.BytesIO(raw_bytes))
        img.verify()  # raises UnidentifiedImageError / SyntaxError for corrupt/unsupported
        img = Image.open(io.BytesIO(raw_bytes))  # reopen after verify (verify exhausts the stream)
    except Exception:
        raise HTTPException(status_code=400, detail="Unsupported or corrupt image format. Send JPEG, PNG, or WebP.")

    if req.mode == "auto":
        enhanced = _pillow_enhance(img)
        return {
            "success": True,
            "data": {
                "image_b64": _to_b64_jpeg(enhanced),
                "mode": "auto",
                "cost_credits": 0,
            },
        }

    # AI mode — costs 1 credit
    if req.buyer_profile_id:
        await check_and_deduct(req.buyer_profile_id, cost=1, reason="image_enhance")

    # Stage 1: Pillow pass first (improves source quality for vision model)
    enhanced_pil = _pillow_enhance(img)
    pil_buf = io.BytesIO()
    enhanced_pil.convert("RGB").save(pil_buf, format="JPEG", quality=90)
    b64_for_vision = base64.b64encode(pil_buf.getvalue()).decode()

    result_b64 = await _describe_and_regen(enhanced_pil, b64_for_vision, "image/jpeg")

    await log_ai_call(
        user_id=req.user_id,
        action_type="image_enhance",
        model=DALLE3,
        input_tokens=0, output_tokens=0,
        cost_usd=0.040,
        latency_ms=0,
        metadata={"mode": "ai"},
    )

    return {
        "success": True,
        "data": {
            "image_b64": result_b64,
            "mode": "ai",
            "cost_credits": 1,
        },
    }
