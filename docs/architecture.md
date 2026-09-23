# AgriChem AI - System Architecture

AgriChem AI is an autonomous process intelligence and decision platform that unites chemical engineering transport phenomena, edge IoT telemetry, and supervised machine learning (Random Forest) for precision agriculture.

## Core Closed-Loop Workflow

```
ESP32 Telemetry / Sensor Stream
               ↓
    [Data Validation / Sensor Health]
    (missing, range, jump, flatline, cross-sensor)
               ↓
    [Process State & Mass Balances]
    (Water balance: ΔMw = Win - Wloss | Nitrogen balance: ΔN = Nin - Nuptake - Nloss)
               ↓
    [Random Forest ML Classification]
    (Confidence + Top Feature Attribution)
               ↓
    [Decision Engine & Action Optimization]
    (IRRIGATE | FERTIGATE | DO NOTHING | WAIT / MONITOR | VERIFY)
               ↓
    [Hardware & Agronomic Safety Interlocks]
    (Max runtime, cool-down gap, saturation guard, FAULT lockout)
               ↓
    [Human-in-the-Loop Operator Gate]
    (APPROVE | MODIFY | REJECT | AUTOMATE)
               ↓
    [ESP32 Actuation Command & Relay]
    (Active-LOW Relay drive DC Submersible Pump)
               ↓
    [Post-Monitoring Telemetry Response]
    (Wait monitoring interval, measure actual moisture delta)
               ↓
    [Closed-Loop Feedback & Experiment Lab]
    (Evaluate predicted vs actual response, compute % error)
               ↓
    [Continuous Model Retraining]
```

## Key Engineering Invariants

1. **Non-Negotiable VERIFY Override**:
   If any key sensor (Moisture, Temperature, pH) encounters a `FAULT` (out of physical bounds, flatlining, disconnected ADC counts, or cross-sensor contradiction between analog and digital pins), the Decision Engine is locked to `VERIFY`. The Random Forest model is strictly forbidden from recommending irrigation or fertigation.

2. **Fertigation Interlock**:
   Chemical fertilizer delivery is forbidden when soil moisture is dry (<35%), preventing root osmotic scorching. Plain water irrigation is enforced first to restore soil matric potential.

3. **Hardware Safety Dry-Run Default**:
   `PUMP_HARDWARE_ENABLED=false` is enforced by default in local and development configurations. When false, approved actions trigger `SIMULATED_ACTIVATION`, guaranteeing physical relays never switch accidentally during test or development.
