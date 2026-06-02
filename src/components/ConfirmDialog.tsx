import { AlertTriangle, Loader2, Trash2, RotateCcw, XCircle } from 'lucide-react';

type Variant = 'danger' | 'warning';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  errorMessage?: string;
  variant?: Variant;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig: Record<Variant, {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  confirmBtn: string;
}> = {
  danger: {
    icon: <Trash2 size={20} />,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    icon: <AlertTriangle size={20} />,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
};

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  errorMessage,
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const config = variantConfig[variant];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${config.iconBg} ${config.iconColor}`}>
            {config.icon}
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${config.confirmBtn}`}
          >
            {isLoading && <Loader2 size={15} className="animate-spin" />}
            {confirmLabel}
          </button>
          {errorMessage && (
            <p className="mt-2 w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-700">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Ícone de estorno exportado separadamente para uso nas páginas
export { XCircle, RotateCcw };
