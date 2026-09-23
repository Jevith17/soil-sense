import React from 'react';
import { StatusBadge, StatusType } from './StatusBadge';

interface MetricCardProps {
  label?: string;
  title?: string;
  value: string | number;
  unit?: string;
  status?: StatusType | string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  secondaryInfo?: string;
  caption?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  title,
  value,
  unit,
  status,
  trend,
  trendDirection = 'neutral',
  secondaryInfo,
  caption,
  icon,
  className = '',
}) => {
  const displayLabel = title || label || '';
  const displayInfo = caption || secondaryInfo;
  return (
    <div
      className={`bg-white border border-stone-200/90 rounded-lg p-4 shadow-sm hover:border-forest-300 transition-colors ${className}`}
    >
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-stone-700">
          {displayLabel}
        </span>
        {icon && <span className="text-stone-700">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-2xl font-bold tracking-tight text-stone-900 font-mono">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono font-medium text-stone-700">
            {unit}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 mt-2 border-t border-stone-100 text-[11px]">
        {trend ? (
          <span
            className={`font-mono ${
              trendDirection === 'down'
                ? 'text-amber-700'
                : trendDirection === 'up'
                ? 'text-forest-700'
                : 'text-stone-700'
            }`}
          >
            {trend}
          </span>
        ) : (
          <span className="text-stone-700">{displayInfo || 'Target Band: Optimal'}</span>
        )}

        {status && <StatusBadge status={status} size="sm" />}
      </div>
    </div>
  );
};
