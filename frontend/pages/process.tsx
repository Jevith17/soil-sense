import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  GitFork, 
  Droplet, 
  Layers, 
  Sun, 
  ArrowRight, 
  ArrowDown, 
  Scale,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { ProcessState, Reading } from '@/types';

export default function ProcessIntelligencePage() {
  const [processState, setProcessState] = useState<ProcessState | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);
  const [waterSupplied, setWaterSupplied] = useState(12.5);
  const [nInput, setNInput] = useState(100.0);
  const [loading, setLoading] = useState(false);

  const loadProcessData = async () => {
    try {
      const ps = await api.getProcessState();
      setProcessState(ps);
      const latest = await api.getLatest();
      if (latest && latest.reading) setReading(latest.reading);
    } catch (e) {
      console.warn('Process intelligence load error:', e);
    }
  };

  useEffect(() => {
    loadProcessData();
    const interval = setInterval(loadProcessData, 6000);
    return () => clearInterval(interval);
  }, []);

  // Recalculate derived water balance based on slider
  const lossEstimate = processState?.water_balance.estimated_loss_l ?? 9.8;
  const netWaterAccumulation = Number((waterSupplied - lossEstimate).toFixed(1));

  // Recalculate derived N balance based on slider
  const estUptake = Number((nInput * 0.64).toFixed(1));
  const estLoss = Number((nInput * 0.21).toFixed(1));
  const estRemaining = Number((nInput - estUptake - estLoss).toFixed(1));

  return (
    <DashboardLayout title="SoilSense - Process Intelligence & Balances">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-stone-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                MODULE 05
              </span>
              <h1 className="text-xl font-bold tracking-tight text-stone-900">Process Intelligence &amp; Material Balances</h1>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Agronomic transport phenomena and mass conservation equations across root-zone and canopy boundary layers.
            </p>
          </div>

          <div className="mt-3 md:mt-0 flex items-center space-x-3">
            <Link
              href="/docs/data/water-balance"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-stone-500 hover:text-forest-800 transition-colors bg-stone-100/80 hover:bg-stone-200/60 px-2 py-1.5 rounded border border-stone-200"
            >
              <span>Docs</span>
              <span className="text-[10px]">↗</span>
            </Link>
            <div className="flex items-center space-x-2 text-xs font-mono text-stone-600 bg-stone-100/80 px-3 py-1.5 rounded border border-stone-200">
              <Scale className="h-4 w-4 text-forest-700" />
              <span>Conservation of Mass Principles</span>
            </div>
          </div>
        </div>

        {/* Process Flow Diagram (PFD) / Agronomic State Tree */}
        <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
            <SectionHeader
              title="Process Flow Diagram: Root-Zone Transport Phenomena"
              caption="Coupled interactions governing moisture transport, nutrient availability, and transpiration driving forces"
            />
            <button 
              onClick={() => { setLoading(true); loadProcessData().finally(() => setLoading(false)); }}
              className="text-stone-400 hover:text-stone-600 p-1 rounded hover:bg-stone-50 transition"
              title="Refresh balances"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stage 1: Water Balance Subsystem */}
            <div className="bg-stone-50/70 border border-stone-200 rounded p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-stone-500 font-semibold">STAGE 01</span>
                  <StatusBadge 
                    status={processState?.water_status === 'LOW' ? 'CHECK' : 'NORMAL'} 
                    label={processState?.water_status || 'LOW'} 
                  />
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="p-1.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    <Droplet className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold text-sm text-stone-800">Water Subsystem</h3>
                </div>
                <p className="text-xs text-stone-600 mb-3 leading-relaxed">
                  Volumetric soil moisture content relative to field capacity and permanent wilting point.
                </p>
              </div>
              <div className="bg-white rounded border border-stone-200 p-2.5 space-y-1 font-mono text-xs">
                <div className="flex justify-between text-stone-500">
                  <span>Current Moisture:</span>
                  <span className="font-semibold text-stone-800">{reading ? `${reading.moisture}%` : '27.0%'}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Deficit to Optimal:</span>
                  <span className="font-semibold text-amber-700">23.0%</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Retention Limit:</span>
                  <span className="text-stone-700">{processState?.water_balance.soil_retention_capacity_l ?? 19.0} L</span>
                </div>
              </div>
            </div>

            {/* Stage 2: Nutrient Transport Subsystem */}
            <div className="bg-stone-50/70 border border-stone-200 rounded p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-stone-500 font-semibold">STAGE 02</span>
                  <StatusBadge 
                    status={processState?.nutrient_status === 'ADEQUATE' ? 'NORMAL' : 'CHECK'} 
                    label={processState?.nutrient_status || 'ADEQUATE'} 
                  />
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="p-1.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Layers className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold text-sm text-stone-800">Nutrient Transport</h3>
                </div>
                <p className="text-xs text-stone-600 mb-3 leading-relaxed">
                  Active mineral nutrient concentrations dissolved in soil pore water solution.
                </p>
              </div>
              <div className="bg-white rounded border border-stone-200 p-2.5 space-y-1 font-mono text-xs">
                <div className="flex justify-between text-stone-500">
                  <span>Available N:</span>
                  <span className="font-semibold text-stone-800">{reading ? `${reading.n} mg/kg` : '64 mg/kg'}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>P / K Ratio:</span>
                  <span className="text-stone-700">{reading ? `${reading.p} / ${reading.k}` : '51 / 73 mg/kg'}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Substrate pH:</span>
                  <span className="text-stone-700">{reading ? reading.ph.toFixed(2) : '6.45'}</span>
                </div>
              </div>
            </div>

            {/* Stage 3: Atmospheric Driving Force */}
            <div className="bg-stone-50/70 border border-stone-200 rounded p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-stone-500 font-semibold">STAGE 03</span>
                  <StatusBadge 
                    status={processState?.env_demand === 'HIGH' ? 'CHECK' : 'NORMAL'} 
                    label={`DEMAND: ${processState?.env_demand || 'HIGH'}`} 
                  />
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="p-1.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    <Sun className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold text-sm text-stone-800">Atmospheric Demand</h3>
                </div>
                <p className="text-xs text-stone-600 mb-3 leading-relaxed">
                  Boundary vapor pressure gradient driving transpiration pull and soil evaporation rate.
                </p>
              </div>
              <div className="bg-white rounded border border-stone-200 p-2.5 space-y-1 font-mono text-xs">
                <div className="flex justify-between text-stone-500">
                  <span>Air Temperature:</span>
                  <span className="font-semibold text-stone-800">{reading ? `${reading.air_temp}°C` : '33.2°C'}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Solar Radiation:</span>
                  <span className="text-stone-700">{reading ? `${reading.solar} W/m²` : '910 W/m²'}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Relative Humidity:</span>
                  <span className="text-stone-700">{reading ? `${reading.humidity}%` : '54%'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Converging Coupling Vector */}
          <div className="flex justify-center my-3">
            <div className="flex items-center space-x-2 text-[11px] font-mono font-medium text-stone-600 bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
              <ArrowDown className="h-3.5 w-3.5 text-forest-700" />
              <span>Coupled Transport Phenomena Output</span>
            </div>
          </div>

          {/* Physiological Crop Response Assessment */}
          <div className="bg-stone-50 border border-stone-200 rounded p-4 max-w-3xl mx-auto">
            <div className="flex items-start space-x-3">
              <div className="p-1.5 rounded bg-forest-50 text-forest-800 border border-forest-200 mt-0.5">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-forest-800">
                  Target Crop Physiological Response
                </span>
                <p className="text-xs text-stone-800 font-medium mt-1 leading-relaxed">
                  {processState?.crop_response || 'Transpiration stress elevated under high vapor deficit; Water status is LOW, nutrient availability is ADEQUATE. Controlled irrigation required.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Material Balance Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card 1: Water Mass Balance */}
          <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded bg-blue-50 text-blue-800 border border-blue-200">
                  <Droplet className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-sm text-stone-900">Water Mass Balance</h3>
              </div>
              <span className="text-[11px] font-mono font-semibold bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200">
                ΔM_w = W_in − W_loss
              </span>
            </div>

            {/* Dynamic Adjustment Control */}
            <div className="bg-stone-50/70 border border-stone-200 rounded p-3 text-xs space-y-2">
              <div className="flex justify-between items-center text-stone-700">
                <span className="font-medium flex items-center">
                  <Sliders className="h-3.5 w-3.5 mr-1 text-stone-500" />
                  Simulated Inflow ($W_{'{in}'}$):
                </span>
                <span className="font-mono font-bold text-stone-900">{waterSupplied.toFixed(1)} Liters</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="0.5"
                value={waterSupplied}
                onChange={(e) => setWaterSupplied(parseFloat(e.target.value))}
                className="w-full accent-forest-700 cursor-pointer h-1.5 bg-stone-200 rounded"
              />
            </div>

            {/* Mass Balance Summary Table */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-stone-50 p-3 rounded border border-stone-200">
                <div className="text-[10px] font-mono uppercase text-stone-500">Inflow (W_in)</div>
                <div className="text-lg font-bold text-stone-900 font-mono mt-0.5">
                  {waterSupplied.toFixed(1)} <span className="text-xs font-normal text-stone-500">L</span>
                </div>
              </div>

              <div className="bg-stone-50 p-3 rounded border border-stone-200">
                <div className="text-[10px] font-mono uppercase text-stone-500">Loss (W_loss)</div>
                <div className="text-lg font-bold text-amber-700 font-mono mt-0.5">
                  {lossEstimate.toFixed(1)} <span className="text-xs font-normal text-stone-500">L</span>
                </div>
              </div>

              <div className="bg-stone-50 p-3 rounded border border-stone-200">
                <div className="text-[10px] font-mono uppercase text-stone-500">Net Accumulation</div>
                <div className={`text-lg font-bold font-mono mt-0.5 ${netWaterAccumulation >= 0 ? 'text-forest-700' : 'text-red-700'}`}>
                  {netWaterAccumulation >= 0 ? `+${netWaterAccumulation}` : netWaterAccumulation} <span className="text-xs font-normal text-stone-500">L</span>
                </div>
              </div>
            </div>

            {/* Assumptions & Governing Equations */}
            <div className="bg-stone-50/50 border border-stone-200 rounded p-3 text-xs space-y-1.5 font-mono text-stone-600">
              <div className="font-semibold text-stone-800 text-[11px] uppercase tracking-wide">
                Transport Parameters &amp; Boundary Conditions:
              </div>
              <div className="flex justify-between py-0.5 border-b border-stone-200/60">
                <span>Transpiration rate (Penman-Monteith):</span>
                <span className="text-stone-800 font-semibold">{processState?.water_balance.transpiration_loss_l ?? 6.4} L/day</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-stone-200/60">
                <span>Soil surface evaporation:</span>
                <span className="text-stone-800 font-semibold">{processState?.water_balance.evaporation_loss_l ?? 3.4} L/day</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span>Residual storage capacity before saturation:</span>
                <span className="text-forest-700 font-semibold">{processState?.water_balance.soil_retention_capacity_l ?? 19.0} L</span>
              </div>
            </div>
          </div>

          {/* Card 2: Nitrogen Mass Balance */}
          <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Layers className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-sm text-stone-900">Nitrogen Mass Balance</h3>
              </div>
              <span className="text-[11px] font-mono font-semibold bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200">
                ΔN = N_in − N_uptake − N_loss
              </span>
            </div>

            {/* Dynamic Adjustment Control */}
            <div className="bg-stone-50/70 border border-stone-200 rounded p-3 text-xs space-y-2">
              <div className="flex justify-between items-center text-stone-700">
                <span className="font-medium flex items-center">
                  <Sliders className="h-3.5 w-3.5 mr-1 text-stone-500" />
                  Simulated Input ($N_{'{in}'}$):
                </span>
                <span className="font-mono font-bold text-stone-900">{nInput.toFixed(1)} grams</span>
              </div>
              <input
                type="range"
                min="0"
                max="250"
                step="5"
                value={nInput}
                onChange={(e) => setNInput(parseFloat(e.target.value))}
                className="w-full accent-forest-700 cursor-pointer h-1.5 bg-stone-200 rounded"
              />
            </div>

            {/* Mass Balance Summary Table */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-stone-50 p-2.5 rounded border border-stone-200">
                <div className="text-[10px] font-mono uppercase text-stone-500">N_in</div>
                <div className="text-base font-bold text-stone-800 font-mono mt-0.5">
                  {nInput.toFixed(0)} <span className="text-[10px] font-normal text-stone-500">g</span>
                </div>
              </div>

              <div className="bg-stone-50 p-2.5 rounded border border-stone-200">
                <div className="text-[10px] font-mono uppercase text-stone-500">Uptake</div>
                <div className="text-base font-bold text-forest-700 font-mono mt-0.5">
                  {estUptake.toFixed(1)} <span className="text-[10px] font-normal text-stone-500">g</span>
                </div>
              </div>

              <div className="bg-stone-50 p-2.5 rounded border border-stone-200">
                <div className="text-[10px] font-mono uppercase text-stone-500">Loss</div>
                <div className="text-base font-bold text-amber-700 font-mono mt-0.5">
                  {estLoss.toFixed(1)} <span className="text-[10px] font-normal text-stone-500">g</span>
                </div>
              </div>

              <div className="bg-stone-50 p-2.5 rounded border border-stone-200">
                <div className="text-[10px] font-mono uppercase text-stone-500">Residual</div>
                <div className="text-base font-bold text-stone-800 font-mono mt-0.5">
                  {estRemaining.toFixed(1)} <span className="text-[10px] font-normal text-stone-500">g</span>
                </div>
              </div>
            </div>

            {/* Equilibrium Parameters & Leaching Vulnerability */}
            <div className="bg-stone-50/50 border border-stone-200 rounded p-3 text-xs space-y-1.5 font-mono text-stone-600">
              <div className="font-semibold text-stone-800 text-[11px] uppercase tracking-wide">
                Chemical Equilibrium &amp; Partitioning Factors:
              </div>
              <div className="flex justify-between py-0.5 border-b border-stone-200/60">
                <span>Root vegetative uptake efficiency (NUE):</span>
                <span className="text-forest-700 font-semibold">64.0%</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-stone-200/60">
                <span>Denitrification &amp; leaching fraction:</span>
                <span className="text-amber-700 font-semibold">21.0%</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span>Environmental leaching vulnerability:</span>
                <span className="text-forest-700 font-semibold uppercase">{processState?.nitrogen_balance.n_leaching_risk ?? 'LOW'}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
