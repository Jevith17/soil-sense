import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { 
  Activity, 
  Droplet, 
  Thermometer, 
  Wind, 
  Sun, 
  Radio, 
  Cpu,
  Layers,
  Gauge
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { Reading } from '@/types';

export default function LiveFarmPage() {
  const [history, setHistory] = useState<Reading[]>([]);
  const [latest, setLatest] = useState<Reading | null>(null);

  const fetchData = async () => {
    try {
      const data = await api.getHistory(30);
      setHistory(data);
      if (data.length > 0) {
        setLatest(data[data.length - 1]);
      }
    } catch (e) {
      console.warn('Live farm history fetch error:', e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const chartData = history.map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    moisture: r.moisture,
    soil_temp: r.soil_temp,
    air_temp: r.air_temp,
    humidity: r.humidity,
    solar: r.solar,
    n: r.n,
    p: r.p,
    k: r.k,
    ch4: r.ch4,
    co2: r.co2,
  }));

  const mVal = latest ? latest.moisture : 27.0;

  return (
    <DashboardLayout title="SoilSense — Live Instrumentation">
      <div className="space-y-6">
        {/* Header */}
        <SectionHeader
          title="Live Farm Instrumentation"
          moduleIndex={2}
          subtitle="Continuous multichannel telemetry stream: Soil matric potential, boundary microclimate, and greenhouse atmospheric flux."
          actions={
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-stone-500 bg-stone-100 px-2.5 py-1 rounded border border-stone-200">
                PUMP: <strong className={latest?.pump_status === 'ON' ? 'text-emerald-700' : 'text-stone-700'}>{latest?.pump_status || 'OFF'}</strong>
              </span>
              <span className="font-mono text-xs text-forest-800 bg-forest-50 px-2.5 py-1 rounded border border-forest-200">
                SAMPLE RATE: 0.2 Hz
              </span>
            </div>
          }
        />

        {/* 1. Grouped Section: SOIL */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
              <Droplet className="h-4 w-4 text-forest-700" />
              1. Soil Matrix Instrumentation
            </h2>
            <span className="text-[11px] font-mono text-stone-500">Root-Zone Active Depth (0–15 cm)</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <MetricCard
              label="Moisture"
              value={mVal.toFixed(1)}
              unit="%"
              status={mVal < 35 ? 'CHECK' : 'NORMAL'}
              trend={mVal < 35 ? "↓ Operating Deficit" : "Optimal (35-65%)"}
              trendDirection={mVal < 35 ? 'down' : 'neutral'}
            />
            <MetricCard
              label="Soil Temp"
              value={latest ? latest.soil_temp.toFixed(1) : '29.0'}
              unit="°C"
              status="NORMAL"
              secondaryInfo="Band: 18–30 °C"
            />
            <MetricCard
              label="Soil pH"
              value={latest ? latest.ph.toFixed(2) : '6.40'}
              unit="pH"
              status="NORMAL"
              secondaryInfo="Optimal: 6.0–7.0"
            />
            <MetricCard
              label="Nitrogen (N)"
              value={latest ? latest.n.toFixed(0) : '64'}
              unit="mg/kg"
              status="NORMAL"
              secondaryInfo="Threshold: > 50"
            />
            <MetricCard
              label="Phosphorus (P)"
              value={latest ? latest.p.toFixed(0) : '51'}
              unit="mg/kg"
              status="NORMAL"
              secondaryInfo="Threshold: > 30"
            />
            <MetricCard
              label="Potassium (K)"
              value={latest ? latest.k.toFixed(0) : '73'}
              unit="mg/kg"
              status="NORMAL"
              secondaryInfo="Threshold: > 40"
            />
          </div>
        </div>

        {/* 2. Grouped Section: ENVIRONMENT */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
              <Sun className="h-4 w-4 text-amber-700" />
              2. Microclimate Atmosphere
            </h2>
            <span className="text-[11px] font-mono text-stone-500">Canopy Boundary Layer</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <MetricCard
              label="Air Temperature"
              value={latest ? latest.air_temp.toFixed(1) : '33.0'}
              unit="°C"
              status={latest && latest.air_temp > 32 ? 'CHECK' : 'NORMAL'}
              secondaryInfo="VPD Driver: Elevated"
            />
            <MetricCard
              label="Relative Humidity"
              value={latest ? latest.humidity.toFixed(0) : '65'}
              unit="%"
              status="NORMAL"
              secondaryInfo="RH Nominal (50–75%)"
            />
            <MetricCard
              label="Solar Radiation"
              value={latest ? latest.solar.toFixed(0) : '910'}
              unit="W/m²"
              status="NORMAL"
              secondaryInfo="Photosynthetic Irradiance"
            />
          </div>
        </div>

        {/* 3. Grouped Section: EMISSIONS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
              <Wind className="h-4 w-4 text-stone-600" />
              3. Gas Emissions &amp; Chemical Flux
            </h2>
            <span className="text-[11px] font-mono text-stone-500">Root Respiration &amp; Soil Aerobicity</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <MetricCard
              label="Methane (CH₄)"
              value={latest ? latest.ch4.toFixed(1) : '18.0'}
              unit="ppm"
              status="NORMAL"
              secondaryInfo="Aerobic threshold < 25 ppm"
            />
            <MetricCard
              label="Carbon Dioxide (CO₂)"
              value={latest ? latest.co2.toFixed(0) : '620'}
              unit="ppm"
              status="NORMAL"
              secondaryInfo="Canopy threshold < 800 ppm"
            />
          </div>
        </div>

        {/* Scientific Engineering Process Trend Plots */}
        <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-stone-900">
                Process Trend: Soil Moisture vs Target Operating Band
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Target operating band (35% to 65%) with automatic irrigation trigger limit at 35%.
              </p>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] text-stone-600">
              <span className="flex items-center gap-1">
                <span className="h-2 w-3 bg-stone-200 inline-block border border-dashed border-stone-400" /> Operating Range
              </span>
              <span className="flex items-center gap-1">
                <span className="h-0.5 w-3 bg-emerald-600 inline-block" /> Moisture %
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#f0ede6" />
                <XAxis dataKey="time" stroke="#78716c" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis stroke="#78716c" domain={[0, 100]} tick={{ fontSize: 10, fontFamily: 'monospace' }} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e7e5e4', fontSize: '11px', fontFamily: 'monospace' }} 
                />
                
                {/* Operating Target Band (35% to 65%) */}
                <ReferenceArea y1={35} y2={65} fill="#f4f7f4" fillOpacity={0.8} />
                <ReferenceLine y={35} stroke="#d97706" strokeDasharray="3 3" label={{ value: 'LOWER LIMIT (35%)', position: 'insideBottomLeft', fill: '#b45309', fontSize: 10 }} />
                <ReferenceLine y={50} stroke="#16a34a" strokeDasharray="2 2" label={{ value: 'TARGET (50%)', position: 'insideBottomRight', fill: '#15803d', fontSize: 10 }} />
                <ReferenceLine y={65} stroke="#64748b" strokeDasharray="3 3" label={{ value: 'UPPER LIMIT (65%)', position: 'insideTopLeft', fill: '#64748b', fontSize: 10 }} />

                <Line 
                  type="monotone" 
                  dataKey="moisture" 
                  name="Soil Moisture" 
                  stroke="#1b4d2e" 
                  strokeWidth={2} 
                  dot={{ r: 2, fill: '#1b4d2e' }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Environmental Coupling Plot (Air Temp & Solar Radiation) */}
          <div className="pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-stone-900">
                  Microclimate Driving Force (Air Temperature &amp; Solar Radiation)
                </h4>
                <p className="text-[11px] text-stone-500">
                  Governs vapor pressure deficit (VPD) and crop transpiration loss.
                </p>
              </div>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#f0ede6" />
                  <XAxis dataKey="time" stroke="#78716c" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <YAxis yAxisId="left" stroke="#d97706" domain={[15, 45]} tick={{ fontSize: 10, fontFamily: 'monospace' }} unit="°C" />
                  <YAxis yAxisId="right" orientation="right" stroke="#78716c" domain={[0, 1200]} tick={{ fontSize: 10, fontFamily: 'monospace' }} unit=" W" />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e7e5e4', fontSize: '11px', fontFamily: 'monospace' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  <Line yAxisId="left" type="monotone" dataKey="air_temp" name="Air Temp (°C)" stroke="#d97706" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  <Line yAxisId="right" type="monotone" dataKey="solar" name="Solar Radiation (W/m²)" stroke="#78716c" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
