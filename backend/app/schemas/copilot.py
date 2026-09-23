from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class CopilotChatRequest(BaseModel):
    message: str
    context_limit: Optional[int] = 5

class CopilotActionRequest(BaseModel):
    action_type: str # PUMP_ON, PUMP_OFF, IRRIGATE, FERTIGATE
    duration_minutes: Optional[int] = 5
    requires_confirmation: bool = True
    parameters: Optional[Dict[str, Any]] = None

class CopilotChatResponse(BaseModel):
    reply: str
    has_command_intent: bool = False
    command_detected: Optional[str] = None # e.g. "TURN_PUMP_ON"
    suggested_action: Optional[CopilotActionRequest] = None
    data_sources_used: List[str] = []
    database_reading_id: Optional[int] = None

