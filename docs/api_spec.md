# AgriChem AI - API Specification

Base URL: `http://localhost:8000/api`

## Core Telemetry & Ingestion

- `GET /api/health`: Service health and hardware safety status.
- `POST /api/data`: Telemetry ingestion from ESP32 or Simulator. Automatically runs Sensor Health, Process State, and Decision engines.
- `GET /api/latest`: Returns the most recent sensor reading and accompanying active AI decision.
- `GET /api/history?limit=50`: Returns time-series telemetry records for live graphing.

## Decisions & Actuation Controls

- `GET /api/decision`: Returns current AI decision, confidence level, top features, and transparent "WHY" reasons.
- `POST /api/command`: Operator actuation endpoint (`APPROVE`, `REJECT`, `MODIFY`, `AUTOMATE`, `MANUAL_ON`, `MANUAL_OFF`). Enforces Safety Engine interlocks.
- `GET /api/command`: Polling endpoint for physical ESP32 or simulated actuator.
- `GET /api/command/history`: Historical log of all operator approvals and system dispatches.

## Chemical Engineering & Process Intelligence

- `GET /api/sensors/health`: Real-time matrix of sensor checks (range, jump, flatline, drift, cross-sensor).
- `GET /api/process-state`: Chemical engineering process intelligence state tree.
- `GET /api/balance/water`: Mass balance $\Delta M_w = W_{in} - W_{loss}$.
- `GET /api/balance/nitrogen`: Nitrogen mass balance $\Delta N = N_{input} - N_{utilization} - N_{loss}$.

## Experiments & Retraining

- `GET /api/experiments`: Historical trial registry with initial moisture, water delivered, predicted vs actual moisture, and percentage error.
- `POST /api/experiments`: Create an experiment record.
- `POST /api/experiments/record-cycle`: Closes the feedback loop between an approved action and a subsequent telemetry reading.
- `GET /api/model/status`: Returns Random Forest model metadata, version, sample count, and test accuracy.
- `POST /api/model/train`: Retrains the model using logged experiment feedback.

## Simulation & Copilot

- `POST /api/simulation`: Generates simulated scenarios (`DRY_SOIL`, `WET_SOIL`, `LOW_N`, `NORMAL`, `SENSOR_FAILURE`, `POST_IRRIGATION`).
- `POST /api/simulation/what-if`: Scenario sandbox evaluating DO NOTHING vs IRRIGATE vs FERTIGATE.
- `POST /api/copilot/chat`: Conversational agronomist assistant grounded in actual SQLite database records with command intent detection.
- `GET /api/sustainability`: Cumulative water saved, nutrient use efficiency, and carbon equivalent metrics.

## Authentication

- `POST /api/auth/register`: Register user with role (`Farmer`, `Researcher`, `Admin`).
- `POST /api/auth/login`: Authenticate and receive JWT Bearer token.
- `GET /api/auth/me`: Validate JWT token and retrieve profile.
