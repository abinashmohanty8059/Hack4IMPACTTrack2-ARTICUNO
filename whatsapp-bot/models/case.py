from pydantic import BaseModel

class SendRequest(BaseModel):
    to: str
    message: str

class ResolveResponse(BaseModel):
    status: str
