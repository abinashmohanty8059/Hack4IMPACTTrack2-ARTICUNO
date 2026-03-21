import os
import json
import asyncio
from google import genai
from google.genai import types
from dotenv import load_dotenv
from services.session import get_history, save_history

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """
You are Articuno Bot, a compassionate medical triage assistant on WhatsApp.
Your job is to understand the patient's medical concern clearly and
decide whether they can be helped with general guidance OR need a real doctor.

CONVERSATION RULES:
- Ask focused questions one at a time — do not overwhelm
- Gather: main symptom, duration, severity (1-10), associated symptoms,
  known allergies, current medications, relevant history
- Keep every reply under 120 words
- Be warm, calm, and never alarming
- Never give a definitive diagnosis

HANDOVER DECISION:
After gathering enough information, you must make ONE of two decisions:

DECISION A — Continue helping:
  If the issue is mild (cold, minor headache, general wellness question)
  continue the conversation normally. No special formatting needed.

DECISION B — Hand over to doctor:
  If ANY of these are true:
  - Symptoms suggest a potentially serious condition
  - Patient has been chatting for 5+ turns with no resolution
  - Patient explicitly asks to speak to a doctor
  - You are uncertain and the risk of being wrong is high

  Then respond with ONLY this exact JSON and nothing else:
  {
    "handover": true,
    "patient_message": "A warm message to send to the patient explaining a doctor will join shortly. Max 2 sentences.",
    "reason": "One sentence explaining why you are handing over",
    "urgency": "critical" | "high" | "medium",
    "summary": {
      "chief_complaint": "...",
      "symptoms": ["...", "..."],
      "duration": "...",
      "severity": "1-10 score the patient gave",
      "allergies": "...",
      "medications": "...",
      "red_flags": ["list any clinical red flags you detected"],
      "recommendation": "What the doctor should assess first"
    }
  }

CRITICAL: When you decide to hand over, output ONLY the JSON above.
No preamble. No explanation outside the JSON. The backend will parse it.
If you are NOT handing over, output normal conversational text only —
never output partial JSON or mention JSON to the patient.
"""

async def chat(phone: str, user_message: str) -> dict:
    """
    Returns:
      { "type": "message", "text": "..." }          — normal AI reply
      { "type": "handover", "patient_message": "...", "summary": {...}, "reason": "...", "urgency": "..." }
    """
    history = await get_history(phone)
    history.append({"role": "user", "parts": [{"text": user_message}]})

    response = await asyncio.to_thread(
        client.models.generate_content,
        model="gemini-3.1-flash-lite-preview",
        contents=history,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            max_output_tokens=600,
        )
    )

    raw = response.text.strip()

    # try to parse as handover JSON
    try:
        # strip markdown code fences if Gemini wraps it
        clean = raw.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(clean)
        if parsed.get("handover") is True:
            # save history before handover (include this last user message)
            history.append({
                "role": "model",
                "parts": [{"text": "[Handed over to doctor]"}]
            })
            await save_history(phone, history)
            return {
                "type": "handover",
                "patient_message": parsed.get("patient_message", "A doctor will join you shortly."),
                "reason": parsed.get("reason", ""),
                "urgency": parsed.get("urgency", "high"),
                "summary": parsed.get("summary", {})
            }
    except (json.JSONDecodeError, AttributeError):
        pass

    # normal message
    history.append({"role": "model", "parts": [{"text": raw}]})
    await save_history(phone, history)
    return {"type": "message", "text": raw}
