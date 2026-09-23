import React from 'react';
import { Radio, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  lastReadingTime?: string;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "NO SENSOR DATA",
  message = "Waiting for the next measurement frame from SoilSense instrumentation.",
  lastReadingTime,
  onAction,
  actionLabel = "CHECK CONNECTION",
  className = "",
}) => {
  return (
    <div
      className={`border border-dashed border-stone-300 rounded-lg p-8 text-center bg-stone-50/70 max-w-lg mx-auto my-6 ${className}`}
    >
      <div className="h-10 w-10 mx-auto mb-3 rounded-full bg-stone-200/80 text-stone-600 flex items-center justify-center">
        <Radio className="h-5 w-5" />
      </div>

      <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-stone-800">
        {title}
      </h3>

      <p className="text-xs text-stone-600 mt-1.5 max-w-md mx-auto leading-relaxed">
        {message}
      </p>

      {lastReadingTime && (
        <div className="mt-3 text-[11px] font-mono text-stone-500">
          Last successful telemetry frame: <strong className="text-stone-700">{lastReadingTime}</strong>
        </div>
      )}

      {onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-mono font-medium transition-colors shadow-sm"
        >
          <RefreshCw className="h-3 w-3 text-stone-500" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};

