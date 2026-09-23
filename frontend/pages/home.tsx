import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Droplet, 
  Thermometer, 
  Wind, 
  Sun, 
  Layers, 
  Gauge, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Clock, 
  FileText, 
  Check, 
  X,
  Sliders,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { api } from '@/lib/api';
import { Reading, Decision } from '@/types';

export default function HomeCommandCenter() {
  const [reading, setReading] = useState<Reading | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [showBasisModal, setShowBasisModal] = useState(false);
  const [approving, setApproving] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const loadData = async () => {
    try {
      const data = await api.getLatest();
      if (data.reading) setReading(data.reading);
      if (data.decision) setDecision(data.decision);
    } catch (e) {
      console.warn('Failed loading latest telemetry:', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async () => {
    if (!decision) return;
    setApproving(true);
    setActionFeedback(null);
    setShowConfirmDialog(false);
    try {
      const res = await api.sendCommand({
        action_type: 'APPROVE',
        decision_id: decision.id,
        duration_minutes: decision.duration_minutes,
        volume_liters: decision.volume_liters,
        reason: 'Approved by operator via SoilSense Command Center'
      });
      setActionFeedback(`Operation dispatched: ${res.execution_status}`);
      loadData();
    } catch (err: any) {
      setActionFeedback(`Blocked by Safety Interlock: ${err.message}`);
    } finally {
      setApproving(false);
    }
  };

  // Derive 5 Engineering Answers
  const moistureVal = reading ? reading.moisture : 27.0;
  const isProblem = decision?.decision === 'VERIFY'
    ? { text: "Instrument telemetry anomaly detected (Verification required)", status: "FAULT" }
    : moistureVal < 35.0
    ? { text: "Root-zone water deficit detected (Moisture below 35%)", status: "CHECK" }
    : { text: "Process parameters within nominal operating bounds", status: "NORMAL" };

  return (
    <DashboardLayout title="SoilSense — Home / Command Center">
      <div className="space-y-6">
        {/* Header */}
        <SectionHeader
          title="Command Center"
          moduleIndex={1}
          subtitle="Real-time process state monitoring, operating recommendations, and actuator interlocks."
          actions={
            <div className="flex items-center gap-3">
              <Link
                href="/docs/operating/command-center"
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-stone-500 hover:text-forest-800 transition-colors bg-stone-100/80 hover:bg-stone-200/60 px-2 py-1 rounded border border-stone-200"
              >
                <span>Docs</span>
                <span className="text-[10px]">↗</span>
              </Link>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-forest-600 animate-pulse" />
                <span className="text-xs font-mono font-medium text-stone-600">
                  SCADA BUS: NORMAL
                </span>
              </div>
            </div>
          }
        />

        {/* 5 Core Questions Answer Grid */}
        <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs">
          <div className="border-b border-stone-100 pb-2.5 mb-4 flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700">
              Current Operating Assessment
            </h2>
            <div className="flex items-center gap-3">
              <Link
                href="/docs/operating/operating-decisions"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-forest-700 hover:text-forest-900 font-medium"
              >
                <span>Understanding Decisions &rarr;</span>
              </Link>
              <span className="text-[11px] font-mono text-stone-500">
                5-Point Diagnostic Assessment
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
            {/* 1. What is happening? */}
            <div className="bg-stone-50 border border-stone-200/80 rounded p-3.5 space-y-1">
              <span className="font-mono text-[10px] font-bold uppercase text-stone-500">
                1. What is happening?
              </span>
              <p className="text-stone-800 text-[11px] leading-relaxed">
                Active transpiration at <strong className="font-mono text-stone-900">{reading?.air_temp || 33}°C</strong>, 
                soil moisture at <strong className="font-mono text-stone-900">{moistureVal.toFixed(1)}%</strong> under high solar load.
              </p>
            </div>

            {/* 2. Is there a problem? */}
            <div className="bg-stone-50 border border-stone-200/80 rounded p-3.5 space-y-1">
              <span className="font-mono text-[10px] font-bold uppercase text-stone-500">
                2. Is there a problem?
              </span>
              <div className="pt-0.5">
                <StatusBadge status={isProblem.status} size="sm" label={isProblem.status} />
              </div>
              <p className="text-stone-800 text-[11px] leading-relaxed mt-1">
                {isProblem.text}
              </p>
            </div>

            {/* 3. Process State */}
            <div className="bg-stone-50 border border-stone-200/80 rounded p-3.5 space-y-1">
              <span className="font-mono text-[10px] font-bold uppercase text-stone-500">
                3. Current Process State
              </span>
              <div className="font-mono text-xs font-bold text-stone-900 mt-1">
                WATER: <span className="text-amber-700 font-semibold">{decision?.water_state || 'LOW'}</span>
              </div>
              <div className="font-mono text-[11px] text-stone-600">
                Nutrients: {decision?.nutrient_state || 'ADEQUATE'}
              </div>
              <div className="font-mono text-[11px] text-stone-600">
                Atmosphere: {decision?.env_demand || 'HIGH'} Demand
              </div>
            </div>

            {/* 4. Operating Recommendation */}
            <div className="bg-stone-50 border border-stone-200/80 rounded p-3.5 space-y-1">
              <span className="font-mono text-[10px] font-bold uppercase text-stone-500">
                4. Operating Action
              </span>
              <div className="mt-1">
                <StatusBadge status={decision?.decision || 'IRRIGATE'} size="md" />
              </div>
              <p className="text-[11px] font-mono text-stone-700 mt-1">
                Duration: <strong className="text-stone-900">{decision?.duration_minutes || 6} min</strong> ({decision?.volume_liters || 12.5} L)
              </p>
            </div>

            {/* 5. What should I do? */}
            <div className="bg-stone-50 border border-stone-200/80 rounded p-3.5 space-y-1">
              <span className="font-mono text-[10px] font-bold uppercase text-stone-500">
                5. What should I do?
              </span>
              <p className="text-stone-800 text-[11px] leading-relaxed mt-1 font-medium">
                {decision?.decision === 'IRRIGATE'
                  ? `Authorize ${decision.duration_minutes || 6} min irrigation run to replenish root zone.`
                  : decision?.decision === 'VERIFY'
                  ? "Perform physical inspection on soil probe cables."
                  : "Maintain passive monitoring; no actuation required."}
              </p>
            </div>
          </div>
        </div>

        {/* Primary Operating Recommendation & Basis Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Action Recommendation */}
          <div className="lg:col-span-2 bg-white border border-stone-200 rounded-lg p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-forest-800">
                    OPERATING RECOMMENDATION
                  </span>
                  <h3 className="text-xl font-bold text-stone-900 tracking-tight">
                    {decision?.decision === 'IRRIGATE' ? 'Controlled Water Irrigation' : decision?.decision || 'System Monitoring'}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-mono text-stone-500">Recommendation Basis</div>
                  <div className="text-xs font-mono font-bold text-forest-800">
                    High Confidence ({(Number(decision?.confidence || 0.94) * 100).toFixed(0)}%)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 bg-stone-50 rounded border border-stone-200">
                  <span className="text-stone-500 block text-[10px]">PUMP DURATION</span>
                  <span className="text-lg font-bold text-stone-900">{decision?.duration_minutes || 6} min</span>
                </div>
                <div className="p-3 bg-stone-50 rounded border border-stone-200">
                  <span className="text-stone-500 block text-[10px]">ESTIMATED VOLUME</span>
                  <span className="text-lg font-bold text-stone-900">{decision?.volume_liters || 12.5} L</span>
                </div>
                <div className="p-3 bg-stone-50 rounded border border-stone-200">
                  <span className="text-stone-500 block text-[10px]">TARGET MOISTURE</span>
                  <span className="text-lg font-bold text-forest-700">{decision?.target_moisture || 50.0}%</span>
                </div>
              </div>

              {/* Basis for Decision Bullets */}
              <div className="space-y-2 pt-1">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-stone-700 block">
                  BASIS FOR RECOMMENDATION:
                </span>
                <ul className="space-y-1.5 text-xs text-stone-700 leading-relaxed">
                  {decision?.why_reasons.map((r, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="h-4 w-4 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5 border border-stone-300">
                        {idx + 1}
                      </span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Operating Actions */}
            <div className="pt-5 mt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBasisModal(true)}
                  className="px-3 py-1.5 rounded border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-mono font-medium transition-colors"
                >
                  ENGINEERING ATTRIBUTION
                </button>

                <Link
                  href="/what-if"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-mono font-medium transition-colors"
                >
                  <span>SCENARIO MODEL</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="flex items-center gap-3">
                {actionFeedback && (
                  <span className="text-xs font-mono font-medium text-forest-800">
                    {actionFeedback}
                  </span>
                )}
                <button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={approving || !decision || decision.decision === 'VERIFY' || decision.status === 'APPROVED'}
                  className="px-5 py-2 rounded bg-forest-800 hover:bg-forest-900 text-white font-mono font-medium text-xs shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {decision?.status === 'APPROVED' ? 'OPERATION AUTHORIZED' : 'APPROVE OPERATION'}
                </button>
              </div>
            </div>
          </div>

          {/* Current Operating Condition Summary */}
          <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="border-b border-stone-100 pb-2.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
                  FIELD TELEMETRY
                </span>
                <h4 className="text-base font-bold text-stone-900">Current Process State</h4>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">Soil Moisture:</span>
                  <span className="font-bold text-stone-900">{moistureVal.toFixed(1)} %</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">Air Temperature:</span>
                  <span className="font-bold text-stone-900">{reading?.air_temp || 33.0} °C</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">Relative Humidity:</span>
                  <span className="font-bold text-stone-900">{reading?.humidity || 65.0} %</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">Solar Irradiance:</span>
                  <span className="font-bold text-stone-900">{reading?.solar || 910} W/m²</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">Available Nitrogen:</span>
                  <span className="font-bold text-stone-900">{reading?.n || 64.0} mg/kg</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-stone-500">Soil pH:</span>
                  <span className="font-bold text-stone-900">{reading?.ph || 6.40}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-stone-100 text-[11px] text-stone-500 font-mono">
              Pump status: <strong className="text-stone-800">{reading?.pump_status || 'OFF'}</strong> (Active-LOW opto-isolated relay)
            </div>
          </div>
        </div>

        {/* Live Field & Soil Instrumentation Metric Strip */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Gauge className="h-4 w-4 text-forest-700" />
              Instrumentation Channels
            </h3>
            <span className="text-[11px] font-mono text-stone-500">
              Calibrated Transducers
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <MetricCard
              label="Moisture"
              value={moistureVal.toFixed(1)}
              unit="%"
              status={moistureVal < 35 ? 'CHECK' : 'NORMAL'}
              trend={moistureVal < 35 ? "↓ Deficit" : "Optimal"}
              trendDirection={moistureVal < 35 ? "down" : "neutral"}
              icon={<Droplet className="h-4 w-4 text-cyan-600" />}
            />
            <MetricCard
              label="Nitrogen (N)"
              value={reading ? reading.n.toFixed(0) : '64'}
              unit="mg/kg"
              status="NORMAL"
              secondaryInfo="Reserves: >50"
              icon={<Layers className="h-4 w-4 text-forest-600" />}
            />
            <MetricCard
              label="Soil pH"
              value={reading ? reading.ph.toFixed(2) : '6.40'}
              unit="pH"
              status="NORMAL"
              secondaryInfo="Optimal: 6.0–7.0"
              icon={<span className="font-mono font-bold text-xs text-amber-700">pH</span>}
            />
            <MetricCard
              label="Temperature"
              value={reading ? `${reading.air_temp.toFixed(0)}° / ${reading.soil_temp.toFixed(0)}°` : '33° / 29°'}
              unit="°C"
              status="NORMAL"
              secondaryInfo="Air / Soil Root"
              icon={<Thermometer className="h-4 w-4 text-amber-700" />}
            />
            <MetricCard
              label="Humidity"
              value={reading ? reading.humidity.toFixed(0) : '65'}
              unit="%"
              status="NORMAL"
              secondaryInfo="VPD Moderate"
              icon={<Wind className="h-4 w-4 text-stone-600" />}
            />
            <MetricCard
              label="Methane"
              value={reading ? reading.ch4.toFixed(1) : '18.0'}
              unit="ppm"
              status="NORMAL"
              secondaryInfo="Aerobic < 25"
              icon={<span className="font-mono text-xs text-forest-700">CH₄</span>}
            />
            <MetricCard
              label="Carbon (CO₂)"
              value={reading ? reading.co2.toFixed(0) : '620'}
              unit="ppm"
              status="NORMAL"
              secondaryInfo="Ambient < 800"
              icon={<span className="font-mono text-xs text-stone-600">CO₂</span>}
            />
          </div>
        </div>

        {/* Engineering Attribution Modal */}
        {showBasisModal && (
          <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-stone-300 rounded-lg max-w-xl w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-forest-700 font-bold">DECISION ENGINE SPECIFICATION</span>
                  <h3 className="font-bold text-stone-900 text-sm">Basis for Operational Recommendation</h3>
                </div>
                <button 
                  onClick={() => setShowBasisModal(false)}
                  className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-stone-700">
                <div>
                  <h4 className="font-mono text-[11px] font-bold uppercase text-stone-800 mb-2">
                    Chemical &amp; Physical Transport Rules:
                  </h4>
                  <ul className="space-y-2">
                    {decision?.why_reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-stone-50 p-2.5 rounded border border-stone-200">
                        <span className="h-4 w-4 rounded bg-stone-200 text-stone-700 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-stone-200">
                  <h4 className="font-mono text-[11px] font-bold uppercase text-stone-800 mb-2">
                    Random Forest Telemetry Attribution:
                  </h4>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                    {decision && Object.entries(decision.top_features).slice(0, 4).map(([f, w]) => (
                      <div key={f} className="flex justify-between bg-stone-50 p-2 rounded border border-stone-200">
                        <span className="text-stone-600 capitalize">{f.replace('_', ' ')}:</span>
                        <strong className="text-forest-800 font-bold">{(w * 100).toFixed(1)}%</strong>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-stone-500 mt-2 font-mono">
                    Model: 100-tree ensemble coupled with mass balance calculations.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-stone-200">
                <button
                  onClick={() => setShowBasisModal(false)}
                  className="px-4 py-1.5 rounded border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-mono font-medium transition-colors"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal for Pump Actuation */}
        <ConfirmationDialog
          isOpen={showConfirmDialog}
          title="AUTHORIZE IRRIGATION PUMP RUN"
          description={`Execute precision water irrigation for ${decision?.duration_minutes || 6} minutes (approximately ${decision?.volume_liters || 12.5} Liters). Actuator relay GPIO23 will close.`}
          actionLabel="AUTHORIZE & DISPATCH"
          onConfirm={handleApprove}
          onCancel={() => setShowConfirmDialog(false)}
        />
      </div>
    </DashboardLayout>
  );
}
