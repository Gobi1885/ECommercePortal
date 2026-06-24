import { useEffect, useState } from 'react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { useToast } from '../hooks/useToast';
import ConnectionBadge from '../components/ConnectionBadge';
import WaitingRoomBoard from '../components/WaitingRoomBoard';
import TokenLookup from '../components/TokenLookup';
import Toaster from '../components/Toaster';

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** Colour the waiting room background a gentle success tint briefly
 *  whenever a new token is called — visible cue even from across the room. */
function useCalledFlash(lastEvent) {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (lastEvent?.type === 'token:called') {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 900);
      return () => clearTimeout(t);
    }
  }, [lastEvent]);
  return flash;
}

export default function WaitingRoomPage() {
  const { snapshot, connected, error, lastEvent } = useQueueSocket();
  const { toasts, dismiss } = useToast(lastEvent);
  const now = useClock();
  const flash = useCalledFlash(lastEvent);

  return (
    <div
      className="space-y-8 rounded-2xl transition-colors duration-700"
      style={flash ? { backgroundColor: 'rgba(14,124,102,0.06)' } : {}}
    >
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Screen 2</p>
          <h1 className="font-display text-2xl font-bold text-ink">Waiting room</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-display text-sm tabular-nums text-slate">
            {now.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
          <ConnectionBadge connected={connected} />
        </div>
      </div>

      {/* Connectivity / server error */}
      {error && (
        <p className="rounded-lg bg-danger-light px-4 py-3 text-sm text-danger" role="alert">
          Couldn't reach the server: {error}. Check that the backend is running.
        </p>
      )}

      {/* Main display: big token number + up-next strip */}
      <WaitingRoomBoard snapshot={snapshot} />

      {/* Divider */}
      <div className="ticket-seam" />

      {/* Patient self-service: find my token */}
      <div>
        <p className="mb-1 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate">
          Check your position
        </p>
        <p className="mb-4 text-center text-xs text-slate-light">
          Enter your token number to see how many people are ahead of you.
        </p>
        <TokenLookup />
      </div>

      {/* Live-event toasts (same system as receptionist screen) */}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
