import React from 'react';

interface SoilSenseLogoProps {
  className?: string;
  collapsed?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
}

export const SoilSenseLogo: React.FC<SoilSenseLogoProps> = ({ 
  className = '', 
  collapsed = false,
  size = 'md',
  variant = 'dark'
}) => {
  const iconSizes = {
    sm: 'h-6 w-6 p-1',
    md: 'h-8 w-8 p-1.5',
    lg: 'h-10 w-10 p-2',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  const isLight = variant === 'light';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Precision Soil Layer & Sensor Probe Glyph */}
      <div className={`${iconSizes[size]} rounded bg-forest-800 border border-forest-700/80 flex items-center justify-center shrink-0 shadow-xs`}>
        <svg viewBox="0 0 24 24" fill="none" className="h-full w-full stroke-emerald-300 stroke-2">
          {/* Top ground line */}
          <line x1="3" y1="5" x2="21" y2="5" strokeWidth="1.5" stroke="#a3b899" />
          {/* Middle soil stratum */}
          <line x1="3" y1="12" x2="21" y2="12" strokeWidth="1.5" stroke="#7d8f74" />
          {/* Bottom substrate stratum */}
          <line x1="3" y1="19" x2="21" y2="19" strokeWidth="1.5" stroke="#5c6b54" />
          {/* Vertical instrumentation probe */}
          <line x1="12" y1="2" x2="12" y2="20" strokeWidth="2" stroke="#e3eee5" strokeLinecap="round" />
          {/* Sensor node tip */}
          <circle cx="12" cy="19" r="2" fill="#498858" stroke="#ffffff" strokeWidth="1" />
        </svg>
      </div>

      {!collapsed && (
        <div className="flex flex-col leading-none">
          <div className={`flex items-baseline tracking-tight font-bold ${textSizes[size]}`}>
            <span className={isLight ? 'text-stone-900' : 'text-white'}>Soil</span>
            <span className="text-forest-700 font-light ml-0.5">Sense</span>
          </div>
          <span className={`text-[9px] font-mono tracking-widest uppercase mt-1 ${isLight ? 'text-stone-500' : 'text-stone-400'}`}>
            Process Monitor
          </span>
        </div>
      )}
    </div>
  );
};

