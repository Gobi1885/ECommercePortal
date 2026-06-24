import { useEffect, useRef, useState } from 'react';
import { PlayCircle, Loader2 } from 'lucide-react';
import { callNext } from '../api/client';

export default function NowServingCard({ snapshot }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [flip, setFlip] = useState(false);
  const prevTokenId = useRef(null);

  const current = snapshot?.currentToken || null;
  const queueLength = snapshot?.queueLength ?? 0;
  const hasNothingToDo = !current && queueLength === 0;

  useEffect(() => {
    const id = current?.id || null;
    if (id !== prevTokenId.current) {
      setFlip(true);
      const t = setTimeout(() => setFlip(false), 500);
      prevTokenId.current = id;
      return () => clearTimeout(t);
    }
  }, [current?.id]);

  async function handleCallNext() {
    if (submitting || hasNothingToDo) return;
    setSubmitting(true);
    setError(null);
    try {
      await callNext();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ticket-hero rounded-2xl border border-line p-6 shadow-card sm:p-8">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <div className="text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate">
            Now serving
          </p>
          {current ? (
            <>
              <p
                className={`mt-1 font-display text-6xl font-bold text-ink sm:text-7xl ${
                  flip ? 'animate-flip' : ''
                }`}
              >
                #{String(current.tokenNumber).padStart(3, '0')}
              </p>
              <p className="mt-1 text-base text-slate">{current.name}</p>
            </>
          ) : (
            <p className="mt-1 font-display text-4xl font-bold text-slate-light sm:text-5xl">
              — none —
            </p>
          )}
        </div>

        <div className="ticket-seam w-full pt-6 text-center sm:w-auto sm:border-t-0 sm:pl-8 sm:pt-0">
          <button
            onClick={handleCallNext}
            disabled={submitting || hasNothingToDo}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 text-base font-semibold text-ink transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:bg-line disabled:text-slate-light sm:w-auto sm:px-8"
          >
            {submitting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <PlayCircle size={20} />
            )}
            Call next
          </button>
          <p className="mt-2 text-xs text-slate">
            {hasNothingToDo
              ? 'Queue is empty'
              : `${queueLength} waiting`}
          </p>
        </div>
      </div>
      {error && (
        <p className="mt-4 rounded-lg bg-danger-light px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
