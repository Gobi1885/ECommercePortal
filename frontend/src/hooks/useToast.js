import { useCallback, useEffect, useRef, useState } from 'react';

let _id = 0;

/**
 * useToast wires up to socket `lastEvent` (from useQueueSocket) and turns
 * each mutation event into a transient notification. Toasts expire after
 * `durationMs` and are removed from the list automatically.
 *
 * Usage:
 *   const { toasts, dismiss } = useToast(lastEvent);
 *   // then render <Toaster toasts={toasts} onDismiss={dismiss} />
 */
export function useToast(lastEvent, { durationMs = 3500 } = {}) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!lastEvent) return;

    const { type, payload } = lastEvent;
    let message = null;
    let variant = 'info'; // 'info' | 'success' | 'warning'

    if (type === 'patient:added') {
      const name = payload?.patient?.name || 'Patient';
      const token = payload?.patient?.tokenNumber;
      message = `${name} added — token #${String(token).padStart(3, '0')}`;
      variant = 'info';
    } else if (type === 'token:called') {
      const called = payload?.calledPatient;
      if (called) {
        message = `Now serving #${String(called.tokenNumber).padStart(3, '0')} — ${called.name}`;
        variant = 'success';
      }
    } else if (type === 'patient:skipped') {
      const p = payload?.patient;
      if (p) {
        message = `#${String(p.tokenNumber).padStart(3, '0')} ${p.name} marked as no-show`;
        variant = 'warning';
      }
    } else if (type === 'queue:reset') {
      message = 'Queue has been reset';
      variant = 'warning';
    }

    if (!message) return;

    const id = ++_id;
    setToasts((prev) => [{ id, message, variant }, ...prev].slice(0, 5));

    timers.current[id] = setTimeout(() => dismiss(id), durationMs);
  }, [lastEvent, durationMs, dismiss]);

  // Clean up all timers on unmount
  useEffect(() => {
    const t = timers.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, []);

  return { toasts, dismiss };
}
