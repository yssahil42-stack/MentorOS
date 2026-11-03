import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import type { Toast, ToastType } from '../../contexts/WorkspaceContext';

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-green-400" aria-hidden="true" />,
  error: <XCircle className="h-4 w-4 text-red-400" aria-hidden="true" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-400" aria-hidden="true" />,
  info: <Info className="h-4 w-4 text-developer-400" aria-hidden="true" />,
};

const barStyles: Record<ToastType, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-developer-500',
};

function ToastItem({ toast }: { toast: Toast }) {
  const { dismissToast } = useWorkspace();

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 px-4 py-3.5 pr-10',
        'bg-bg-elevated border border-border-subtle rounded-xl shadow-glass',
        'animate-slide-in-right overflow-hidden min-w-[280px] max-w-sm'
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Type accent bar */}
      <div
        className={cn('absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full', barStyles[toast.type])}
        aria-hidden="true"
      />

      {/* Icon */}
      <div className="shrink-0 mt-0.5">{iconMap[toast.type]}</div>

      {/* Message */}
      <p className="text-sm text-text-primary leading-snug">{toast.message}</p>

      {/* Action Button */}
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            dismissToast(toast.id);
          }}
          className="ml-auto text-xs font-semibold text-blue-400 hover:text-blue-300 underline cursor-pointer focus-visible:outline-none shrink-0"
        >
          {toast.action.label}
        </button>
      )}

      {/* Dismiss */}
      <button
        onClick={() => dismissToast(toast.id)}
        className="absolute right-2 top-2 p-1 rounded text-text-muted hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useWorkspace();

  if (!toasts.length) return null;

  return createPortal(
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>,
    document.body
  );
}
