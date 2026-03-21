from fastapi import APIRouter
import json
from datetime import datetime
from models.case import SendRequest
from services.whatsapp import send_message
from services.session import redis, get_session, get_history, save_history

router = APIRouter()

@router.post("/api/send")
async def send_to_patient(payload: SendRequest):
    await send_message(payload.to, payload.message)
    # append to conversation in Redis
    session_id = await get_session(payload.to)
    history = await get_history(payload.to)
    history.append({
        "role": "doctor",
        "parts": [{"text": payload.message}],
        "sent_at": datetime.utcnow().isoformat()
    })
    await save_history(payload.to, history)
    
    # Also optionally sync it back to the escalated snapshot so dashboard survives reloads
    data = await redis.get(f"escalated:{session_id}")
    if data:
        case = json.loads(data)
        case["conversation"] = history
        await redis.set(f"escalated:{session_id}", json.dumps(case))
        
    return {"status": "sent"}
