import { useRef, useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { resetQueue } from '../api/client';

export default function ResetConfirmDialog({ onClose }) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const confirmed = value.trim().toUpperCase() === 'RESET';

  async function handleReset() {
    if (!confirmed) return;
    setSubmitting(true);
    setError(null);
    try {
      await resetQueue();
      onClose();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate hover:bg-bg"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Icon + heading */}
        <div className="mb-4 flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-light text-danger">
            <AlertTriangle size={22} />
          </span>
          <h2 className="text-base font-semibold text-ink">Reset the queue?</h2>
          <p className="text-sm text-slate">
            This removes <strong>all patients</strong> from today's queue and
            clears the running average. There's no undo.
          </p>
        </div>

        {/* Confirmation text entry */}
        <label className="mb-1 block text-xs font-medium text-slate">
          Type <span className="font-display font-bold text-ink">RESET</span> to confirm
        </label>
        <input
          ref={inputRef}
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="RESET"
          className="mb-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-center font-display font-bold tracking-widest text-ink focus:border-danger focus:outline-none"
          onKeyDown={(e) => { if (e.key === 'Enter' && confirmed) handleReset(); }}
        />

        {error && (
          <p className="mb-3 rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-line px-4 py-2 text-sm font-medium text-slate hover:bg-bg"
          >
            Cancel
          </button>
          <button
            onClick={handleReset}
            disabled={!confirmed || submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-danger/90 disabled:cursor-not-allowed disabled:bg-line disabled:text-slate-light"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Reset queue
          </button>
        </div>
      </div>
    </div>
  );
}
