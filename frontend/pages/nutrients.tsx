import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  ArrowDown, 
  CheckCircle2, 
  XCircle, 
  Droplet, 
  Sun, 
  ShieldCheck, 
  AlertTriangle,
  Info,
  Scale
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { Reading, Decision } from '@/types';

export default function SmartNutrientsPage() {
  const [reading, setReading] = useState<Reading | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);

  const loadData = async () => {
    try {
      const data = await api.getLatest();
      if (data.reading) setReading(data.reading);
      if (data.decision) setDecision(data.decision);
    } catch (e) {
      console.warn('Smart nutrients fetch error:', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  // 3-Stage Agronomic Gate Validation
  const isNutrientDeficient = reading ? (reading.n < 50 || reading.p < 30 || reading.k < 40) : false;
  const isMoistureSuitable = reading ? (reading.moisture >= 35 && reading.moisture <= 65) : false;
  const isEnvironmentSuitable = reading ? (reading.air_temp <= 34 && reading.humidity >= 40 && reading.solar <= 950 && reading.ph >= 5.5 && reading.ph <= 7.5) : true;

  const shouldFertigate = isNutrientDeficient && isMoistureSuitable && isEnvironmentSuitable;

  return (
    <DashboardLayout title="SoilSense - Nutrient Management & Fertigation Logic Gate">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-stone-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                MODULE 07
              </span>
              <h1 className="text-xl font-bold tracking-tight text-stone-900 flex items-center">
                <Layers className="h-5 w-5 mr-2 text-forest-700" />
                Nutrient Management &amp; Fertigation Logic Gate
              </h1>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Multi-parameter chemical engineering logic gate preventing nutrient leaching, osmotic scorching, and volatilization.
            </p>
          </div>

          <div className="mt-3 md:mt-0 flex items-center space-x-2 text-xs font-mono text-stone-700 bg-stone-100 px-3 py-1.5 rounded border border-stone-200">
            <span>Soil N-P-K: </span>
            <span className="font-bold text-stone-900">{reading ? `${reading.n.toFixed(0)}-${reading.p.toFixed(0)}-${reading.k.toFixed(0)}` : '64-51-73'} mg/kg</span>
          </div>
        </div>

        {/* 4-Stage Decision Flowchart */}
        <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm max-w-3xl mx-auto space-y-4">
          <SectionHeader
            title="Sequential Fertigation Gate Evaluation"
            caption="Three-stage physical verification required prior to chemical fertilizer injection"
          />

          {/* Gate 1: Nutrient Deficiency? */}
          <div className="p-4 rounded border border-stone-200 bg-stone-50/70 flex items-center justify-between">
            <div className="flex items-start space-x-3">
              <div className="p-1.5 rounded bg-forest-50 text-forest-800 border border-forest-200 mt-0.5">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] font-mono font-semibold uppercase text-stone-500">GATE 01: NUTRIENT INVENTORY</div>
                <div className="text-sm font-semibold text-stone-900">Is there an active macronutrient deficit?</div>
                <div className="text-xs text-stone-600 mt-0.5 font-mono">
                  Available N: <strong className="text-stone-900">{reading?.n ?? 64} mg/kg</strong> (Deficit threshold: &lt; 50 mg/kg)
                </div>
              </div>
            </div>
            <div>
              <StatusBadge 
                status={isNutrientDeficient ? 'CHECK' : 'NORMAL'}
                label={isNutrientDeficient ? 'DEFICIT DETECTED' : 'RESERVES ADEQUATE'}
              />
            </div>
          </div>

          {/* Connector */}
          <div className="flex justify-center">
            <ArrowDown className="h-4 w-4 text-stone-400" />
          </div>

          {/* Gate 2: Moisture Suitable? */}
          <div className="p-4 rounded border border-stone-200 bg-stone-50/70 flex items-center justify-between">
            <div className="flex items-start space-x-3">
              <div className="p-1.5 rounded bg-blue-50 text-blue-800 border border-blue-200 mt-0.5">
                <Droplet className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] font-mono font-semibold uppercase text-stone-500">GATE 02: SOLUTE DISSOLUTION MATRIX</div>
                <div className="text-sm font-semibold text-stone-900">Is soil moisture suitable as a carrier solvent?</div>
                <div className="text-xs text-stone-600 mt-0.5 font-mono">
                  Current Moisture: <strong className="text-stone-900">{reading ? `${reading.moisture}%` : '27.0%'}</strong> (Permissible window: 35% – 65%)
                </div>
              </div>
            </div>
            <div>
              <StatusBadge 
                status={isMoistureSuitable ? 'NORMAL' : 'FAULT'}
                label={isMoistureSuitable ? 'CARRIER SUITABLE (35–65%)' : 'UNSUITABLE (OUT OF BOUNDS)'}
              />
            </div>
          </div>

          {/* Connector */}
          <div className="flex justify-center">
            <ArrowDown className="h-4 w-4 text-stone-400" />
          </div>

          {/* Gate 3: Environment Suitable? */}
          <div className="p-4 rounded border border-stone-200 bg-stone-50/70 flex items-center justify-between">
            <div className="flex items-start space-x-3">
              <div className="p-1.5 rounded bg-amber-50 text-amber-800 border border-amber-200 mt-0.5">
                <Sun className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] font-mono font-semibold uppercase text-stone-500">GATE 03: MICROCLIMATE UPTAKE WINDOW</div>
                <div className="text-sm font-semibold text-stone-900">Are boundary temperatures safe to prevent osmotic scorching?</div>
                <div className="text-xs text-stone-600 mt-0.5 font-mono">
                  Temp: {reading?.air_temp || 33.2}°C (Limit: ≤34°C) | Solar: {reading?.solar || 910} W/m² | pH: {reading?.ph ? reading.ph.toFixed(2) : '6.45'}
                </div>
              </div>
            </div>
            <div>
              <StatusBadge 
                status={isEnvironmentSuitable ? 'NORMAL' : 'CHECK'}
                label={isEnvironmentSuitable ? 'SAFE CLIMATE WINDOW' : 'ELEVATED STRESS'}
              />
            </div>
          </div>

          {/* Connector */}
          <div className="flex justify-center">
            <ArrowDown className="h-4 w-4 text-stone-400" />
          </div>

          {/* Final Outcome */}
          <div className={`p-4 rounded border text-center space-y-1.5 ${
            shouldFertigate 
              ? 'bg-forest-50/60 border-forest-300 text-forest-900' 
              : 'bg-stone-100 border-stone-300 text-stone-800'
          }`}>
            <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-stone-500">
              SYNTHESIZED LOGIC GATE OUTCOME
            </div>
            <div className="text-base font-bold font-mono">
              {shouldFertigate ? 'RECOMMEND FERTIGATION (NUTRIENTS AUTHORIZED)' : 'DO NOT FERTIGATE (OPERATING CONSTRAINTS UNMET)'}
            </div>
            <p className="text-xs text-stone-600 max-w-lg mx-auto leading-relaxed">
              {!isNutrientDeficient 
                ? "Available inorganic reserves are adequate (N=64 mg/kg). Dosing additional mineral fertilizer risks luxury consumption and salt toxicity."
                : !isMoistureSuitable 
                ? "Soil moisture is outside the safe 35–65% dissolution envelope. Supplying fertilizer in dry soil creates severe root osmotic shock. Recommend irrigation only."
                : "All 3 gates passed verification. Safe to inject balanced nutrient solution."}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
