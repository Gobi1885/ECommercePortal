import { TrendingUp, Clock, Users, BarChart2 } from 'lucide-react';

function StatItem({ icon: Icon, label, value, sub, highlight }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-0.5 rounded-lg p-1.5 ${highlight ? 'bg-primary-light text-primary' : 'bg-bg text-slate'}`}>
        <Icon size={14} strokeWidth={2.25} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-slate">{label}</p>
        <p className={`text-lg font-display font-bold leading-tight ${highlight ? 'text-primary-dark' : 'text-ink'}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-slate-light">{sub}</p>}
      </div>
    </div>
  );
}

export default function StatsPanel({ snapshot }) {
  const served = snapshot?.totalServedToday ?? 0;
  const waiting = snapshot?.queueLength ?? 0;
  const avg = snapshot?.averageConsultationMinutes ?? '—';
  const source = snapshot?.averageSource;
  const sampleSize = snapshot?.sampleSize ?? 0;

  // Estimate total throughput time (served + still waiting, all at avg)
  const totalHandled = served + waiting;
  const runtime = sampleSize > 0 && avg !== '—'
    ? Math.round(served * avg)
    : null;

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <BarChart2 size={15} className="text-slate" />
        <h2 className="text-sm font-semibold text-ink">Today's stats</h2>
      </div>

      <div className="space-y-4">
        <StatItem
          icon={Users}
          label="Served today"
          value={served}
          sub={totalHandled > 0 ? `${waiting} still waiting` : 'Queue empty'}
          highlight={served > 0}
        />
        <StatItem
          icon={Clock}
          label="Avg. consult time"
          value={avg !== '—' ? `${avg} min` : '—'}
          sub={
            source === 'live-data'
              ? `From ${sampleSize} real consultation${sampleSize !== 1 ? 's' : ''}`
              : 'Manual default (no real data yet)'
          }
        />
        <StatItem
          icon={TrendingUp}
          label="Min in consultation"
          value={runtime !== null ? `${runtime} min` : '—'}
          sub="Total doctor time today"
        />
      </div>

      {snapshot && (
        <p className="mt-4 text-right text-xs text-slate-light">
          Updated{' '}
          {new Date(snapshot.updatedAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </p>
      )}
    </div>
  );
}
