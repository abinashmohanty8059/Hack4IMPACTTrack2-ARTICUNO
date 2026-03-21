import os
import json
import aioredis
import time
import hashlib
from dotenv import load_dotenv

load_dotenv()

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
redis = aioredis.from_url(redis_url, decode_responses=True)

async def create_session(phone: str) -> str:
    """Generate a new session ID and store it as the active session for this phone."""
    session_id = phone + "_" + str(int(time.time()))
    await redis.set(f"session:{phone}", session_id, ex=86400)
    return session_id

async def get_session(phone: str) -> str:
    """Get current active session ID for phone. Create one if none exists."""
    session_id = await redis.get(f"session:{phone}")
    if not session_id:
        session_id = await create_session(phone)
    return session_id

async def get_history(phone: str) -> list:
    session_id = await get_session(phone)
    data = await redis.get(f"chat:{session_id}")
    return json.loads(data) if data else []

async def save_history(phone: str, history: list):
    session_id = await get_session(phone)
    serializable = []
    for h in history:
        if isinstance(h, dict):
            serializable.append(h)
        else:
            serializable.append({
                "role": h.role,
                "parts": [{"text": p.text} for p in h.parts]
            })
    await redis.set(f"chat:{session_id}", json.dumps(serializable), ex=86400)

async def get_mode(session_id: str) -> str:
    """Returns 'ai' or 'doctor'. Default is 'ai'."""
    mode = await redis.get(f"mode:{session_id}")
    return mode if mode else "ai"

async def set_mode(session_id: str, mode: str):
    """Set session mode to 'ai' or 'doctor'."""
    await redis.set(f"mode:{session_id}", mode, ex=86400)

async def clear_session(phone: str):
    """Full cleanup for restart — wipe session, mode, history, turns."""
    session_id = await get_session(phone)
    if session_id:
        await redis.delete(f"chat:{session_id}")
        await redis.delete(f"turns:{session_id}")
        await redis.delete(f"mode:{session_id}")
    await redis.delete(f"session:{phone}")

async def get_turn_count(phone: str) -> int:
    session_id = await get_session(phone)
    data = await redis.get(f"turns:{session_id}")
    return int(data) if data else 0

async def increment_turns(phone: str):
    session_id = await get_session(phone)
    await redis.incr(f"turns:{session_id}")
    await redis.expire(f"turns:{session_id}", 86400)
