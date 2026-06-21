"""
Sprint 12 — Google Cloud Text-to-Speech
POST /ai/agent/tts → returns base64 MP3 audio.
Requires GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service account JSON,
OR GOOGLE_TTS_API_KEY for the simpler REST API key flow.
Falls back gracefully: if neither is set, returns 503 (web client falls back to speechSynthesis).
"""
import os
import base64
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

GOOGLE_API_KEY = os.environ.get("GOOGLE_TTS_API_KEY", "")

_tts_client = None

def _get_client():
    global _tts_client
    if _tts_client is None:
        from google.cloud import texttospeech
        _tts_client = texttospeech.TextToSpeechClient()
    return _tts_client


class TtsRequest(BaseModel):
    text: str
    language_code: str = "hi-IN"
    voice_name: str = ""
    speaking_rate: float = 1.0


@router.post("/tts")
async def synthesise_speech(req: TtsRequest):
    text = req.text.strip()[:500]  # cap at 500 chars
    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    # Try Google REST API (API key flow) — simpler, no service account needed
    if GOOGLE_API_KEY:
        return await _rest_tts(text, req)

    # Try Google SDK (service account flow)
    creds_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
    if creds_path and os.path.exists(creds_path):
        return _sdk_tts(text, req)

    raise HTTPException(
        status_code=503,
        detail="Google TTS not configured. Set GOOGLE_TTS_API_KEY or GOOGLE_APPLICATION_CREDENTIALS.",
    )


async def _rest_tts(text: str, req: TtsRequest) -> dict:
    import httpx
    voice_name = req.voice_name or _default_voice(req.language_code)
    payload = {
        "input": {"text": text},
        "voice": {
            "languageCode": req.language_code,
            "name": voice_name,
        },
        "audioConfig": {
            "audioEncoding": "MP3",
            "speakingRate": req.speaking_rate,
        },
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            f"https://texttospeech.googleapis.com/v1/text:synthesize?key={GOOGLE_API_KEY}",
            json=payload,
        )
        resp.raise_for_status()
        audio_b64 = resp.json().get("audioContent", "")

    return {
        "success": True,
        "data": {"audio_b64": audio_b64, "mime_type": "audio/mpeg"},
    }


def _sdk_tts(text: str, req: TtsRequest) -> dict:
    from google.cloud import texttospeech
    client = _get_client()
    synthesis_input = texttospeech.SynthesisInput(text=text)
    voice = texttospeech.VoiceSelectionParams(
        language_code=req.language_code,
        name=req.voice_name or _default_voice(req.language_code),
    )
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=req.speaking_rate,
    )
    response = client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )
    audio_b64 = base64.b64encode(response.audio_content).decode()
    return {
        "success": True,
        "data": {"audio_b64": audio_b64, "mime_type": "audio/mpeg"},
    }


def _default_voice(language_code: str) -> str:
    defaults = {
        "hi-IN": "hi-IN-Wavenet-A",
        "en-IN": "en-IN-Wavenet-A",
        "en-US": "en-US-Wavenet-D",
    }
    return defaults.get(language_code, "hi-IN-Wavenet-A")
