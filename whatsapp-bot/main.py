from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import webhook, cases, send
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Articuno Bot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # tighten in production
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(webhook.router)
app.include_router(cases.router)
app.include_router(send.router)

@app.get("/health")
async def health():
    return {"status": "ok", "model": "gemini-3.1-flash-lite-preview"}
