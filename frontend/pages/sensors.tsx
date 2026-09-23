import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldAlert, 
  RefreshCw,
  Cpu,
  Layers,
  Info
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { SensorHealthSummary } from '@/types';

export default function SensorHealthPage() {
  const [health, setHealth] = useState<SensorHealthSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const data = await api.getSensorHealth();
      setHealth(data);
    } catch (e) {
      console.warn('Sensor health fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout title="SoilSense - Instrumentation Diagnostics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-stone-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                MODULE 08
              </span>
              <h1 className="text-xl font-bold tracking-tight text-stone-900 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-forest-700" />
                Instrumentation Diagnostics &amp; Telemetry Validation
              </h1>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Deterministic pre-inference validation: Physical bounds, delta jumps, flatlining, sensor drift, and dual-sensor cross validation.
            </p>
          </div>

          <div className="mt-3 md:mt-0 flex items-center space-x-3">
            <Link
              href="/docs/operating/sensor-health"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-stone-500 hover:text-forest-800 transition-colors bg-stone-100/80 hover:bg-stone-200/60 px-2 py-1.5 rounded border border-stone-200"
            >
              <span>Docs</span>
              <span className="text-[10px]">↗</span>
            </Link>
            <div className="flex items-center space-x-2 bg-stone-100 border border-stone-200 px-3 py-1.5 rounded text-xs">
              <span className="text-stone-500">Overall Loop Health:</span>
              <StatusBadge status={health?.overall_status || 'NORMAL'} />
            </div>
            <button
              onClick={loadHealth}
              className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded border border-stone-200 transition"
              title="Re-run diagnostic checks"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Safety Lockout Alert Banner */}
        {health?.requires_verify && (
          <div className="p-4 rounded bg-red-50 border border-red-200 text-red-800 flex items-start space-x-3">
            <ShieldAlert className="h-5 w-5 text-red-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-xs text-red-900 uppercase tracking-wider">
                Critical Instrumentation Lockout Engaged: VERIFY Required
              </h3>
              <p className="text-xs text-red-800 mt-1 leading-relaxed">
                A primary telemetry channel has entered FAULT status. 
                Per deterministic safety architecture, the process engine cannot override this condition. 
                Actuator operation is strictly inhibited until physical inspection confirms sensor re-calibration.
              </p>
            </div>
          </div>
        )}

        {/* Diagnostic Check Matrix Table */}
        <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between">
            <SectionHeader
              title="Instrumentation Channel Diagnostics Matrix"
              caption="Continuous verification across 6 distinct hardware signal failure modes"
            />
            <span className="text-[11px] font-mono text-stone-500">
              6 Diagnostic Routines / Cycle
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 uppercase font-mono text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Instrument Channel</th>
                  <th className="py-2.5 px-4 font-semibold">Current Value</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Missing</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Range</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Jump</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Flatline</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Drift</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Cross-Sensor</th>
                  <th className="py-2.5 px-4 font-semibold">Diagnostic Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {health && Object.entries(health.sensors).map(([key, item]) => (
                  <tr key={key} className="hover:bg-stone-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-stone-900 capitalize">
                      {item.name.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">
                      {typeof item.value === 'number' ? item.value.toFixed(1) : item.value} {item.unit}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={item.status} />
                    </td>
                    
                    {/* Diagnostic Checks */}
                    <td className="py-3 px-3 text-center">
                      {item.checks.missing ? (
                        <CheckCircle2 className="h-4 w-4 text-forest-700 mx-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-700 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.checks.range ? (
                        <CheckCircle2 className="h-4 w-4 text-forest-700 mx-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-700 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.checks.jump ? (
                        <CheckCircle2 className="h-4 w-4 text-forest-700 mx-auto" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-600 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.checks.flatline ? (
                        <CheckCircle2 className="h-4 w-4 text-forest-700 mx-auto" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-600 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.checks.drift ? (
                        <CheckCircle2 className="h-4 w-4 text-forest-700 mx-auto" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-600 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.checks.cross_sensor ? (
                        <CheckCircle2 className="h-4 w-4 text-forest-700 mx-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-700 mx-auto" />
                      )}
                    </td>

                    <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                      {item.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Diagnostic Engineering Notes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-1.5 shadow-sm">
            <h3 className="font-semibold text-stone-900 text-xs uppercase font-mono">Dual-Channel Disagreement</h3>
            <p className="text-stone-600 text-xs leading-relaxed">
              Compares analog ADC counts (GPIO34) against hardware comparator digital states (GPIO2). 
              If the analog pin reads dry (&lt;20%) while the digital comparator reads wet (0), an immediate FAULT is flagged.
            </p>
          </div>

          <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-1.5 shadow-sm">
            <h3 className="font-semibold text-stone-900 text-xs uppercase font-mono">Physical Bounds Guard</h3>
            <p className="text-stone-600 text-xs leading-relaxed">
              Validates that soil moisture remains strictly in [0, 100]%, soil pH in [0, 14], and ambient temperatures in [-10, 65]°C.
              Disconnected analog cables typically float to 4095 ADC counts, immediately tripping the upper bound guard.
            </p>
          </div>

          <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-1.5 shadow-sm">
            <h3 className="font-semibold text-stone-900 text-xs uppercase font-mono">Transient Jump &amp; Flatline</h3>
            <p className="text-stone-600 text-xs leading-relaxed">
              Detects sudden non-physical delta spikes (&gt;25% in 5 seconds) or frozen sensors repeating identical bit-level values across 8 consecutive cycles.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
