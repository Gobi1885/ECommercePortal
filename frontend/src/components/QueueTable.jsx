import { useState } from 'react';
import { X, Users } from 'lucide-react';
import { skipPatient } from '../api/client';

function formatAddedAt(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function QueueTable({ snapshot }) {
  const [skippingId, setSkippingId] = useState(null);
  const [error, setError] = useState(null);
  const waiting = snapshot?.waiting || [];

  async function handleSkip(id) {
    setSkippingId(id);
    setError(null);
    try {
      await skipPatient(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSkippingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-slate" />
          <h2 className="text-sm font-semibold text-ink">Waiting queue</h2>
        </div>
        <span className="rounded-full bg-bg px-2.5 py-0.5 text-xs font-medium text-slate">
          {waiting.length} {waiting.length === 1 ? 'patient' : 'patients'}
        </span>
      </div>

      {error && (
        <p className="mx-5 mt-3 rounded-lg bg-danger-light px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {waiting.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-slate">No one's waiting right now.</p>
          <p className="mt-1 text-xs text-slate-light">
            New patients you add will line up here in token order.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-light">
                <th className="px-5 py-2 font-medium">Token</th>
                <th className="px-5 py-2 font-medium">Name</th>
                <th className="px-5 py-2 font-medium">Added</th>
                <th className="px-5 py-2 font-medium">Ahead</th>
                <th className="px-5 py-2 font-medium">Est. wait</th>
                <th className="px-5 py-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {waiting.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-5 py-3">
                    <span className="token-chip">#{String(p.tokenNumber).padStart(3, '0')}</span>
                  </td>
                  <td className="px-5 py-3 text-ink">{p.name}</td>
                  <td className="px-5 py-3 text-slate">{formatAddedAt(p.addedAt)}</td>
                  <td className="px-5 py-3 text-slate">{p.tokensAhead}</td>
                  <td className="px-5 py-3 text-slate">{p.estimatedWaitMinutes} min</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleSkip(p.id)}
                      disabled={skippingId === p.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-slate transition-colors hover:border-danger/40 hover:bg-danger-light hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
                      title="Mark as no-show / remove from queue"
                    >
                      <X size={12} />
                      Skip
                    </button>
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
