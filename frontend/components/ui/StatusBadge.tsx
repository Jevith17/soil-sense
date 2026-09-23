import React from 'react';

export type StatusType = 'NORMAL' | 'CHECK' | 'FAULT' | 'INFO' | 'IDLE' | 'ACTIVE';

interface StatusBadgeProps {
  status: StatusType | string;
  size?: 'sm' | 'md';
  showDot?: boolean;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
  label,
  className = '',
}) => {
  const norm = (status || '').toUpperCase();
  const displayLabel = label || norm;

  let bgClass = 'bg-stone-100 text-stone-700 border-stone-300';
  let dotClass = 'bg-stone-400';

  if (norm === 'NORMAL' || norm === 'PASS' || norm === 'OK' || norm === 'SAFE' || norm === 'ACTIVE') {
    bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    dotClass = 'bg-emerald-600';
  } else if (norm === 'CHECK' || norm === 'ATTENTION' || norm === 'WARNING' || norm === 'MEDIUM') {
    bgClass = 'bg-amber-50 text-amber-800 border-amber-300';
    dotClass = 'bg-amber-600';
  } else if (norm === 'FAULT' || norm === 'FAIL' || norm === 'ERROR' || norm === 'CRITICAL' || norm === 'REJECTED') {
    bgClass = 'bg-rose-50 text-rose-800 border-rose-300';
    dotClass = 'bg-rose-600';
  } else if (norm === 'INFO' || norm === 'MONITOR' || norm === 'WAIT' || norm === 'WAIT / MONITOR') {
    bgClass = 'bg-sky-50 text-sky-800 border-sky-300';
    dotClass = 'bg-sky-600';
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded border ${bgClass} ${sizeClass} ${className}`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />}
      <span>{displayLabel}</span>
    </span>
  );
};

