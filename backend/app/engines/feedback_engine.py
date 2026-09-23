from datetime import datetime, timezone
from typing import Optional
from app.models.reading import Reading
from app.models.decision import Decision
from app.models.action import Action
from app.models.experiment import Experiment

class FeedbackEngine:
    """
    Closed-Loop Feedback & Continuous Improvement Engine.
    Converts real or simulated actuation runs into verified Experiment records.
    Calculates predicted vs actual response and percentage error.
    """

    _experiment_counter = 1

    @classmethod
    def record_experiment(
        cls,
        decision: Decision,
        action: Action,
        initial_reading: Reading,
        final_reading: Reading,
        crop: str = "Precision Tomato (Greenhouse)"
    ) -> Experiment:
        code = f"EXP-{datetime.now().strftime('%Y%m')}-{cls._experiment_counter:03d}"
        cls._experiment_counter += 1

        predicted = decision.target_moisture
        actual = final_reading.moisture
        pct_error = 0.0
        if predicted > 0:
            pct_error = round(abs(actual - predicted) / predicted * 100.0, 2)

        notes = (
            f"Action: {action.action_type} for {action.duration_minutes}m. "
            f"Initial moisture: {initial_reading.moisture:.1f}%, Final moisture: {actual:.1f}%. "
            f"Water used: {action.volume_liters:.1f} L. Accuracy: {100.0 - pct_error:.1f}%."
        )

        return Experiment(
            experiment_code=code,
            crop=crop,
            decision_id=decision.id,
            action_id=action.id,
            initial_moisture=initial_reading.moisture,
            ai_decision=decision.decision,
            pump_on_time=action.executed_at or action.timestamp,
            pump_off_time=final_reading.timestamp,
            final_moisture=actual,
            water_used_liters=action.volume_liters,
            predicted_result=predicted,
            actual_result=actual,
            percentage_error=pct_error,
            notes=notes
        )

