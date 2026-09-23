import React from 'react';
import { AlertCircle, X, Check } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  message?: string;
  actionLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  isDestructive?: boolean;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  description,
  message,
  actionLabel,
  confirmText,
  cancelLabel,
  cancelText,
  isDestructive,
  variant,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const bodyText = description || message || '';
  const confirmBtnText = confirmText || actionLabel || "CONFIRM OPERATION";
  const cancelBtnText = cancelText || cancelLabel || "CANCEL";
  const isDanger = isDestructive || variant === 'danger';
  const isWarning = variant === 'warning';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white border border-stone-300 rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
        <div className="flex items-start gap-3">
          <div className={`h-9 w-9 rounded-md flex items-center justify-center shrink-0 ${
            isDanger ? 'bg-rose-100 text-rose-700' : isWarning ? 'bg-amber-100 text-amber-800' : 'bg-forest-100 text-forest-700'
          }`}>
            <AlertCircle className="h-5 w-5" />
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-sm text-stone-900 font-mono uppercase tracking-wide">
              {title}
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {bodyText}
            </p>
          </div>
        </div>

        <div className="p-3 bg-stone-50 border border-stone-200 rounded text-[11px] font-mono text-stone-600">
          Safety Interlock: Manual operator confirmation is mandatory before physical or simulated actuator relays engage.
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-mono transition-colors"
          >
            {cancelBtnText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-1.5 rounded text-white text-xs font-mono font-medium transition-colors shadow-sm ${
              isDanger
                ? 'bg-rose-700 hover:bg-rose-800'
                : isWarning
                ? 'bg-amber-700 hover:bg-amber-800'
                : 'bg-forest-700 hover:bg-forest-800'
            }`}
          >
            {confirmBtnText}
          </button>
        </div>
      </div>
    </div>
  );
};
