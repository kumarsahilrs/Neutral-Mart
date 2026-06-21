"""
Sprint 11 — AI Credit System
5 free AI actions per buyer per day. Balance shown in marketing panel.
DB: buyer_profiles.ai_credits_balance (cumulative) + ai_credit_transactions (log).
Daily free quota is checked against today's 'spent' transactions — no extra column needed.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
import asyncpg

from app.services.ai_logger import get_pool  # shared asyncpg pool

router = APIRouter()

DAILY_FREE_QUOTA = 5


async def get_daily_usage(buyer_profile_id: str) -> int:
    """Count AI actions spent today for this buyer."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT COUNT(*) as used
               FROM ai_credit_transactions
               WHERE buyer_id = $1
                 AND action = 'spent'
                 AND created_at >= NOW()::date""",
            buyer_profile_id,
        )
        return int(row["used"]) if row else 0


async def check_and_deduct(buyer_profile_id: str, cost: int = 1, reason: str = "ai_action") -> dict:
    """
    Check daily quota, then deduct from balance.
    Returns {'allowed': bool, 'daily_used': int, 'balance': int}.
    Raises HTTPException(402) if over quota.
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            daily_used = int((await conn.fetchrow(
                """SELECT COUNT(*) as used FROM ai_credit_transactions
                   WHERE buyer_id = $1 AND action = 'spent' AND created_at >= NOW()::date""",
                buyer_profile_id,
            ))["used"])

            if daily_used >= DAILY_FREE_QUOTA:
                raise HTTPException(
                    status_code=402,
                    detail={
                        "error": "CREDIT_LIMIT_REACHED",
                        "message": f"You've used your {DAILY_FREE_QUOTA} free AI actions for today. Resets at midnight.",
                        "daily_used": daily_used,
                        "daily_limit": DAILY_FREE_QUOTA,
                    },
                )

            # Deduct from buyer_profiles.ai_credits_balance
            row = await conn.fetchrow(
                """UPDATE buyer_profiles
                   SET ai_credits_balance = GREATEST(0, ai_credits_balance - $1)
                   WHERE id = $2
                   RETURNING ai_credits_balance""",
                cost, buyer_profile_id,
            )
            balance = int(row["ai_credits_balance"]) if row else 0

            # Log the transaction
            await conn.execute(
                """INSERT INTO ai_credit_transactions (buyer_id, action, amount, reason)
                   VALUES ($1, 'spent', $2, $3)""",
                buyer_profile_id, cost, reason,
            )

    return {"allowed": True, "daily_used": daily_used + 1, "balance": balance}


# ── GET /ai/credits/balance ────────────────────────────────────────────────────
@router.get("/balance")
async def get_balance(x_buyer_profile_id: Optional[str] = Header(None)):
    """Returns credit balance + today's usage for the authenticated buyer."""
    if not x_buyer_profile_id:
        raise HTTPException(status_code=400, detail="x-buyer-profile-id header required")

    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            profile = await conn.fetchrow(
                "SELECT ai_credits_balance FROM buyer_profiles WHERE id = $1",
                x_buyer_profile_id,
            )
            if not profile:
                raise HTTPException(status_code=404, detail="Buyer profile not found")

            daily_used = int((await conn.fetchrow(
                """SELECT COUNT(*) as used FROM ai_credit_transactions
                   WHERE buyer_id = $1 AND action = 'spent' AND created_at >= NOW()::date""",
                x_buyer_profile_id,
            ))["used"])

        return {
            "success": True,
            "data": {
                "balance": int(profile["ai_credits_balance"]),
                "daily_used": daily_used,
                "daily_limit": DAILY_FREE_QUOTA,
                "daily_remaining": max(0, DAILY_FREE_QUOTA - daily_used),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
