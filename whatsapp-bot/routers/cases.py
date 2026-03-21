from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
import json
from services.session import redis
from services.escalation import active_connections

router = APIRouter()

@router.get("/api/cases")
async def get_cases():
    try:
        keys = await redis.keys("escalated:*")
        cases = []
        for key in keys:
            case_data = await redis.get(key)
            if case_data:
                case = json.loads(case_data)
                if not case.get("resolved"):
                    cases.append(case)
        cases.sort(key=lambda x: x.get("escalated_at", ""), reverse=True)
        return cases
    except Exception as e:
        print(f"Redis connection error: {e}")
        return []

@router.get("/api/cases/{phone}")
async def get_case(phone: str):
    keys = await redis.keys("escalated:*")
    matching = []
    for key in keys:
        data = await redis.get(key)
        if data:
            case = json.loads(data)
            if case.get("phone") == phone and not case.get("resolved"):
                matching.append(case)
    if not matching:
        raise HTTPException(404, "Case not found")
    matching.sort(key=lambda x: x.get("escalated_at", ""), reverse=True)
    return matching[0]

@router.post("/api/cases/{phone}/resolve")
async def resolve_case(phone: str):
    keys = await redis.keys("escalated:*")
    from datetime import datetime
    from services.whatsapp import send_message
    import logging
    logger = logging.getLogger(__name__)
    
    message_sent = False

    for key in keys:
        data = await redis.get(key)
        if data:
            case = json.loads(data)
            if case.get("phone") == phone and not case.get("resolved"):
                case["resolved"] = True
                case["resolved_at"] = datetime.utcnow().isoformat()
                await redis.set(key, json.dumps(case))
                # clear doctor mode so if patient messages again
                # they get a fresh AI session
                session_id = case.get("session_id")
                if session_id:
                    await redis.delete(f"mode:{session_id}")
                
                if not message_sent:
                    try:
                        await send_message(phone,
                            "✅ Your consultation has ended.\n\n"
                            "Thank you for using Articuno Bot. We hope you are feeling better! 🙏\n\n"
                            "If you have further concerns, type *restart* to begin a new session "
                            "and our AI will assist you again."
                        )
                        message_sent = True
                    except Exception as e:
                        logger.warning(f"Could not notify patient {phone} on resolve: {e}")

    return {"status": "resolved"}

@router.delete("/api/conversations/{phone}")
async def delete_case(phone: str):
    session_id = await redis.get(f"session:{phone}")
    if session_id:
        await redis.delete(f"chat:{session_id}")
    await redis.delete(f"session:{phone}")
    return {"status": "deleted"}

@router.websocket("/ws/cases")
async def websocket_cases(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            await websocket.receive_text()
            await websocket.send_json({"event": "ping"})
    except WebSocketDisconnect:
        active_connections.remove(websocket)
