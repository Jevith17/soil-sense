from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional, List
import json

from app.database import get_db
from app.config import settings
from app.models.decision import Decision
from app.models.reading import Reading
from app.models.action import Action
from app.models.experiment import Experiment
from app.schemas.action import ActionCreate, ActionResponse, CommandPollResponse
from app.engines.safety_engine import SafetyEngine
from app.engines.sensor_health import SensorHealthEngine
from app.engines.feedback_engine import FeedbackEngine

router = APIRouter(tags=["Command & Actuation"])

# In-memory pending command queue for polling ESP32
_pending_command: Optional[CommandPollResponse] = None

@router.post("/command", response_model=ActionResponse)
def submit_command(payload: ActionCreate, db: Session = Depends(get_db)):
    global _pending_command

    # 1. Fetch latest reading and decision
    latest_reading = db.query(Reading).order_by(Reading.id.desc()).first()
    if not latest_reading:
        raise HTTPException(status_code=400, detail="Cannot issue command: No telemetry recorded.")

    decision = None
    if payload.decision_id:
        decision = db.query(Decision).filter(Decision.id == payload.decision_id).first()
    if not decision:
        decision = db.query(Decision).order_by(Decision.id.desc()).first()

    if not decision:
        raise HTTPException(status_code=400, detail="No active decision found to act upon.")

    action_type = payload.action_type.upper()
    now = datetime.now(timezone.utc)

    # 2. Handle REJECT action
    if action_type == "REJECT":
        decision.status = "REJECTED"
        action = Action(
            decision_id=decision.id,
            user_name=payload.user_name or "Operator",
            action_type="REJECT",
            pump_state="OFF",
            duration_minutes=0,
            volume_liters=0.0,
            reason=payload.reason or "Operator rejected the AI recommendation.",
            execution_status="REJECTED",
            is_hardware_dispatched=False,
            executed_at=now
        )
        db.add(action)
        db.commit()
        db.refresh(action)
        # Clear any pending pump command
        _pending_command = None
        return action

    # 3. For APPROVE, MODIFY, AUTOMATE, MANUAL_ON -> Run Safety Interlocks
    is_activating_pump = (
        action_type in ["APPROVE", "AUTOMATE"] and decision.decision in ["IRRIGATE", "FERTIGATE"]
    ) or (action_type == "MANUAL_ON") or (action_type == "MODIFY" and payload.pump_state == "ON")

    duration = payload.duration_minutes or decision.duration_minutes
    volume = payload.volume_liters or decision.volume_liters

    if is_activating_pump:
        recent_actions = db.query(Action).order_by(Action.id.desc()).limit(10).all()
        recent_readings = db.query(Reading).order_by(Reading.id.desc()).limit(10).all()
        health_summary = SensorHealthEngine.evaluate(latest_reading, recent_readings)

        is_safe, safety_code, reasons = SafetyEngine.validate_action(
            decision=decision,
            latest_reading=latest_reading,
            sensor_health=health_summary,
            recent_actions=recent_actions,
            requested_duration_min=duration
        )

        if not is_safe:
            # Log safety violation
            action = Action(
                decision_id=decision.id,
                user_name=payload.user_name or "Operator",
                action_type=action_type,
                pump_state="OFF",
                duration_minutes=0,
                volume_liters=0.0,
                reason=f"BLOCKED BY SAFETY: {'; '.join(reasons)}",
                execution_status="SAFETY_BLOCKED",
                is_hardware_dispatched=False,
                executed_at=now
            )
            db.add(action)
            db.commit()
            db.refresh(action)
            raise HTTPException(
                status_code=422,
                detail={"error": "Safety Interlock Engaged", "code": safety_code, "reasons": reasons}
            )

        # Safety passed! Create approved action
        pump_state = "ON"
        execution_status = "DISPATCHED" if settings.PUMP_HARDWARE_ENABLED else "SIMULATED_ACTIVATION"
        is_hardware = settings.PUMP_HARDWARE_ENABLED
        decision.status = "APPROVED" if action_type != "AUTOMATE" else "AUTOMATED"

        action = Action(
            decision_id=decision.id,
            user_name=payload.user_name or "Operator",
            action_type=action_type,
            pump_state=pump_state,
            duration_minutes=duration,
            volume_liters=volume,
            reason=payload.reason or ("Automated execution" if action_type == "AUTOMATE" else "Approved by operator"),
            execution_status=execution_status,
            is_hardware_dispatched=is_hardware,
            executed_at=now
        )
        db.add(action)
        db.commit()
        db.refresh(action)

        # Set pending command for ESP32 polling
        _pending_command = CommandPollResponse(
            command_available=True,
            action_id=action.id,
            command="PUMP_ON",
            duration_seconds=duration * 60,
            volume_liters=volume,
            authorized_at=now,
            safety_code="SAFE",
            dry_run=not settings.PUMP_HARDWARE_ENABLED
        )

        return action

    elif action_type == "MANUAL_OFF":
        action = Action(
            decision_id=decision.id,
            user_name=payload.user_name or "Operator",
            action_type="MANUAL_OFF",
            pump_state="OFF",
            duration_minutes=0,
            volume_liters=0.0,
            reason="Manual pump shutdown requested by operator.",
            execution_status="EXECUTED",
            is_hardware_dispatched=settings.PUMP_HARDWARE_ENABLED,
            executed_at=now
        )
        db.add(action)
        db.commit()
        db.refresh(action)

        _pending_command = CommandPollResponse(
            command_available=True,
            action_id=action.id,
            command="PUMP_OFF",
            duration_seconds=0,
            volume_liters=0.0,
            authorized_at=now,
            safety_code="SAFE",
            dry_run=not settings.PUMP_HARDWARE_ENABLED
        )
        return action

    else:
        # Default safe record
        action = Action(
            decision_id=decision.id,
            user_name=payload.user_name or "Operator",
            action_type=action_type,
            pump_state="OFF",
            duration_minutes=0,
            volume_liters=0.0,
            reason=payload.reason or f"Action {action_type} recorded",
            execution_status="COMPLETED",
            is_hardware_dispatched=False,
            executed_at=now
        )
        db.add(action)
        db.commit()
        db.refresh(action)
        return action

@router.get("/command", response_model=CommandPollResponse)
def poll_pending_command(
    x_device_id: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None)
):
    global _pending_command
    if _pending_command and _pending_command.command_available:
        cmd = _pending_command
        # Mark as consumed once polled by physical/simulated device
        _pending_command = None
        return cmd

    return CommandPollResponse(
        command_available=False,
        command="NONE",
        duration_seconds=0,
        volume_liters=0.0,
        authorized_at=None,
        safety_code="IDLE",
        dry_run=not settings.PUMP_HARDWARE_ENABLED
    )

@router.get("/command/history", response_model=List[ActionResponse])
def get_action_history(limit: int = 30, db: Session = Depends(get_db)):
    actions = db.query(Action).order_by(Action.id.desc()).limit(limit).all()
    return actions

