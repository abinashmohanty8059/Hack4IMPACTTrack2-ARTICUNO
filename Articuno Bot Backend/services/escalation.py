import json
import asyncio
from datetime import datetime
import google.generativeai as genai
from services.session import redis, get_session

# This holds connected WebSocket clients for real-time dashboard notifications
active_connections = []

async def escalate(phone: str, session_id: str, summary: dict,
                   reason: str, urgency: str, conversation: list):

    case = {
        "phone": phone,
        "session_id": session_id,
        "display_id": session_id[-6:],
        "severity": urgency,
        "chief_complaint": summary.get("chief_complaint", ""),
        "symptoms": summary.get("symptoms", []),
        "duration": summary.get("duration", ""),
        "allergies": summary.get("allergies", ""),
        "medications": summary.get("medications", ""),
        "red_flags": summary.get("red_flags", []),
        "summary_text": (
            f"{summary.get('chief_complaint','')}. "
            f"Severity: {summary.get('severity','')}. "
            f"Duration: {summary.get('duration','')}."
        ),
        "recommendation": summary.get("recommendation", ""),
        "reason": reason,
        "conversation": conversation,
        "escalated_at": datetime.utcnow().isoformat(),
        "resolved": False
    }

    await redis.set(f"escalated:{session_id}", json.dumps(case))

    for ws in active_connections:
        try:
            await ws.send_json({
                "event": "new_case",
                "phone": phone,
                "session_id": session_id,
                "urgency": urgency
            })
        except:
            pass
