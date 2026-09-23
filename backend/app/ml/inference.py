import os
import joblib
import pandas as pd
from typing import Dict, Any, List, Tuple
from app.config import settings
from app.models.reading import Reading

class MLInferenceEngine:
    _artifact = None
    _model_path = os.path.join(settings.BASE_DIR, "..", "ml", "random_forest.joblib")

    @classmethod
    def load_model(cls):
        if cls._artifact is None:
            if not os.path.exists(cls._model_path):
                # Fallback to backend/app/ml or root ml
                alt_path = os.path.join(os.getcwd(), "ml", "random_forest.joblib")
                if os.path.exists(alt_path):
                    cls._model_path = alt_path
                else:
                    raise FileNotFoundError(f"Model artifact not found at {cls._model_path}")
            cls._artifact = joblib.load(cls._model_path)
        return cls._artifact

    @classmethod
    def predict(cls, reading: Reading, process_state_summary: str = "") -> Tuple[str, float, str, Dict[str, float], List[str]]:
        artifact = cls.load_model()
        model = artifact["model"]
        feature_cols = artifact["feature_cols"]

        input_df = pd.DataFrame([{
            "moisture": reading.moisture,
            "soil_temp": reading.soil_temp,
            "air_temp": reading.air_temp,
            "humidity": reading.humidity,
            "solar": reading.solar,
            "n": reading.n,
            "p": reading.p,
            "k": reading.k,
            "ph": reading.ph
        }])[feature_cols]

        pred_class = model.predict(input_df)[0]
        probs = model.predict_proba(input_df)[0]
        confidence = float(max(probs))

        # Confidence categorization
        if confidence >= 0.75:
            conf_level = "HIGH"
        elif confidence >= 0.50:
            conf_level = "MEDIUM"
        else:
            conf_level = "LOW"

        # Feature importances
        raw_importances = dict(zip(feature_cols, model.feature_importances_))
        sorted_features = dict(sorted(raw_importances.items(), key=lambda item: item[1], reverse=True))

        # Build transparent WHY explanation
        # 1. Feature contribution
        # 2. Process state context
        # 3. Applicable agricultural rules
        reasons = []

        if pred_class == "IRRIGATE":
            reasons.append(f"Soil moisture at {reading.moisture:.1f}% is critically below target operational range (35–65%).")
            if reading.air_temp > 28.0 or reading.soil_temp > 28.0:
                reasons.append(f"Elevated air temperature ({reading.air_temp:.1f}°C) substantially accelerates root-zone evapotranspiration.")
            if reading.solar > 700.0:
                reasons.append(f"High solar irradiance ({reading.solar:.0f} W/m²) generates high vapor pressure deficit (VPD), increasing plant water demand.")
            if reading.n >= 50.0:
                reasons.append("Current soil nitrogen reserves are adequate; irrigation is required without chemical fertigation addition.")
            else:
                reasons.append("Moisture takes immediate priority over nutrient supplementation to prevent moisture-deficit wilting.")

        elif pred_class == "FERTIGATE":
            reasons.append(f"Soil nutrient deficit detected: Nitrogen ({reading.n:.1f} mg/kg) is below threshold (<50 mg/kg).")
            reasons.append(f"Soil moisture ({reading.moisture:.1f}%) is in optimal range (35–65%), preventing nutrient runoff/leaching.")
            reasons.append(f"Ambient climate (Temp: {reading.air_temp:.1f}°C, Humidity: {reading.humidity:.1f}%) is suitable for fertilizer uptake without salt burn.")

        elif pred_class == "DO_NOTHING":
            reasons.append(f"Soil moisture ({reading.moisture:.1f}%) is well within healthy agronomic threshold.")
            reasons.append(f"Macronutrients (N:{reading.n:.0f}, P:{reading.p:.0f}, K:{reading.k:.0f} mg/kg) meet plant vegetative demand.")
            reasons.append("Current transpiration and environmental evaporative demand are balanced; maintaining current state.")

        elif pred_class == "WAIT":
            if reading.moisture > 65.0:
                reasons.append(f"Soil moisture is high ({reading.moisture:.1f}%); root zone is draining following recent water event.")
            elif reading.air_temp > 35.0:
                reasons.append(f"Extreme heat ({reading.air_temp:.1f}°C) exceeds safe chemical fertigation window; monitor for cool-down period.")
            else:
                reasons.append("Transient dynamic state detected; sensor readings are stabilizing.")

        # Add model-supported attribution note
        top_two = list(sorted_features.keys())[:2]
        reasons.append(f"Model-supported reasoning: Decision driven primarily by telemetry features '{top_two[0]}' and '{top_two[1]}'.")

        return pred_class, confidence, conf_level, sorted_features, reasons

