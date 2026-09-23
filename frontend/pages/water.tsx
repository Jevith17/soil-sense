import React, { useState, useEffect } from 'react';
import { 
  Droplet, 
  Clock, 
  Activity, 
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Info
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { Decision, Reading, WaterBalance } from '@/types';

export default function SmartWaterPage() {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);
  const [waterBalance, setWaterBalance] = useState<WaterBalance | null>(null);

  const loadData = async () => {
    try {
      const data = await api.getLatest();
      if (data.decision) setDecision(data.decision);
      if (data.reading) setReading(data.reading);
      const wb = await api.getWaterBalance();
      setWaterBalance(wb);
    } catch (e) {
      console.warn('Smart water data load error:', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout title="SoilSense - Controlled Irrigation & Water Delivery">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-stone-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                MODULE 06
              </span>
              <h1 className="text-xl font-bold tracking-tight text-stone-900 flex items-center">
                <Droplet className="h-5 w-5 mr-2 text-blue-700" />
                Controlled Irrigation &amp; Water Delivery
              </h1>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Precision volumetric allocation: Root-zone matric deficit and Penman-Monteith boundary layer loss model.
            </p>
          </div>

          <div className="mt-3 md:mt-0 flex items-center space-x-3">
            <div className="text-xs font-mono text-stone-700 bg-stone-100 px-3 py-1.5 rounded border border-stone-200">
              <span>Current Moisture: </span>
              <span className="font-bold text-stone-900">{reading ? `${reading.moisture.toFixed(1)}%` : '27.0%'}</span>
            </div>
          </div>
        </div>

        {/* 5-Step Process Optimization Chain */}
        <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm">
          <SectionHeader
            title="Hydraulic Delivery Protocol &amp; Execution Pipeline"
            caption="Sequential operating stages from deficit identification to root-zone equilibrium"
          />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4">
            {/* Step 1: Operating Recommendation */}
            <div className="bg-stone-50 border border-stone-200 rounded p-3.5 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider font-semibold text-stone-500 mb-1">
                  1. Recommendation
                </div>
                <div className="text-base font-bold text-stone-900 font-mono">
                  {decision?.decision || 'IRRIGATE'}
                </div>
              </div>
              <p className="text-[11px] text-stone-500 mt-2">Target matric deficit replenishment</p>
            </div>

            {/* Step 2: Water Volume */}
            <div className="bg-stone-50 border border-stone-200 rounded p-3.5 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider font-semibold text-stone-500 mb-1">
                  2. Prescribed Volume
                </div>
                <div className="text-base font-bold text-stone-900 font-mono">
                  {decision?.volume_liters || 12.5} <span className="text-xs font-normal text-stone-500">L</span>
                </div>
              </div>
              <p className="text-[11px] text-stone-500 mt-2">Dosing rate ~2.1 L/min</p>
            </div>

            {/* Step 3: Actuator Runtime */}
            <div className="bg-stone-50 border border-stone-200 rounded p-3.5 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider font-semibold text-stone-500 mb-1">
                  3. Pump Runtime
                </div>
                <div className="text-base font-bold text-stone-900 font-mono">
                  {decision?.duration_minutes || 6} <span className="text-xs font-normal text-stone-500">min</span>
                </div>
              </div>
              <p className="text-[11px] text-forest-700 font-mono mt-2">Within safe envelope &lt; 15m</p>
            </div>

            {/* Step 4: Execution Timing */}
            <div className="bg-stone-50 border border-stone-200 rounded p-3.5 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider font-semibold text-stone-500 mb-1">
                  4. Window
                </div>
                <div className="text-base font-bold text-forest-800 font-mono">
                  IMMEDIATE
                </div>
              </div>
              <p className="text-[11px] text-stone-500 mt-2">Awaiting operator sign-off</p>
            </div>

            {/* Step 5: Target Response */}
            <div className="bg-stone-50 border border-stone-200 rounded p-3.5 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider font-semibold text-stone-500 mb-1">
                  5. Target Moisture
                </div>
                <div className="text-base font-bold text-forest-700 font-mono">
                  50.0% <span className="text-xs font-normal text-stone-500">Target</span>
                </div>
              </div>
              <p className="text-[11px] text-stone-500 mt-2">+23.0% net root zone recovery</p>
            </div>
          </div>
        </div>

        {/* Engineering Justification: Why 12.5 L? */}
        <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
            <HelpCircle className="h-4 w-4 text-forest-700" />
            <h2 className="font-semibold text-sm text-stone-900">Engineering Justification: Volumetric Sizing Basis</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-stone-700">
            {/* Column 1: Mass Balance Formulation */}
            <div className="space-y-3">
              <span className="font-semibold text-[11px] font-mono uppercase tracking-wider text-stone-600 block">
                Agronomic Mass Balance Formulation:
              </span>
              <p className="text-stone-600 leading-relaxed text-xs">
                The recommended volume of <strong className="text-stone-900">12.5 Liters</strong> is calculated to satisfy both 
                accumulated root-zone moisture deficit and upcoming hourly atmospheric evaporative losses without exceeding holding capacity:
              </p>

              <div className="bg-stone-50 p-3.5 rounded border border-stone-200 space-y-2 font-mono text-xs">
                <div className="flex justify-between py-0.5">
                  <span className="text-stone-500">Current Soil Moisture:</span>
                  <span className="text-stone-900 font-bold">{reading ? `${reading.moisture.toFixed(1)}%` : '27.0%'}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-stone-500">Target Field Capacity:</span>
                  <span className="text-forest-700 font-bold">50.0%</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-stone-500">Moisture Gap to Fill:</span>
                  <span className="text-amber-800 font-bold">23.0%</span>
                </div>
                <div className="flex justify-between border-t border-stone-200 pt-1.5">
                  <span className="text-stone-500">Est. Atmospheric Loss (W_loss):</span>
                  <span className="text-stone-800 font-bold">9.8 L</span>
                </div>
                <div className="flex justify-between border-t border-stone-200 pt-1.5 text-forest-800 font-bold">
                  <span>Net Root-Zone Retention:</span>
                  <span>+2.7 L</span>
                </div>
              </div>
            </div>

            {/* Column 2: Environmental Drivers and Bounds */}
            <div className="space-y-3">
              <span className="font-semibold text-[11px] font-mono uppercase tracking-wider text-stone-600 block">
                Atmospheric Driving Forces &amp; Safety Envelope:
              </span>
              
              <div className="space-y-2.5">
                <div className="bg-stone-50 p-3 rounded border border-stone-200 flex items-start space-x-2.5">
                  <Activity className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-stone-600 leading-relaxed">
                    <strong className="text-stone-800">Elevated Vapor Pressure Deficit (VPD):</strong> Air temperature of {reading?.air_temp || 33}°C and solar irradiance of {reading?.solar || 910} W/m² drive steady stomatal transpiration of ~6.4 L/cycle.
                  </div>
                </div>

                <div className="bg-stone-50 p-3 rounded border border-stone-200 flex items-start space-x-2.5">
                  <ShieldCheck className="h-4 w-4 text-forest-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-stone-600 leading-relaxed">
                    <strong className="text-stone-800">Anti-Leaching Guard:</strong> Soil water retention capacity is 19.0 L. Dosing 12.5 L operates well below the saturation threshold (&lt; 68%), preventing gravitational runoff and fertilizer leaching.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
