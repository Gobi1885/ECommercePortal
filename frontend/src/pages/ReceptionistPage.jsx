import { useState } from 'react';
import { List, History, RotateCcw } from 'lucide-react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { useToast } from '../hooks/useToast';
import ConnectionBadge from '../components/ConnectionBadge';
import AddPatientForm from '../components/AddPatientForm';
import SettingsCard from '../components/SettingsCard';
import StatsPanel from '../components/StatsPanel';
import NowServingCard from '../components/NowServingCard';
import QueueTable from '../components/QueueTable';
import HistoryTable from '../components/HistoryTable';
import ResetConfirmDialog from '../components/ResetConfirmDialog';
import Toaster from '../components/Toaster';

const INNER_TABS = [
  { id: 'queue', label: 'Active queue', icon: List },
  { id: 'history', label: "Today's history", icon: History },
];

export default function ReceptionistPage() {
  const { snapshot, connected, error, lastEvent } = useQueueSocket();
  const { toasts, dismiss } = useToast(lastEvent);
  const [innerTab, setInnerTab] = useState('queue');
  const [showReset, setShowReset] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Screen 1</p>
          <h1 className="font-display text-2xl font-bold text-ink">Receptionist desk</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-sm text-slate">
            Served today:{' '}
            <span className="font-semibold text-ink">{snapshot?.totalServedToday ?? 0}</span>
          </span>
          <button
            onClick={() => setShowReset(true)}
            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-slate transition-colors hover:border-danger/40 hover:bg-danger-light hover:text-danger"
          >
            <RotateCcw size={12} />
            Reset queue
          </button>
          <ConnectionBadge connected={connected} />
        </div>
      </div>

      {/* Connection/server error banner */}
      {error && (
        <p className="rounded-lg bg-danger-light px-4 py-3 text-sm text-danger" role="alert">
          Couldn't reach the server: {error}. Check that the backend is running on port 4000.
        </p>
      )}

      {/* Two-column layout: sidebar + main */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">

        {/* ─── Sidebar ─── */}
        <div className="space-y-6">
          {/* Add patient card */}
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="mb-3 text-sm font-semibold text-ink">Add patient</h2>
            <AddPatientForm />
          </div>

          {/* Settings: average consultation time */}
          <SettingsCard snapshot={snapshot} />

          {/* Stats panel */}
          <StatsPanel snapshot={snapshot} />
        </div>

        {/* ─── Main panel ─── */}
        <div className="space-y-5">
          {/* Now serving + call next */}
          <NowServingCard snapshot={snapshot} />

          {/* Inner tab bar: Active queue | History */}
          <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
            {INNER_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setInnerTab(id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  innerTab === id
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate hover:bg-bg hover:text-ink'
                }`}
              >
                <Icon size={14} strokeWidth={2.25} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {innerTab === 'queue' && <QueueTable snapshot={snapshot} />}
          {innerTab === 'history' && <HistoryTable />}
        </div>
      </div>

      {/* Reset confirmation modal */}
      {showReset && <ResetConfirmDialog onClose={() => setShowReset(false)} />}

      {/* Live-event toast notifications */}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
