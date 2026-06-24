import { useState } from 'react';
import { Settings2, Loader2 } from 'lucide-react';
import { setAverageMinutes } from '../api/client';

export default function SettingsCard({ snapshot }) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const minutes = Number(value);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      setError('Enter a number of minutes greater than 0');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await setAverageMinutes(minutes);
      setSaved(true);
      setValue('');
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const liveAvg = snapshot?.averageConsultationMinutes;
  const usingLiveData = snapshot?.averageSource === 'live-data';

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <Settings2 size={16} className="text-slate" />
        <h2 className="text-sm font-semibold text-ink">Average consultation time</h2>
      </div>

      <div className="mb-4 rounded-lg bg-bg p-3">
        <p className="text-2xl font-display font-bold text-ink">
          {liveAvg ?? '—'} <span className="text-sm font-body font-normal text-slate">min</span>
        </p>
        <p className="mt-0.5 text-xs text-slate">
          {usingLiveData
            ? `Calculated from the last ${snapshot.sampleSize} real consultations — updates as the day goes on.`
            : 'No consultations completed yet today — using your manual default below.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor="avg-minutes" className="mb-1 block text-xs font-medium text-slate">
            Manual default (used until real data exists)
          </label>
          <input
            id="avg-minutes"
            type="number"
            min="1"
            max="180"
            step="0.5"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            placeholder={String(snapshot?.manualAverageMinutes ?? 5)}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-primary focus:bg-surface focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-1.5 rounded-lg border border-line bg-bg px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-line disabled:cursor-not-allowed"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          Set
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      {saved && <p className="mt-2 text-xs text-primary-dark">Saved.</p>}
    </div>
  );
}
