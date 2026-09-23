import React, { useState } from 'react';
import { 
  Radio, 
  ShieldCheck, 
  Cpu, 
  RefreshCw, 
  Clock, 
  MapPin, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface TopNavProps {
  isSimulated?: boolean;
  pumpStatus?: string;
  lastReadingTime?: string;
  onRefresh?: () => void;
  onScenarioTrigger?: (scenario: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ 
  isSimulated = true, 
  pumpStatus = 'OFF',
  lastReadingTime,
  onRefresh,
  onScenarioTrigger
}) => {
  const [triggering, setTriggering] = useState(false);

  const handleScenario = async (sc: string) => {
    setTriggering(true);
    try {
      if (onScenarioTrigger) {
        onScenarioTrigger(sc);
      } else {
        await api.triggerSimulation(sc);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Failed to trigger process scenario:', err);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <header className="h-14 bg-white border-b border-stone-200 text-stone-800 px-5 flex items-center justify-between sticky top-0 z-40 shadow-xs">
      {/* Current Field / Farm Context */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-stone-600 bg-stone-100/80 px-2.5 py-1 rounded border border-stone-200">
          <MapPin className="h-3.5 w-3.5 text-forest-700" />
          <span className="font-medium text-stone-900">Greenhouse Block 04</span>
          <span className="text-stone-400">/</span>
          <span className="font-mono text-[11px] text-stone-600">Bed 12 (Tomato)</span>
        </div>

        {/* Telemetry Freshness */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-stone-500">
          <Clock className="h-3.5 w-3.5 text-stone-400" />
          <span>Last reading:</span>
          <strong className="text-stone-700">
            {lastReadingTime || new Date().toLocaleTimeString()}
          </strong>
        </div>
      </div>

      {/* Right Side Status & Equipment State */}
      <div className="flex items-center gap-3">
        {/* Source Telemetry Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium border ${
            isSimulated 
              ? 'bg-amber-50/80 text-amber-900 border-amber-300' 
              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
          }`}
        >
          <Radio className="h-3 w-3" />
          <span>{isSimulated ? 'SIMULATED SENSOR' : 'REAL SENSOR (ESP32)'}</span>
        </div>

        {/* Pump Process State */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold border ${
            pumpStatus === 'ON'
              ? 'bg-emerald-600 text-white border-emerald-700 animate-pulse'
              : 'bg-stone-100 text-stone-700 border-stone-200'
          }`}
        >
          <Cpu className="h-3 w-3" />
          <span>PUMP: {pumpStatus}</span>
        </div>

        {/* Scenario Testing Dropdown */}
        <div className="flex items-center bg-stone-50 border border-stone-200 rounded px-1.5 py-0.5">
          <span className="text-[10px] font-mono font-semibold text-stone-500 uppercase px-1">
            TEST SCENARIO:
          </span>
          <select 
            disabled={triggering}
            onChange={(e) => {
              if (e.target.value) {
                handleScenario(e.target.value);
                e.target.value = '';
              }
            }}
            className="bg-transparent text-xs text-stone-800 font-mono py-1 pr-1 outline-none cursor-pointer"
            defaultValue=""
          >
            <option value="" disabled>Select Condition...</option>
            <option value="DRY_SOIL">1. Dry Soil (Deficit)</option>
            <option value="WET_SOIL">2. Wet Soil (Equilibrium)</option>
            <option value="LOW_N">3. Low Nitrogen (Nutrient Deficit)</option>
            <option value="SENSOR_FAILURE">4. Instrument Fault (Verify)</option>
            <option value="POST_IRRIGATION">5. Post-Irrigation State</option>
            <option value="NORMAL">6. Nominal Operating State</option>
          </select>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button 
            onClick={onRefresh}
            title="Poll Instruments"
            className="p-1.5 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${triggering ? 'animate-spin' : ''}`} />
          </button>
        )}

        {/* Documentation Link */}
        <a
          href="/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium text-stone-600 hover:text-forest-800 bg-stone-100 hover:bg-stone-200/80 border border-stone-200 rounded transition-colors"
          title="Open SoilSense Documentation & Operating Manual"
        >
          <span>Docs</span>
          <span className="text-[10px]">↗</span>
        </a>

        {/* User Role */}
        <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-stone-200">
          <div className="h-6 w-6 rounded bg-forest-800 text-white flex items-center justify-center font-mono text-[11px] font-bold">
            OP
          </div>
          <div className="text-left text-xs leading-none">
            <div className="font-semibold text-stone-800">Process Operator</div>
            <div className="text-[10px] text-stone-400 font-mono mt-0.5">Admin Level</div>
          </div>
        </div>
      </div>
    </header>
  );
};
