import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  sensorName?: string;
  message?: string;
  recommendation?: string;
  isSafetyLockout?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  sensorName,
  message = "The system cannot safely determine process irrigation requirements.",
  recommendation = "VERIFY SENSOR WIRING & CALIBRATION",
  isSafetyLockout = true,
  onRetry,
  className = "",
}) => {
  const header = title || (sensorName ? `${sensorName.toUpperCase()} SENSOR UNAVAILABLE` : "INSTRUMENTATION ANOMALY");

  return (
    <div
      className={`border border-rose-300 rounded-lg p-5 bg-rose-50/70 text-rose-950 my-4 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-md bg-rose-200/80 text-rose-800 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldAlert className="h-5 w-5" />
        </div>

        <div className="flex-1 space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-200 text-rose-900">
              FAULT INTERLOCK
            </span>
            <h4 className="font-bold text-sm text-rose-900">
              {header}
            </h4>
          </div>

          <p className="text-rose-800 leading-relaxed">
            {message}
          </p>

          <div className="pt-2 border-t border-rose-200/80 flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] font-mono">
              <span className="text-rose-700">Operating Action: </span>
              <strong className="text-rose-950 underline">{recommendation}</strong>
            </div>

            {isSafetyLockout && (
              <span className="text-[10px] font-mono bg-white/80 px-2 py-0.5 rounded border border-rose-200 text-rose-800">
                Pump operation blocked until sensor returns to valid state
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

