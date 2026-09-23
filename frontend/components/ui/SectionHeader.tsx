import React from 'react';

interface SectionHeaderProps {
  title: string;
  moduleIndex?: number;
  subtitle?: string;
  caption?: string;
  badge?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  moduleIndex,
  subtitle,
  caption,
  badge,
  actions,
  className = '',
}) => {
  const description = subtitle || caption;
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center md:justify-between border-b border-stone-200 pb-3 mb-6 ${className}`}
    >
      <div>
        <div className="flex items-center gap-2">
          {moduleIndex !== undefined && (
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-forest-100 text-forest-800 border border-forest-200">
              SEC {moduleIndex.toString().padStart(2, '0')}
            </span>
          )}
          <h1 className="text-xl font-bold tracking-tight text-stone-900">
            {title}
          </h1>
          {badge && (
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-stone-500 mt-1 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="mt-3 md:mt-0 flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
