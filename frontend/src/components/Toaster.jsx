import { X } from 'lucide-react';

const VARIANT_STYLES = {
  success:
    'border-primary/30 bg-primary text-white',
  info:
    'border-line bg-surface text-ink shadow-card',
  warning:
    'border-accent/30 bg-accent-light text-accent-dark',
};

export default function Toaster({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            VARIANT_STYLES[toast.variant] || VARIANT_STYLES.info
          }`}
          style={{ maxWidth: '320px', animation: 'slideIn 0.2s ease-out' }}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss"
            className="mt-0.5 shrink-0 opacity-60 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(24px); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}
