from fastapi import APIRouter, Request, Query, HTTPException
from fastapi.responses import PlainTextResponse
import os
from services.llm import chat
from services.session import (
    get_session, get_mode, set_mode,
    get_history, save_history,
    get_turn_count, increment_turns,
    clear_session, redis
)
from services.whatsapp import send_message
from services.escalation import escalate
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
WA_VERIFY_TOKEN = os.getenv("WA_VERIFY_TOKEN")

from datetime import datetime
import logging
logger = logging.getLogger(__name__)

RESET_KEYWORDS = {
    "restart", "reset", "start over", "start again",
    "new chat", "clear"
}

@router.post("/webhook")
async def receive(body: dict):
    try:
        value = body.get("entry", [{}])[0].get("changes", [{}])[0].get("value", {})
        if "messages" not in value:
            return {"status": "ignored"}

        msg = value["messages"][0]

        # ignore non-text messages (images, audio, etc.)
        if msg.get("type") != "text":
            return {"status": "ignored"}

        phone = msg["from"]
        text = msg["text"]["body"].strip()
        text_lower = text.lower()

        # ── RESTART ──────────────────────────────────────────
        if text_lower in RESET_KEYWORDS:
            await clear_session(phone)
            await send_message(phone,
                "Your conversation has been reset! 🔄\n\n"
                "Hi! I'm Articuno Bot. How can I help you today?"
            )
            return {"status": "ok"}

        # ── GET CURRENT SESSION ───────────────────────────────
        session_id = await get_session(phone)
        mode = await get_mode(session_id)

        # ── DOCTOR MODE — LLM STAYS SILENT ───────────────────
        if mode == "doctor":
            # Patient message in doctor mode —
            # send a holding message only on first patient reply
            # after escalation (doctor may not have responded yet)
            turn = await get_turn_count(phone)
            if turn == 0:
                await send_message(phone,
                    "⏳ Our doctor has been notified and will reply shortly. "
                    "Please stay available on WhatsApp."
                )
                await increment_turns(phone)
            # Do NOT call LLM — just return ok
            # The raw message is visible to doctor via the dashboard
            # Append patient message to conversation in Redis
            history = await get_history(phone)
            history.append({
                "role": "user",
                "parts": [{"text": text}],
                "sent_at": datetime.utcnow().isoformat()
            })
            await save_history(phone, history)
            return {"status": "ok"}

        # ── AI MODE — normal LLM processing ──────────────────
        await increment_turns(phone)
        result = await chat(phone, text)

        if result["type"] == "message":
            # normal reply
            await send_message(phone, result["text"])

        elif result["type"] == "handover":
            # LLM decided to hand over
            # 1. Send patient_message to patient
            await send_message(phone, result["patient_message"])
            # 2. Set mode to doctor
            await set_mode(session_id, "doctor")
            # 3. Reset turn counter for doctor mode
            await redis.set(f"turns:{session_id}", "0", ex=86400)
            # 4. Get full conversation for case record
            history = await get_history(phone)
            # 5. Create escalated case
            await escalate(
                phone=phone,
                session_id=session_id,
                summary=result["summary"],
                reason=result["reason"],
                urgency=result["urgency"],
                conversation=history
            )

    except Exception as e:
        logger.error(f"Webhook error: {e}")

    return {"status": "ok"}
