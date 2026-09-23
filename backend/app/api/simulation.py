from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.reading import Reading
from app.models.decision import Decision
from app.schemas.reading import ReadingResponse
from app.schemas.simulation import (
    SimulationScenarioRequest, 
    WhatIfRequest, 
    WhatIfResponse, 
    ScenarioOutcome
)
from app.simulator.sensor_simulator import SensorSimulator
from app.engines.sensor_health import SensorHealthEngine
from app.engines.process_state import ProcessStateEngine
from app.engines.decision_engine import DecisionEngine
from app.api.data import parse_decision_to_response

router = APIRouter(prefix="/simulation", tags=["Simulation"])

@router.post("")
def trigger_simulation_scenario(payload: SimulationScenarioRequest, db: Session = Depends(get_db)):
    """
    Generates a simulated sensor reading matching the requested scenario:
    DRY_SOIL, WET_SOIL, LOW_N, NORMAL, SENSOR_FAILURE, POST_IRRIGATION.
    Pushes it through the full production pipeline.
    """
    reading = SensorSimulator.generate_reading(scenario=payload.scenario)
    db.add(reading)
    db.commit()
    db.refresh(reading)

    recent_readings = db.query(Reading).filter(Reading.id != reading.id).order_by(Reading.id.desc()).limit(10).all()
    health_summary = SensorHealthEngine.evaluate(reading, recent_readings)
    process_state = ProcessStateEngine.evaluate(reading)
    decision = DecisionEngine.evaluate(reading, health_summary, process_state)
    decision.reading_id = reading.id

    db.add(decision)
    db.commit()
    db.refresh(decision)

    return {
        "scenario": payload.scenario,
        "reading": ReadingResponse.model_validate(reading),
        "health": health_summary,
        "process_state": process_state,
        "decision": parse_decision_to_response(decision)
    }

@router.post("/what-if", response_model=WhatIfResponse)
def run_what_if_analysis(payload: WhatIfRequest):
    """
    Evaluates what happens under DO NOTHING, IRRIGATE, and FERTIGATE actions
    for arbitrary user-provided moisture, N, temperature, humidity, solar conditions.
    """
    m = payload.moisture
    n = payload.n
    t = payload.temperature
    rh = payload.humidity
    sol = payload.solar

    scenarios = []

    # 1. DO NOTHING
    if m < 35.0:
        dn_water = f"Depletes further from {m:.1f}% to ~{max(10.0, m - 4.5):.1f}%"
        dn_nutrient = "Nutrients remain immobilized due to insufficient soil water"
        dn_state = "CRITICAL WATER DEFICIT: Stomatal closure & irreversible leaf wilting"
        dn_risk = "HIGH"
        dn_risk_desc = "Prolonged dry soil under ambient temp yields rapid root desiccation"
        dn_yield = "-35% Yield loss risk"
    elif m > 65.0:
        dn_water = f"Naturally drains from {m:.1f}% toward ~58%"
        dn_nutrient = "Stabilizing root zone uptake"
        dn_state = "Adequate soil water equilibrium"
        dn_risk = "LOW"
        dn_risk_desc = "Optimal condition for soil microbial activity"
        dn_yield = "Nominal yield target (100%)"
    else:
        dn_water = f"Maintains stable moisture around {m:.1f}%"
        dn_nutrient = "Steady nutrient absorption"
        dn_state = "Agronomic nominal equilibrium"
        dn_risk = "LOW"
        dn_risk_desc = "Safe passive monitoring window"
        dn_yield = "Nominal yield target (100%)"

    scenarios.append(ScenarioOutcome(
        action="DO_NOTHING",
        water_impact=dn_water,
        nutrient_impact=dn_nutrient,
        expected_state=dn_state,
        risk_level=dn_risk,
        risk_description=dn_risk_desc,
        estimated_yield_impact=dn_yield
    ))

    # 2. IRRIGATE (Water Only)
    irr_target = min(68.0, m + 23.0)
    if m < 35.0:
        irr_water = f"Replenishes root-zone from {m:.1f}% to target ~{irr_target:.1f}%"
        irr_nutrient = "Restores capillary nutrient dissolution and uptake"
        irr_state = "Optimal soil matric potential restored"
        irr_risk = "LOW"
        irr_risk_desc = "Safe, replenishing operation"
        irr_yield = "+20% Recovery / Peak vegetative vigor"
    elif m > 65.0:
        irr_water = f"Oversaturates soil to ~{min(100.0, m + 15.0):.1f}%"
        irr_nutrient = "Severe nitrogen leaching into subsoil"
        irr_state = "ANAEROBIC WATERLOGGING: Root hypoxia and root rot risk"
        irr_risk = "CRITICAL"
        irr_risk_desc = "Excess water displaces soil oxygen, stunting root metabolism"
        irr_yield = "-25% Yield penalty from root damage"
    else:
        irr_water = f"Elevates moisture from {m:.1f}% to ~{min(70.0, m + 15.0):.1f}%"
        irr_nutrient = "Adequate dilution"
        irr_state = "Moist to saturated threshold"
        irr_risk = "MODERATE"
        irr_risk_desc = "Possible drainage runoff if rain follows"
        irr_yield = "+2% Marginal benefit"

    scenarios.append(ScenarioOutcome(
        action="IRRIGATE",
        water_impact=irr_water,
        nutrient_impact=irr_nutrient,
        expected_state=irr_state,
        risk_level=irr_risk,
        risk_description=irr_risk_desc,
        estimated_yield_impact=irr_yield
    ))

    # 3. FERTIGATE (Nutrient Solution)
    if n < 50.0 and (35.0 <= m <= 65.0) and t <= 34.0:
        fert_water = f"Raises moisture safely to ~{min(60.0, m + 10.0):.1f}%"
        fert_nutrient = f"Boosts soil N from {n:.1f} mg/kg to target ~85 mg/kg"
        fert_state = "Peak balanced vegetative nutrition"
        fert_risk = "LOW"
        fert_risk_desc = "Ideal agronomic application window"
        fert_yield = "+28% Yield and fruit quality enhancement"
    elif m < 35.0:
        fert_water = "Insufficient carrier water volume"
        fert_nutrient = "High localized ionic fertilizer salt concentration"
        fert_state = "SALT BURN RISK: Osmotic root scorching"
        fert_risk = "HIGH"
        fert_risk_desc = "Do not apply chemical fertilizer to dry root zone"
        fert_yield = "-15% Scorching damage"
    elif t > 34.0 or sol > 950.0:
        fert_water = "High evaporation rate"
        fert_nutrient = "Rapid volatilization of ammonia / chemical salts"
        fert_state = "Atmospheric emission loss and low uptake efficiency"
        fert_risk = "HIGH"
        fert_risk_desc = "Fertigation during peak solar heat causes foliar and root stress"
        fert_yield = "Wasted fertilizer input ($$ loss)"
    else:
        fert_water = f"Raises moisture to ~{min(75.0, m + 10.0):.1f}%"
        fert_nutrient = f"Excess nitrogen accumulation (Current: {n:.1f} mg/kg)"
        fert_state = "Nutrient luxury consumption / excess vegetative foliage"
        fert_risk = "MODERATE"
        fert_risk_desc = "Excess N delays fruit setting and increases insect susceptibility"
        fert_yield = "-5% Quality degradation"

    scenarios.append(ScenarioOutcome(
        action="FERTIGATE",
        water_impact=fert_water,
        nutrient_impact=fert_nutrient,
        expected_state=fert_state,
        risk_level=fert_risk,
        risk_description=fert_risk_desc,
        estimated_yield_impact=fert_yield
    ))

    # Determine recommended choice
    if m < 35.0:
        recommended = "IRRIGATE"
        rationale = "Immediate irrigation is critical to alleviate soil moisture deficit and protect root vitality."
    elif 35.0 <= m <= 65.0 and n < 50.0 and t <= 34.0:
        recommended = "FERTIGATE"
        rationale = "Soil moisture and ambient climate are ideal for restorative nutrient fertigation."
    else:
        recommended = "DO_NOTHING"
        rationale = "Soil moisture and nutrient reserves are adequate; maintaining equilibrium protects water resources."

    return WhatIfResponse(
        input_values={"moisture": m, "n": n, "temperature": t, "humidity": rh, "solar": sol},
        scenarios=scenarios,
        recommended_choice=recommended,
        rationale=rationale
    )

