"""
AI Search Query Expander
Receives a raw buyer query and returns 5 semantically related search terms
in the same language (Hindi/English/Hinglish), tuned for B2B wholesale inventory.
"""
from fastapi import APIRouter
from pydantic import BaseModel
import json

from app.services.provider import complete

router = APIRouter()

EXPAND_SYSTEM = """You are a search query expander for NirmalMandi, a B2B wholesale marketplace
in India. Buyers search for surplus/dead stock inventory across categories like clothing, FMCG,
pharma, electronics, furniture, machinery, automobiles, and more.

Given a raw search query (may be in English, Hindi, or Hinglish), return exactly 5 alternative or
related search terms that a buyer on this platform would also find relevant. Include synonyms,
related product types, and common spelling variants. Keep terms concise (2-5 words each).

Respond ONLY with a JSON object in this exact format:
{"terms": ["term1", "term2", "term3", "term4", "term5"]}"""


class ExpandRequest(BaseModel):
    query: str


@router.post("/expand")
async def expand_query(body: ExpandRequest):
    q = body.query.strip()
    if not q:
        return {"terms": []}

    try:
        response = await complete(
            system=EXPAND_SYSTEM,
            user_message=q,
            preferred_model="gpt-4o-mini",
            max_tokens=128,
        )
        data = json.loads(response.text)
        terms = data.get("terms", [])
        if not isinstance(terms, list):
            terms = []
        return {"terms": [str(t).strip() for t in terms if t][:5]}
    except Exception:
        # Return the original query so callers always get something
        return {"terms": [q]}
