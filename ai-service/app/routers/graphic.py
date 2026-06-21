"""
Sprint 11 — AI Branded Graphic Generator
DALL-E 3 generates a product marketing background; Pillow adds price/badge overlay.
Formats: square (1024x1024), horizontal (1792x1024), vertical (1024x1792).
Cost: 1 credit per graphic.
"""
import time
import io
import base64
import httpx
from typing import Literal, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from PIL import Image, ImageDraw, ImageFont

from app.services.provider import generate_image, estimate_image_cost, active_provider
from app.services.ai_logger import log_ai_call
from app.routers.credits import check_and_deduct

router = APIRouter()

FORMAT_SIZES: dict[str, str] = {
    "square":     "1024x1024",
    "horizontal": "1792x1024",
    "vertical":   "1024x1792",
}

GRAPHIC_CREDITS = 1  # credits consumed per graphic


class GraphicRequest(BaseModel):
    product_title: str
    sector: str
    price: float
    mrp: Optional[float] = None
    condition_grade: str = "A"
    city: str = ""
    format: Literal["square", "horizontal", "vertical"] = "square"
    quality: Literal["standard", "hd"] = "standard"
    user_id: Optional[str] = None
    buyer_profile_id: Optional[str] = None


def _build_prompt(req: GraphicRequest) -> str:
    discount_pct = round((1 - req.price / req.mrp) * 100) if req.mrp and req.mrp > req.price else 0
    discount_text = f", {discount_pct}% off MRP" if discount_pct else ""
    return (
        f"A vibrant, professional product marketing banner for an Indian B2B wholesale marketplace. "
        f"Product category: {req.sector}. The image should evoke {req.product_title}. "
        f"Style: bold gradient background in saffron and green (Indian flag colors), "
        f"clean modern layout, high contrast, suitable for WhatsApp and Instagram. "
        f"No text overlaid — clean background for text to be added later. "
        f"Photorealistic product showcase{discount_text}. "
        f"City context: {req.city or 'India'}. Grade {req.condition_grade} quality."
    )


async def _download_image(url: str) -> bytes:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.content


def _add_overlay(image_bytes: bytes, req: GraphicRequest) -> bytes:
    """Add price chip, discount badge, and NirmalMandi watermark using Pillow."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    w, h = img.size
    draw = ImageDraw.Draw(img)

    # Try to load a font; fall back to default
    try:
        title_font = ImageFont.truetype("arial.ttf", max(28, h // 22))
        price_font = ImageFont.truetype("arial.ttf", max(36, h // 16))
        small_font = ImageFont.truetype("arial.ttf", max(18, h // 36))
    except OSError:
        title_font = ImageFont.load_default()
        price_font = title_font
        small_font = title_font

    padding = int(w * 0.04)

    # Bottom gradient strip (semi-transparent)
    strip_h = int(h * 0.28)
    strip = Image.new("RGBA", (w, strip_h), (0, 0, 0, 0))
    for y in range(strip_h):
        alpha = int(200 * (y / strip_h))
        for x in range(w):
            strip.putpixel((x, y), (0, 0, 0, alpha))
    img.paste(strip, (0, h - strip_h), strip)

    # Discount badge (top-right)
    discount_pct = round((1 - req.price / req.mrp) * 100) if req.mrp and req.mrp > req.price else 0
    if discount_pct > 0:
        badge_text = f"-{discount_pct}%"
        bw, bh = int(w * 0.16), int(h * 0.1)
        bx, by = w - bw - padding, padding
        draw.ellipse([bx, by, bx + bw, by + bh], fill=(220, 38, 38, 230))  # red badge
        draw.text((bx + bw // 2, by + bh // 2), badge_text, font=price_font,
                  fill="white", anchor="mm")

    # Product title
    title = req.product_title[:50] + ("…" if len(req.product_title) > 50 else "")
    draw.text((padding, h - strip_h + padding), title,
              font=title_font, fill=(255, 255, 255, 240))

    # Price
    price_text = f"₹{req.price:,.0f}"
    draw.text((padding, h - strip_h + padding + int(h * 0.07)), price_text,
              font=price_font, fill=(250, 204, 21, 255))  # yellow price

    # City + grade
    if req.city:
        draw.text((padding, h - int(h * 0.06)), f"{req.city} · Grade {req.condition_grade}",
                  font=small_font, fill=(200, 200, 200, 200))

    # NirmalMandi watermark (bottom-right)
    wm = "NirmalMandi.com"
    wm_bbox = draw.textbbox((0, 0), wm, font=small_font)
    wm_w = wm_bbox[2] - wm_bbox[0]
    draw.text((w - wm_w - padding, h - int(h * 0.06)), wm,
              font=small_font, fill=(255, 255, 255, 160))

    out = io.BytesIO()
    img.convert("RGB").save(out, format="JPEG", quality=90)
    return out.getvalue()


@router.post("/graphic")
async def generate_graphic(req: GraphicRequest):
    size = FORMAT_SIZES.get(req.format, "1024x1024")
    start = time.time()

    try:
        # Generate background with DALL-E 3
        image_url = await generate_image(
            prompt=_build_prompt(req),
            size=size,
            quality=req.quality,
        )

        # Download the image
        image_bytes = await _download_image(image_url)

        # Add price/badge/watermark overlay
        final_bytes = _add_overlay(image_bytes, req)
        image_b64 = base64.b64encode(final_bytes).decode()

        latency_ms = int((time.time() - start) * 1000)
        cost_usd = estimate_image_cost(size, req.quality)

        await log_ai_call(
            user_id=req.user_id,
            action_type="graphic_gen",
            model="dall-e-3",
            input_tokens=0,
            output_tokens=0,
            cost_usd=cost_usd,
            latency_ms=latency_ms,
            metadata={"format": req.format, "size": size, "quality": req.quality},
        )

        # Deduct credit only on success
        if req.buyer_profile_id:
            await check_and_deduct(req.buyer_profile_id, cost=GRAPHIC_CREDITS, reason="graphic_gen")

        return {
            "success": True,
            "data": {
                "image_b64": f"data:image/jpeg;base64,{image_b64}",
                "format": req.format,
                "size": size,
                "cost_credits": GRAPHIC_CREDITS,
                "cost_usd": cost_usd,
            },
            "provider": active_provider(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graphic generation failed: {str(e)}")
