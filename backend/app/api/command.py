from fastapi import APIRouter, Depends, HTTPException, Header, Query
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
from app.schemas.action import ActionCreate, ActionResponse, CommandPollResponse, AckPayload
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

    duration = payload.duration_minutes if payload.duration_minutes is not None else decision.duration_minutes
    duration_s = payload.duration_s if payload.duration_s is not None else float(duration * 60)
    volume = payload.volume_liters if payload.volume_liters is not None else decision.volume_liters
    events = payload.events if payload.events is not None else 1
    interval_s = payload.interval_s if payload.interval_s is not None else 0.0

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
        execution_status = "DISPATCHED"
        is_hardware = True
        decision.status = "APPROVED" if action_type != "AUTOMATE" else "AUTOMATED"

        action = Action(
            decision_id=decision.id,
            user_name=payload.user_name or "Operator",
            action_type=action_type,
            pump_state=pump_state,
            duration_minutes=duration,
            duration_s=duration_s,
            volume_liters=volume,
            events=events,
            interval_s=interval_s,
            channel=payload.channel or 1,
            reason=payload.reason or ("Automated execution" if action_type == "AUTOMATE" else "Approved by operator"),
            execution_status=execution_status,
            is_hardware_dispatched=is_hardware,
            executed_at=now
        )
        db.add(action)
        db.commit()
        db.refresh(action)

        # Generate canonical framework v3 approval ID: A-YYYY-MM-DD-XXXX
        approval_id = payload.approval_id or f"A-{now.strftime('%Y-%m-%d')}-{action.id:04d}"
        action.approval_id = approval_id
        db.commit()
        db.refresh(action)

        # Set pending command for ESP32 polling
        _pending_command = CommandPollResponse(
            command="PUMP_ON",
            channel=1,
            duration_s=round(duration_s, 1),
            events=events,
            interval_s=round(interval_s, 1),
            approval_id=approval_id,
            command_available=True,
            action_id=action.id,
            duration_seconds=int(duration_s),
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
            is_hardware_dispatched=True,
            executed_at=now
        )
        db.add(action)
        db.commit()
        db.refresh(action)

        _pending_command = CommandPollResponse(
            command="PUMP_OFF",
            channel=1,
            duration_s=0.0,
            events=0,
            interval_s=0.0,
            approval_id=None,
            command_available=True,
            action_id=action.id,
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
    device_id: Optional[str] = Query(None),
    x_device_id: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None)
):
    global _pending_command
    if _pending_command and _pending_command.command_available:
        cmd = _pending_command
        # Once served, clear pending command so it is not re-served
        _pending_command = None
        return cmd

    return CommandPollResponse(
        command="NONE",
        channel=1,
        duration_s=0.0,
        events=0,
        interval_s=0.0,
        approval_id=None,
        command_available=False,
        action_id=None,
        duration_seconds=0,
        volume_liters=0.0,
        authorized_at=None,
        safety_code="IDLE",
        dry_run=not settings.PUMP_HARDWARE_ENABLED
    )

@router.post("/ack")
@router.post("/command/ack")
def receive_acknowledgement(payload: AckPayload, db: Session = Depends(get_db)):
    # Find matching action by approval_id
    action = db.query(Action).filter(Action.approval_id == payload.approval_id).first()
    if not action:
        # Fallback to latest dispatched action
        action = db.query(Action).filter(Action.is_hardware_dispatched == True).order_by(Action.id.desc()).first()

    now_utc = datetime.now(timezone.utc)
    if action:
        action.actual_on_ms = payload.actual_on_ms
        action.event_no = payload.event_no
        action.ack_status = payload.status
        action.ack_reason = payload.reason
        action.device_id = payload.device_id

        if payload.status == "COMPLETED":
            action.execution_status = "COMPLETED"
            # Turn off pump status in latest reading
            latest_reading = db.query(Reading).order_by(Reading.id.desc()).first()
            if latest_reading:
                latest_reading.pump_status = "OFF"
        elif payload.status == "EVENT_DONE":
            action.execution_status = "EVENT_DONE"
        elif payload.status == "REJECTED":
            action.execution_status = "REJECTED"
        elif payload.status == "ABORTED_FAULT":
            action.execution_status = "ABORTED_FAULT"
            latest_reading = db.query(Reading).order_by(Reading.id.desc()).first()
            if latest_reading:
                latest_reading.pump_status = "OFF"

        db.commit()
        db.refresh(action)

        # Log to Experiment table if completed
        if payload.status in ["COMPLETED", "EVENT_DONE"]:
            latest_reading = db.query(Reading).order_by(Reading.id.desc()).first()
            exp_code = f"EXP-{payload.approval_id}"
            existing_exp = db.query(Experiment).filter(Experiment.experiment_code == exp_code).first()
            if not existing_exp:
                actual_secs = payload.actual_on_ms / 1000.0
                commanded_secs = action.duration_s or (action.duration_minutes * 60)
                error_pct = abs(actual_secs - commanded_secs) / commanded_secs * 100.0 if commanded_secs > 0 else 0.0
                new_exp = Experiment(
                    experiment_code=exp_code,
                    crop="Precision Greenhouse Crop",
                    decision_id=action.decision_id,
                    action_id=action.id,
                    initial_moisture=latest_reading.moisture if (latest_reading and latest_reading.moisture) else 27.0,
                    ai_decision=action.action_type,
                    pump_on_time=action.executed_at or now_utc,
                    pump_off_time=now_utc,
                    final_moisture=latest_reading.moisture if (latest_reading and latest_reading.moisture) else 27.0,
                    water_used_liters=action.volume_liters,
                    predicted_result=50.0,
                    actual_result=latest_reading.moisture if (latest_reading and latest_reading.moisture) else 27.0,
                    percentage_error=round(error_pct, 2),
                    notes=f"Physical ESP32 trial {payload.approval_id}: actual ON {payload.actual_on_ms}ms, status={payload.status}"
                )
                db.add(new_exp)
                db.commit()

        return {
            "status": "ACK_PROCESSED",
            "approval_id": payload.approval_id,
            "execution_status": action.execution_status,
            "actual_on_ms": payload.actual_on_ms
        }

    return {"status": "ACK_RECEIVED_NO_ACTION_MATCH", "approval_id": payload.approval_id}

@router.post("/command/cancel")
def cancel_pending_command(db: Session = Depends(get_db)):
    global _pending_command
    if _pending_command and _pending_command.command_available:
        action_id = _pending_command.action_id
        _pending_command = None
        if action_id:
            action = db.query(Action).filter(Action.id == action_id).first()
            if action:
                action.execution_status = "CANCELLED"
                action.reason = "Pending command cancelled by operator before execution."
                db.commit()
        return {"status": "CANCELLED", "action_id": action_id}
    return {"status": "NO_PENDING_COMMAND"}

@router.get("/command/history", response_model=List[ActionResponse])
def get_action_history(limit: int = 30, db: Session = Depends(get_db)):
    actions = db.query(Action).order_by(Action.id.desc()).limit(limit).all()
    return actions

