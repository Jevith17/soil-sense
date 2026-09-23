import React from 'react';
import { Info, Lightbulb, AlertCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

export type CalloutType = 'NOTE' | 'TIP' | 'IMPORTANT' | 'WARNING' | 'SAFETY';

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

export const Callout: React.FC<CalloutProps> = ({ type = 'NOTE', title, children }) => {
  const configs = {
    NOTE: {
      border: 'border-blue-300',
      bg: 'bg-blue-50/70',
      text: 'text-blue-950',
      iconColor: 'text-blue-700',
      icon: Info,
      defaultTitle: 'NOTE'
    },
    TIP: {
      border: 'border-emerald-300',
      bg: 'bg-emerald-50/70',
      text: 'text-emerald-950',
      iconColor: 'text-emerald-700',
      icon: Lightbulb,
      defaultTitle: 'OPERATING TIP'
    },
    IMPORTANT: {
      border: 'border-stone-400',
      bg: 'bg-stone-100/80',
      text: 'text-stone-900',
      iconColor: 'text-stone-800',
      icon: AlertCircle,
      defaultTitle: 'IMPORTANT SPECIFICATION'
    },
    WARNING: {
      border: 'border-amber-300',
      bg: 'bg-amber-50/80',
      text: 'text-amber-950',
      iconColor: 'text-amber-800',
      icon: AlertTriangle,
      defaultTitle: 'WARNING'
    },
    SAFETY: {
      border: 'border-rose-400',
      bg: 'bg-rose-50/80',
      text: 'text-rose-950',
      iconColor: 'text-rose-800',
      icon: ShieldAlert,
      defaultTitle: 'HARDWARE & SAFETY INTERLOCK'
    }
  };

  const cfg = configs[type];
  const Icon = cfg.icon;

  return (
    <div className={`my-4 p-4 rounded border ${cfg.border} ${cfg.bg} ${cfg.text} text-xs leading-relaxed space-y-1`}>
      <div className="flex items-center gap-2 font-mono font-bold tracking-wider text-[11px] uppercase">
        <Icon className={`h-4 w-4 shrink-0 ${cfg.iconColor}`} />
        <span>{title || cfg.defaultTitle}</span>
      </div>
      <div className="pl-6 text-stone-800 space-y-1">
        {children}
      </div>
    </div>
  );
};

