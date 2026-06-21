"""
AI Layer 3 — NirmalMandi Agent
Stateful conversational AI with function calling. Runs in persistent side panel.
Voice-to-voice Hindi support. Navigates and transacts on behalf of the user.
"""
import time
import json
from typing import Literal
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from app.services.ai_logger import log_ai_call, log_ai_error, estimate_cost
from app.services.provider import get_client, GPT4O, active_provider

router = APIRouter()
MODEL = GPT4O

AGENT_SYSTEM = """You are the NirmalMandi assistant — a helpful AI for India's dead inventory liquidation marketplace.
You help buyers find deals, sellers manage listings, and admins monitor the platform.

Current user: {user_name} | Role: {user_role} | Language: {user_language}
Current screen: {current_route}

You can execute actions using the provided tools.
Always confirm before executing destructive actions (suspend, delist, etc.)
Respond in the user's preferred language ({user_language}).
Be concise — this is a business context, not casual chat.

When executing an action, briefly explain what you did.
For voice inputs: respond in natural spoken sentences, not lists.
For text inputs: use minimal formatting appropriate for a chat interface.

Common Hindi phrases you should understand:
- "Mujhe aaj ke best deals dikhao" → show today's best deals
- "Mera order kahan hai" → show order tracking
- "Market karo is product ko" → generate marketing content
- "Meri listing band karo" → pause listing
- "Naya listing banana hai" → create new listing"""

# OpenAI function-calling format
AGENT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_listings",
            "description": "Search the NirmalMandi marketplace for listings",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                    "sector": {"type": "string", "description": "Filter by sector slug"},
                    "city": {"type": "string"},
                    "max_price": {"type": "number"},
                    "condition_grade": {"type": "string", "enum": ["A", "B", "C", "D"]},
                    "limit": {"type": "integer", "default": 5},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_order_status",
            "description": "Get the status and tracking info of a specific order",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {"type": "string"},
                    "order_number": {"type": "string"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_my_listings",
            "description": "Get the seller's active listings",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {"type": "string", "enum": ["live", "paused", "sold", "all"], "default": "live"},
                    "limit": {"type": "integer", "default": 10},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "pause_listing",
            "description": "Pause a seller's live listing (requires confirmation)",
            "parameters": {
                "type": "object",
                "properties": {"listing_id": {"type": "string"}},
                "required": ["listing_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_marketing_content",
            "description": "Generate AI marketing caption for a product",
            "parameters": {
                "type": "object",
                "properties": {
                    "listing_id": {"type": "string"},
                    "platform": {"type": "string", "enum": ["whatsapp", "instagram", "facebook"]},
                    "language": {"type": "string", "enum": ["hi", "en", "hinglish"]},
                },
                "required": ["listing_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "raise_dispute",
            "description": "Raise a dispute on an order",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {"type": "string"},
                    "reason": {"type": "string"},
                    "description": {"type": "string"},
                },
                "required": ["order_id", "reason", "description"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "add_to_cart",
            "description": "Add a listing to the buyer's cart",
            "parameters": {
                "type": "object",
                "properties": {
                    "listing_id": {"type": "string"},
                    "quantity": {"type": "integer", "default": 1},
                },
                "required": ["listing_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_platform_stats",
            "description": "Get platform KPIs (admin only)",
            "parameters": {
                "type": "object",
                "properties": {"period": {"type": "string", "enum": ["today", "week", "month"]}},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "navigate_to",
            "description": "Navigate the user to a specific screen in the app",
            "parameters": {
                "type": "object",
                "properties": {"screen": {"type": "string", "description": "Screen name or route"}},
                "required": ["screen"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "explain_document",
            "description": "Explain an invoice, escrow status, or compliance document in plain language",
            "parameters": {
                "type": "object",
                "properties": {
                    "document_type": {"type": "string", "enum": ["invoice", "escrow", "compliance", "payout"]},
                    "document_id": {"type": "string"},
                },
                "required": ["document_type"],
            },
        },
    },
]


class AgentMessageRequest(BaseModel):
    message: str
    conversation_history: list[dict] = []
    user_id: str
    user_name: str
    user_role: Literal["buyer", "seller", "admin"] = "buyer"
    user_language: Literal["en", "hi"] = "hi"
    current_route: str = "home"


@router.post("/message")
async def agent_message(req: AgentMessageRequest):
    start = time.time()
    system = AGENT_SYSTEM.format(
        user_name=req.user_name,
        user_role=req.user_role,
        user_language=req.user_language,
        current_route=req.current_route,
    )
    # Convert history: keep only role+content entries (skip tool call entries)
    history = [
        m for m in req.conversation_history
        if isinstance(m.get("content"), str) and m.get("role") in ("user", "assistant")
    ]
    messages = [{"role": "system", "content": system}] + history + [{"role": "user", "content": req.message}]

    try:
        resp = await get_client().chat.completions.create(
            model=MODEL,
            max_tokens=1024,
            messages=messages,
            tools=AGENT_TOOLS,
            tool_choice="auto",
        )
        latency_ms = int((time.time() - start) * 1000)
        choice = resp.choices[0]
        input_tokens = resp.usage.prompt_tokens
        output_tokens = resp.usage.completion_tokens

        await log_ai_call(
            user_id=req.user_id,
            action_type="agent_message",
            model=MODEL,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_usd=estimate_cost(MODEL, input_tokens, output_tokens),
            latency_ms=latency_ms,
            metadata={"route": req.current_route, "role": req.user_role},
        )

        text_response = choice.message.content or ""
        tool_calls = []
        if choice.message.tool_calls:
            for tc in choice.message.tool_calls:
                tool_calls.append({
                    "tool": tc.function.name,
                    "input": json.loads(tc.function.arguments or "{}"),
                    "id": tc.id,
                })

        updated_history = history + [
            {"role": "user", "content": req.message},
            {"role": "assistant", "content": text_response},
        ]

        return {
            "success": True,
            "data": {
                "response": text_response,
                "tool_calls": tool_calls,
                "conversation_history": updated_history,
                "stop_reason": choice.finish_reason,
                "provider": active_provider(),
            },
        }
    except Exception as e:
        await log_ai_error(req.user_id, "agent_message", MODEL, str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/voice")
async def agent_voice(
    audio: UploadFile = File(...),
    user_id: str = Form(""),
    user_name: str = Form("User"),
    user_role: str = Form("buyer"),
    user_language: str = Form("hi"),
    current_route: str = Form("home"),
):
    """Voice input → Whisper transcription → Agent → text response (TTS on client)."""
    audio_bytes = await audio.read()
    try:
        transcription_resp = await get_client().audio.transcriptions.create(
            model="whisper-1",
            file=(audio.filename or "audio.webm", audio_bytes, audio.content_type or "audio/webm"),
            language=user_language,
        )
        transcription = transcription_resp.text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

    if not transcription:
        raise HTTPException(status_code=400, detail="Could not transcribe audio")

    agent_req = AgentMessageRequest(
        message=transcription,
        user_id=user_id,
        user_name=user_name,
        user_role=user_role,  # type: ignore
        user_language=user_language,  # type: ignore
        current_route=current_route,
    )
    agent_response = await agent_message(agent_req)
    text_reply = agent_response["data"]["response"]

    return {
        "success": True,
        "data": {
            "transcription": transcription,
            "response": text_reply,
            "tool_calls": agent_response["data"]["tool_calls"],
            "tts_text": text_reply,
        },
    }
