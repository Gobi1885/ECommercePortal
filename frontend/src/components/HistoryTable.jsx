import { useEffect, useState, useCallback } from 'react';
import { History, RefreshCw } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { api } from '../api/client';
import { socket } from '../api/socket';

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function durationLabel(calledAt, completedAt) {
  if (!calledAt || !completedAt) return '—';
  const ms = new Date(completedAt) - new Date(calledAt);
  if (ms < 0) return '—';
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
}

export default function HistoryTable() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients/history');
      setPatients(res.data?.patients ?? []);
    } catch {
      // silently keep whatever we had
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Refresh history whenever a consultation completes or a patient is skipped
    const refresh = () => load();
    socket.on('token:called', refresh);
    socket.on('patient:skipped', refresh);
    socket.on('queue:reset', refresh);
    return () => {
      socket.off('token:called', refresh);
      socket.off('patient:skipped', refresh);
      socket.off('queue:reset', refresh);
    };
  }, [load]);

  const done = patients.filter(
    (p) => p.status === 'completed' || p.status === 'skipped'
  );

  return (
    <div className="rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div className="flex items-center gap-2">
          <History size={15} className="text-slate" />
          <h2 className="text-sm font-semibold text-ink">Today's history</h2>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-slate transition-colors hover:bg-bg disabled:opacity-50"
          title="Refresh history"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {done.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-slate">
            {loading ? 'Loading…' : 'No consultations completed yet today.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-light">
                <th className="px-5 py-2 font-medium">Token</th>
                <th className="px-5 py-2 font-medium">Name</th>
                <th className="px-5 py-2 font-medium">Status</th>
                <th className="px-5 py-2 font-medium">Called</th>
                <th className="px-5 py-2 font-medium">Done</th>
                <th className="px-5 py-2 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody>
              {done.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-5 py-3">
                    <span className="token-chip">
                      #{String(p.tokenNumber).padStart(3, '0')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-ink">{p.name}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-5 py-3 text-slate">{formatTime(p.calledAt)}</td>
                  <td className="px-5 py-3 text-slate">{formatTime(p.completedAt)}</td>
                  <td className="px-5 py-3 text-slate">
                    {durationLabel(p.calledAt, p.completedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
