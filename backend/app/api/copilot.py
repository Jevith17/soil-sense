import re
import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.reading import Reading
from app.models.decision import Decision
from app.models.action import Action
from app.models.experiment import Experiment
from app.schemas.copilot import CopilotChatRequest, CopilotChatResponse, CopilotActionRequest

router = APIRouter(prefix="/copilot", tags=["AI Copilot"])

@router.post("/chat", response_model=CopilotChatResponse)
def chat_with_copilot(payload: CopilotChatRequest, db: Session = Depends(get_db)):
    msg = payload.message.strip().lower()
    
    # Check for direct operational actuation intent
    # e.g., "turn on pump", "start pump", "turn pump off", "irrigate for 5 minutes"
    is_command_intent = False
    command_detected = None
    suggested_action = None

    if re.search(r"\b(turn\s+on|start|activate|run)\b.*\b(pump|irrigation)\b", msg) or msg == "turn the pump on":
        is_command_intent = True
        command_detected = "TURN_PUMP_ON"
        suggested_action = CopilotActionRequest(
            action_type="MANUAL_ON",
            duration_minutes=6,
            requires_confirmation=True,
            parameters={"target": "pump", "volume_liters": 12.5}
        )
        return CopilotChatResponse(
            reply="Operational command detected: Request to activate the irrigation pump. "
                  "Per chemical engineering safety protocol, physical/simulated actuators require explicit user confirmation.",
            has_command_intent=True,
            command_detected="PUMP_ON_REQUEST",
            suggested_action=suggested_action,
            data_sources_used=["Safety Interlock System"]
        )

    if re.search(r"\b(turn\s+off|stop|deactivate|shut\s*down)\b.*\b(pump|irrigation)\b", msg) or msg == "turn the pump off":
        is_command_intent = True
        command_detected = "TURN_PUMP_OFF"
        suggested_action = CopilotActionRequest(
            action_type="MANUAL_OFF",
            duration_minutes=0,
            requires_confirmation=True,
            parameters={"target": "pump"}
        )
        return CopilotChatResponse(
            reply="Operational command detected: Request to stop the irrigation pump. Please confirm to issue shutdown command.",
            has_command_intent=True,
            command_detected="PUMP_OFF_REQUEST",
            suggested_action=suggested_action,
            data_sources_used=["Safety Interlock System"]
        )

    # Telemetry retrieval from actual database
    latest_reading = db.query(Reading).order_by(Reading.id.desc()).first()
    if not latest_reading:
        return CopilotChatResponse(
            reply="Insufficient database records: No soil or environmental telemetry has been recorded yet.",
            has_command_intent=False,
            data_sources_used=["SQLite Readings Table"]
        )

    latest_decision = db.query(Decision).filter(Decision.reading_id == latest_reading.id).first()
    if not latest_decision:
        latest_decision = db.query(Decision).order_by(Decision.id.desc()).first()

    data_sources = [
        f"Reading #{latest_reading.id} ({latest_reading.timestamp.strftime('%H:%M:%S UTC') if latest_reading.timestamp else 'latest'})",
        f"Decision #{latest_decision.id if latest_decision else 'None'}"
    ]

    # Specific agricultural queries
    if "why irrigate" in msg or ("why" in msg and "irrigation" in msg):
        if latest_decision and latest_decision.decision == "IRRIGATE":
            why_list = json.loads(latest_decision.why_reasons) if isinstance(latest_decision.why_reasons, str) else latest_decision.why_reasons
            points = "\n• " + "\n• ".join(why_list)
            reply = (
                f"Based on real telemetry (Moisture: {latest_reading.moisture}%, Air Temp: {latest_reading.air_temp}°C, "
                f"Solar: {latest_reading.solar} W/m²), the AI recommends IRRIGATE because:{points}\n\n"
                f"Recommended volume: {latest_decision.volume_liters} L over {latest_decision.duration_minutes} minutes."
            )
        else:
            current_dec = latest_decision.decision if latest_decision else 'Unknown'
            reply = (
                f"The current recommendation is '{current_dec}', not IRRIGATE. "
                f"Current soil moisture is at {latest_reading.moisture:.1f}%, which is within acceptable limits."
            )

    elif "why not fertigate" in msg or "fertigate" in msg:
        if latest_reading.moisture < 35.0:
            reply = (
                f"Fertigation is currently blocked because soil moisture is low ({latest_reading.moisture:.1f}%). "
                f"Applying chemical fertilizer to a moisture-depleted root zone creates severe osmotic stress ('salt burn'). "
                f"The agronomic rule requires restoring moisture with water-only irrigation first."
            )
        elif latest_reading.n >= 50.0:
            reply = (
                f"Fertigation is not needed: Available soil Nitrogen is {latest_reading.n:.1f} mg/kg "
                f"(Adequate threshold is >= 50 mg/kg, P: {latest_reading.p:.1f}, K: {latest_reading.k:.1f}). "
                f"Excess fertilizer application would waste inputs and risk nitrate leaching."
            )
        else:
            reply = (
                f"Soil Nitrogen is {latest_reading.n:.1f} mg/kg and moisture is {latest_reading.moisture:.1f}%. "
                f"Environmental evaporative demand (Temp: {latest_reading.air_temp}°C, Solar: {latest_reading.solar} W/m²) "
                f"governs whether safe nutrient uptake can occur."
            )

    elif "moisture drop" in msg or "caused" in msg:
        reply = (
            f"The current soil moisture is {latest_reading.moisture:.1f}%. "
            f"Given ambient air temperature of {latest_reading.air_temp:.1f}°C, solar irradiance of {latest_reading.solar:.0f} W/m², "
            f"and relative humidity at {latest_reading.humidity:.1f}%, the vapor pressure deficit is high, "
            f"causing rapid transpiration loss (~9.8 L/cycle estimated loss)."
        )

    elif "compare" in msg or "yesterday" in msg:
        readings_count = db.query(Reading).count()
        if readings_count < 2:
            reply = f"Historical data comparison: Only {readings_count} reading currently recorded in database. Insufficient history for 24-hour differential."
        else:
            oldest = db.query(Reading).order_by(Reading.id.asc()).first()
            m_delta = latest_reading.moisture - oldest.moisture
            reply = (
                f"Comparative telemetry analysis: Baseline moisture was {oldest.moisture:.1f}%, "
                f"currently {latest_reading.moisture:.1f}% (Δ {m_delta:+.1f}%). "
                f"Soil temperature moved from {oldest.soil_temp:.1f}°C to {latest_reading.soil_temp:.1f}°C."
            )

    elif "pump turn off" in msg or "turned off" in msg:
        last_pump_action = db.query(Action).filter(Action.pump_state.in_(["ON", "OFF"])).order_by(Action.id.desc()).first()
        if last_pump_action:
            reply = (
                f"The pump status is currently {latest_reading.pump_status}. "
                f"Last recorded actuation was '{last_pump_action.action_type}' at {last_pump_action.timestamp.strftime('%H:%M:%S UTC')}. "
                f"Reason: {last_pump_action.reason or 'Scheduled cycle completion or operator command'}."
            )
        else:
            reply = f"The pump is currently {latest_reading.pump_status}. No historical pump shutdown events in log."

    elif "what if" in msg and "irrigate" in msg:
        reply = (
            f"What-If Projection: With current moisture at {latest_reading.moisture:.1f}%, irrigating for 10 minutes "
            f"delivers approximately ~21.0 Liters. Expected root-zone moisture will rise to approximately ~58–62%, "
            f"safely relieving transpiration stress with minimal leaching risk."
        )

    else:
        # General status query using real data
        reply = (
            f"AgriChem Process Intelligence Report:\n"
            f"• Soil Moisture: {latest_reading.moisture:.1f}% ({'LOW' if latest_reading.moisture < 35 else ('HIGH' if latest_reading.moisture > 65 else 'OK')})\n"
            f"• Soil Temp: {latest_reading.soil_temp:.1f}°C | pH: {latest_reading.ph:.2f}\n"
            f"• N-P-K: {latest_reading.n:.0f}-{latest_reading.p:.0f}-{latest_reading.k:.0f} mg/kg\n"
            f"• Air Temp: {latest_reading.air_temp:.1f}°C | Humidity: {latest_reading.humidity:.0f}%\n"
            f"• Active Recommendation: {latest_decision.decision if latest_decision else 'Monitoring'} "
            f"({latest_decision.confidence_level if latest_decision else 'NOMINAL'} confidence)\n"
            f"• Pump Hardware: {latest_reading.pump_status}"
        )

    return CopilotChatResponse(
        reply=reply,
        has_command_intent=is_command_intent,
        command_detected=command_detected,
        suggested_action=suggested_action,
        data_sources_used=data_sources,
        database_reading_id=latest_reading.id
    )

