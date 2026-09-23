export interface Reading {
  id: number;
  timestamp: string;
  moisture: number;
  soil_temp: number;
  ph: number;
  n: number;
  p: number;
  k: number;
  air_temp: number;
  humidity: number;
  solar: number;
  ch4: number;
  co2: number;
  pump_status: string;
  data_source: 'REAL' | 'SIMULATED';
  device_id: string;
  analog_moisture_raw?: number;
  digital_moisture_raw?: number;
}

export interface Decision {
  id: number;
  timestamp: string;
  reading_id: number;
  decision: 'IRRIGATE' | 'FERTIGATE' | 'DO NOTHING' | 'WAIT / MONITOR' | 'VERIFY';
  confidence: number;
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
  why_reasons: string[];
  top_features: Record<string, number>;
  action_type: string;
  volume_liters: number;
  duration_minutes: number;
  when_execute: string;
  monitoring_interval_minutes: number;
  target_moisture: number;
  expected_next_state: string;
  water_state: 'LOW' | 'OK' | 'HIGH';
  nutrient_state: 'LOW' | 'ADEQUATE' | 'HIGH';
  temp_state: 'LOW' | 'NORMAL' | 'HIGH';
  env_demand: 'LOW' | 'NORMAL' | 'HIGH';
  ghg_state: 'NORMAL' | 'HIGH';
  sensor_health_state: 'NORMAL' | 'CHECK' | 'FAULT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'AUTOMATED';
}

export interface SensorCheckDetail {
  name: string;
  value: number;
  unit: string;
  status: 'NORMAL' | 'CHECK' | 'FAULT';
  checks: {
    missing: boolean;
    range: boolean;
    jump: boolean;
    flatline: boolean;
    drift: boolean;
    cross_sensor: boolean;
  };
  message: string;
}

export interface SensorHealthSummary {
  overall_status: 'NORMAL' | 'CHECK' | 'FAULT';
  requires_verify: boolean;
  timestamp: string;
  sensors: Record<string, SensorCheckDetail>;
}

export interface WaterBalance {
  water_supplied_l: number;
  estimated_loss_l: number;
  net_water_change_l: number;
  transpiration_loss_l: number;
  evaporation_loss_l: number;
  soil_retention_capacity_l: number;
  formula: string;
  calculation_details: Record<string, any>;
}

export interface NitrogenBalance {
  n_input_g: number;
  n_utilization_g: number;
  n_loss_g: number;
  n_remaining_g: number;
  n_leaching_risk: string;
  formula: string;
  calculation_details: Record<string, any>;
}

export interface ProcessState {
  water_status: 'LOW' | 'OK' | 'HIGH';
  nutrient_status: 'LOW' | 'ADEQUATE' | 'HIGH';
  temp_status: 'LOW' | 'NORMAL' | 'HIGH';
  env_demand: 'LOW' | 'NORMAL' | 'HIGH';
  ghg_status: 'NORMAL' | 'HIGH';
  crop_response: string;
  water_balance: WaterBalance;
  nitrogen_balance: NitrogenBalance;
  summary: string;
}

export interface Action {
  id: number;
  timestamp: string;
  decision_id?: number;
  user_name: string;
  action_type: 'APPROVE' | 'REJECT' | 'MODIFY' | 'AUTOMATE' | 'MANUAL_ON' | 'MANUAL_OFF';
  pump_state: 'ON' | 'OFF';
  duration_minutes: number;
  volume_liters: number;
  reason?: string;
  execution_status: string;
  is_hardware_dispatched: boolean;
  executed_at?: string;
}

export interface Experiment {
  id: number;
  experiment_code: string;
  timestamp: string;
  crop: string;
  decision_id?: number;
  action_id?: number;
  initial_moisture: number;
  ai_decision: string;
  pump_on_time?: string;
  pump_off_time?: string;
  final_moisture?: number;
  water_used_liters: number;
  predicted_result: number;
  actual_result?: number;
  percentage_error?: number;
  notes?: string;
}

export interface SustainabilityMetrics {
  total_water_used_liters: number;
  total_water_saved_liters: number;
  water_saving_percentage: number;
  nutrient_use_efficiency_pct: number;
  fertilizer_runoff_prevented_kg: number;
  co2_equivalent_mitigated_kg: number;
  sustainability_score: number;
  daily_trend: Array<{
    date: string;
    water_used_l: number;
    water_saved_l: number;
    nutrient_efficiency_pct: number;
  }>;
}

export interface User {
  id: number;
  email: string;
  full_name?: string;
  role: 'Farmer' | 'Researcher' | 'Admin';
  is_active: boolean;
  created_at: string;
}

