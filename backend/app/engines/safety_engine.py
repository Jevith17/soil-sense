from datetime import datetime, timezone, timedelta
from typing import Tuple, List, Optional
from app.config import settings
from app.models.reading import Reading
from app.models.action import Action
from app.models.decision import Decision
from app.schemas.reading import SensorHealthSummary

class SafetyEngine:
    """
    Hardware and Agronomic Safety Validation Engine.
    Enforces non-negotiable interlocks before any actuation command can be queued or executed.
    """

    @classmethod
    def validate_action(
        cls,
        decision: Decision,
        latest_reading: Reading,
        sensor_health: SensorHealthSummary,
        recent_actions: Optional[List[Action]] = None,
        requested_duration_min: Optional[int] = None
    ) -> Tuple[bool, str, List[str]]:
        """
        Returns: (is_safe, safety_code, rejection_reasons)
        """
        rejection_reasons = []

        # 1. Sensor Health Key Sensor Lockout
        if sensor_health.requires_verify or decision.decision == "VERIFY":
            rejection_reasons.append("SAFETY INTERLOCK: Key sensor is in FAULT status. System locked in VERIFY mode.")
            return False, "SENSOR_FAULT_LOCKOUT", rejection_reasons

        # 2. Moisture Upper Bound Cutoff
        if latest_reading.moisture >= settings.MOISTURE_UPPER_LIMIT:
            rejection_reasons.append(
                f"SAFETY INTERLOCK: Soil moisture ({latest_reading.moisture:.1f}%) exceeds safety upper limit "
                f"({settings.MOISTURE_UPPER_LIMIT}%). Risk of root hypoxia / waterlogging."
            )
            return False, "MOISTURE_UPPER_LIMIT_EXCEEDED", rejection_reasons

        # 3. Maximum Pump Runtime Enforcement
        duration = requested_duration_min if requested_duration_min is not None else decision.duration_minutes
        if duration > settings.MAX_PUMP_RUNTIME_MINUTES:
            rejection_reasons.append(
                f"SAFETY INTERLOCK: Requested runtime ({duration}m) exceeds absolute max runtime "
                f"({settings.MAX_PUMP_RUNTIME_MINUTES}m)."
            )
            return False, "MAX_RUNTIME_EXCEEDED", rejection_reasons

        # 4. Minimum Gap Between Consecutive Pump Runs
        if recent_actions:
            now = datetime.now(timezone.utc)
            # Find the most recent executed or pending pump activation
            past_pump_runs = [
                a for a in recent_actions 
                if a.pump_state == "ON" and a.execution_status in ["EXECUTED", "DISPATCHED", "PENDING"]
            ]
            if past_pump_runs:
                last_run = past_pump_runs[0]
                run_time = last_run.timestamp
                if run_time.tzinfo is None:
                    run_time = run_time.replace(tzinfo=timezone.utc)
                elapsed_minutes = (now - run_time).total_seconds() / 60.0
                if elapsed_minutes < settings.MIN_GAP_BETWEEN_PUMPS_MINUTES:
                    rejection_reasons.append(
                        f"SAFETY INTERLOCK: Minimum cool-down gap not met. Only {elapsed_minutes:.1f} min elapsed since last run "
                        f"(Requires {settings.MIN_GAP_BETWEEN_PUMPS_MINUTES} min)."
                    )
                    return False, "MIN_GAP_VIOLATION", rejection_reasons

        # 5. Rejected Action State
        if decision.status == "REJECTED":
            rejection_reasons.append("SAFETY INTERLOCK: Decision has been explicitly rejected by operator.")
            return False, "ACTION_REJECTED", rejection_reasons

        return True, "SAFE", []

