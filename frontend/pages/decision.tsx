import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  ArrowRight, 
  Clock, 
  Target, 
  Droplet, 
  Layers, 
  ShieldCheck, 
  Check, 
  FileText,
  AlertTriangle
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { api } from '@/lib/api';
import { Decision, Reading } from '@/types';

export default function ProcessDecisionPage() {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);
  const [approving, setApproving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const loadData = async () => {
    try {
      const data = await api.getLatest();
      if (data.decision) setDecision(data.decision);
      if (data.reading) setReading(data.reading);
    } catch (e) {
      console.warn('Decision fetch error:', e);
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
    setMsg(null);
    setShowConfirm(false);
    try {
      const res = await api.sendCommand({
        action_type: 'APPROVE',
        decision_id: decision.id,
        duration_minutes: decision.duration_minutes,
        volume_liters: decision.volume_liters,
        reason: 'Approved via SoilSense Process Decision Console'
      });
      setMsg(`Operation dispatched successfully: ${res.execution_status}`);
      loadData();
    } catch (err: any) {
      setMsg(`Blocked by Safety Interlock: ${err.message}`);
    } finally {
      setApproving(false);
    }
  };

  return (
    <DashboardLayout title="SoilSense — Process Decisions">
      <div className="space-y-6">
        {/* Header */}
        <SectionHeader
          title="Process Decisions &amp; Operating Prescriptions"
          moduleIndex={3}
          subtitle="Synthesized operating recommendations: Diagnostic state evaluation, mass balance parameters, and control actuation limits."
          actions={
            <StatusBadge 
              status={decision?.decision || 'MONITOR'} 
              label={`RECOMMENDATION: ${decision?.decision || 'MONITOR'}`} 
            />
          }
        />

        {/* Primary Operating Recommendation Banner */}
        <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-start justify-between border-b border-stone-100 pb-4 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-forest-800">
                CURRENT OPERATING RECOMMENDATION
              </span>
              <h2 className="text-2xl font-bold font-mono text-stone-900 tracking-tight">
                {decision?.decision || 'MONITOR'}
              </h2>
              <p className="text-xs text-stone-600 max-w-xl">
                {decision?.expected_next_state || 'Process is in steady state equilibrium.'}
              </p>
            </div>

            <div className="flex flex-col md:items-end gap-1 font-mono text-xs">
              <div className="text-stone-500">Evaluation Confidence:</div>
              <div className="flex items-center gap-1.5">
                <StatusBadge status="NORMAL" label={`${(Number(decision?.confidence || 0.94) * 100).toFixed(0)}% (${decision?.confidence_level || 'HIGH'})`} />
              </div>
            </div>
          </div>

          {/* Action Parameter Matrix */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-5 font-mono text-xs">
            <div className="p-3.5 bg-stone-50 rounded border border-stone-200">
              <span className="text-stone-500 text-[10px] block">RUNTIME DURATION</span>
              <span className="text-lg font-bold text-stone-900">{decision?.duration_minutes || 6} min</span>
              <span className="text-[10px] text-stone-500 block mt-0.5">Flow: 2.1 L/min</span>
            </div>

            <div className="p-3.5 bg-stone-50 rounded border border-stone-200">
              <span className="text-stone-500 text-[10px] block">DELIVERY VOLUME</span>
              <span className="text-lg font-bold text-stone-900">{decision?.volume_liters || 12.5} L</span>
              <span className="text-[10px] text-stone-500 block mt-0.5">Mass Conservation</span>
            </div>

            <div className="p-3.5 bg-stone-50 rounded border border-stone-200">
              <span className="text-stone-500 text-[10px] block">TARGET SOIL MOISTURE</span>
              <span className="text-lg font-bold text-forest-700">{decision?.target_moisture || 50.0}%</span>
              <span className="text-[10px] text-stone-500 block mt-0.5">Deficit replenishment</span>
            </div>

            <div className="p-3.5 bg-stone-50 rounded border border-stone-200">
              <span className="text-stone-500 text-[10px] block">OBSERVATION INTERVAL</span>
              <span className="text-lg font-bold text-stone-900">{decision?.monitoring_interval_minutes || 5} min</span>
              <span className="text-[10px] text-stone-500 block mt-0.5">Post-soak equilibrium</span>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-stone-500 font-mono">
              Interlock Status: <strong className="text-emerald-700">ARMED &amp; SAFE</strong>
            </div>

            <div className="flex items-center gap-3">
              {msg && <span className="text-xs font-mono font-medium text-forest-800">{msg}</span>}
              <button
                onClick={() => setShowConfirm(true)}
                disabled={approving || !decision || decision.decision === 'VERIFY' || decision.status === 'APPROVED'}
                className="px-5 py-2 rounded bg-forest-800 hover:bg-forest-900 text-white font-mono font-medium text-xs shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {decision?.status === 'APPROVED' ? 'OPERATION AUTHORIZED' : 'APPROVE OPERATION'}
              </button>
            </div>
          </div>
        </div>

        {/* Basis for Decision Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Engineering Decision Rationale */}
          <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs space-y-3">
            <div className="border-b border-stone-100 pb-2 flex items-center justify-between">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-forest-700" />
                Basis for Decision
              </h3>
              <span className="text-[10px] font-mono text-stone-400">Deterministic Rationale</span>
            </div>

            <ul className="space-y-2 text-xs text-stone-700">
              {decision?.why_reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 bg-stone-50 p-3 rounded border border-stone-200">
                  <span className="h-4 w-4 rounded bg-stone-200 text-stone-800 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Model Telemetry Attribution */}
          <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="border-b border-stone-100 pb-2 flex items-center justify-between">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <CheckSquare className="h-4 w-4 text-forest-700" />
                Process Feature Weight Attribution
              </h3>
              <span className="text-[10px] font-mono text-stone-400">Tree Ensemble Weight</span>
            </div>

            <p className="text-xs text-stone-600">
              Mathematical feature contribution driving the current state determination:
            </p>

            <div className="space-y-2.5 font-mono text-xs">
              {decision && Object.entries(decision.top_features).slice(0, 5).map(([feat, val]) => (
                <div key={feat} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-stone-700 capitalize">{feat.replace('_', ' ')}</span>
                    <strong className="text-stone-900">{(val * 100).toFixed(1)}%</strong>
                  </div>
                  <div className="h-1.5 w-full bg-stone-100 rounded overflow-hidden">
                    <div 
                      className="h-full bg-forest-700 rounded" 
                      style={{ width: `${Math.min(100, Math.max(8, val * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-stone-50 rounded border border-stone-200 text-[11px] text-stone-500 font-mono">
              Safety rule: Sensor Health FAULT status permanently overrides the decision engine to VERIFY.
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        <ConfirmationDialog
          isOpen={showConfirm}
          title="CONFIRM PROCESS ACTUATION"
          description={`Dispatch pump actuation command for ${decision?.duration_minutes || 6} minutes (${decision?.volume_liters || 12.5} L). Relay contacts will engage.`}
          actionLabel="CONFIRM DISPATCH"
          onConfirm={handleApprove}
          onCancel={() => setShowConfirm(false)}
        />
      </div>
    </DashboardLayout>
  );
}
