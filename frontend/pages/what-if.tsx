import React, { useState } from 'react';
import { 
  Sliders, 
  Play, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingUp,
  RefreshCw,
  Droplet,
  Layers,
  Sun,
  CheckCircle2
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';

interface ScenarioOutcome {
  action: string;
  water_impact: string;
  nutrient_impact: string;
  expected_state: string;
  risk_level: string;
  risk_description: string;
  estimated_yield_impact: string;
}

export default function WhatIfSimulatorPage() {
  const [moisture, setMoisture] = useState<number>(27.0);
  const [n, setN] = useState<number>(64.0);
  const [temperature, setTemperature] = useState<number>(33.0);
  const [humidity, setHumidity] = useState<number>(65.0);
  const [solar, setSolar] = useState<number>(910.0);
  
  const [loading, setLoading] = useState(false);
  const [scenarios, setScenarios] = useState<ScenarioOutcome[] | null>(null);
  const [recommended, setRecommended] = useState<string | null>(null);
  const [rationale, setRationale] = useState<string | null>(null);

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.runWhatIf({
        moisture,
        n,
        temperature,
        humidity,
        solar
      });
      setScenarios(res.scenarios);
      setRecommended(res.recommended_choice);
      setRationale(res.rationale);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getRiskStatus = (risk: string) => {
    switch (risk.toUpperCase()) {
      case 'LOW':
        return <StatusBadge status="NORMAL" label="LOW RISK" />;
      case 'MODERATE':
        return <StatusBadge status="CHECK" label="MODERATE" />;
      case 'HIGH':
      case 'CRITICAL':
        return <StatusBadge status="FAULT" label={risk.toUpperCase()} />;
      default:
        return <StatusBadge status="INFO" label={risk} />;
    }
  };

  return (
    <DashboardLayout title="SoilSense - Process Scenario Analysis">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-stone-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                MODULE 09
              </span>
              <h1 className="text-xl font-bold tracking-tight text-stone-900 flex items-center">
                <Sliders className="h-5 w-5 mr-2 text-forest-700" />
                Process Scenario Analysis &amp; Simulation
              </h1>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Evaluate hypothetical microclimate scenarios and project multi-day consequences of competing operating strategies.
            </p>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={loading}
            className="mt-3 md:mt-0 flex items-center space-x-2 px-4 py-2 rounded bg-forest-800 hover:bg-forest-900 text-white font-medium text-xs shadow-sm transition disabled:opacity-50"
          >
            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            <span>EVALUATE SCENARIO</span>
          </button>
        </div>

        {/* Boundary Condition Sliders */}
        <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm space-y-4">
          <SectionHeader
            title="Hypothetical Boundary Conditions"
            caption="Adjust state variables to evaluate system dynamics under drought, high transpiration, or excess nutrients"
          />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 pt-2">
            {/* Moisture Slider */}
            <div className="bg-stone-50 border border-stone-200 rounded p-3.5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-stone-600 font-medium">Soil Moisture</span>
                <span className="text-stone-900 font-bold font-mono">{moisture.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                step="0.5"
                value={moisture}
                onChange={(e) => setMoisture(parseFloat(e.target.value))}
                className="w-full accent-forest-700 cursor-pointer h-1.5 bg-stone-200 rounded"
              />
              <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                <span>5% Dry</span>
                <span>95% Wet</span>
              </div>
            </div>

            {/* Nitrogen Slider */}
            <div className="bg-stone-50 border border-stone-200 rounded p-3.5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-stone-600 font-medium">Soil Nitrogen (N)</span>
                <span className="text-stone-900 font-bold font-mono">{n.toFixed(0)} mg/kg</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="1"
                value={n}
                onChange={(e) => setN(parseFloat(e.target.value))}
                className="w-full accent-forest-700 cursor-pointer h-1.5 bg-stone-200 rounded"
              />
              <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                <span>10 Depleted</span>
                <span>200 Excess</span>
              </div>
            </div>

            {/* Temperature Slider */}
            <div className="bg-stone-50 border border-stone-200 rounded p-3.5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-stone-600 font-medium">Ambient Temp</span>
                <span className="text-stone-900 font-bold font-mono">{temperature.toFixed(0)}°C</span>
              </div>
              <input
                type="range"
                min="10"
                max="45"
                step="1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-forest-700 cursor-pointer h-1.5 bg-stone-200 rounded"
              />
              <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                <span>10° Cool</span>
                <span>45° Heatwave</span>
              </div>
            </div>

            {/* Humidity Slider */}
            <div className="bg-stone-50 border border-stone-200 rounded p-3.5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-stone-600 font-medium">Humidity</span>
                <span className="text-stone-900 font-bold font-mono">{humidity.toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="95"
                step="1"
                value={humidity}
                onChange={(e) => setHumidity(parseFloat(e.target.value))}
                className="w-full accent-forest-700 cursor-pointer h-1.5 bg-stone-200 rounded"
              />
              <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                <span>20% Arid</span>
                <span>95% Humid</span>
              </div>
            </div>

            {/* Solar Radiation Slider */}
            <div className="bg-stone-50 border border-stone-200 rounded p-3.5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-stone-600 font-medium">Solar Irradiance</span>
                <span className="text-stone-900 font-bold font-mono">{solar.toFixed(0)} W/m²</span>
              </div>
              <input
                type="range"
                min="100"
                max="1200"
                step="20"
                value={solar}
                onChange={(e) => setSolar(parseFloat(e.target.value))}
                className="w-full accent-forest-700 cursor-pointer h-1.5 bg-stone-200 rounded"
              />
              <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                <span>100 Overcast</span>
                <span>1200 Peak Sun</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Comparison Matrix */}
        {scenarios && (
          <div className="space-y-4">
            {/* Recommendation Callout */}
            {recommended && (
              <div className="p-4 rounded-lg bg-forest-50/70 border border-forest-200 flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-1.5 rounded bg-forest-100 text-forest-800 border border-forest-300 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-forest-800">
                      OPTIMAL PROCESS STRATEGY
                    </span>
                    <h3 className="text-base font-bold text-stone-900 font-mono">{recommended}</h3>
                    <p className="text-xs text-stone-700 mt-0.5 leading-relaxed">{rationale}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Comparison Table */}
            <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
              <div className="p-4 border-b border-stone-200">
                <SectionHeader
                  title="Side-by-Side Strategy Impact Matrix"
                  caption="Comparative matrix comparing DO NOTHING vs. IRRIGATE vs. FERTIGATE under selected boundary conditions"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-600 uppercase font-mono text-[10px] border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Operating Strategy</th>
                      <th className="py-2.5 px-4 font-semibold">Water Impact</th>
                      <th className="py-2.5 px-4 font-semibold">Nutrient Impact</th>
                      <th className="py-2.5 px-4 font-semibold">Expected Crop State</th>
                      <th className="py-2.5 px-4 font-semibold">Risk Evaluation</th>
                      <th className="py-2.5 px-4 font-semibold">Projected Yield Effect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {scenarios.map((sc) => (
                      <tr 
                        key={sc.action} 
                        className={`transition-colors ${
                          sc.action === recommended 
                            ? 'bg-forest-50/30 font-medium' 
                            : 'hover:bg-stone-50/50'
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-stone-900 flex items-center space-x-2">
                          <span className="font-mono">{sc.action.replace('_', ' ')}</span>
                          {sc.action === recommended && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-forest-100 text-forest-800 border border-forest-300">
                              RECOMMENDED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-800">
                          {sc.water_impact}
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-800">
                          {sc.nutrient_impact}
                        </td>
                        <td className="py-3 px-4 max-w-xs text-stone-700 leading-relaxed">
                          {sc.expected_state}
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {getRiskStatus(sc.risk_level)}
                            <div className="text-[10px] text-stone-500">{sc.risk_description}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-stone-900">
                          {sc.estimated_yield_impact}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
