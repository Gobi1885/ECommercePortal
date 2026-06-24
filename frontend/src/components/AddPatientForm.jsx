import { useRef, useState } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import { addPatient } from '../api/client';

export default function AddPatientForm({ onAdded }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [lastAddedToken, setLastAddedToken] = useState(null);
  const nameInputRef = useRef(null);

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const { patient } = await addPatient(trimmedName, phone.trim());
      setLastAddedToken(patient.tokenNumber);
      setName('');
      setPhone('');
      onAdded?.(patient);
      // Hands the receptionist straight back to typing the next name —
      // no mouse trip required between patients.
      nameInputRef.current?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="patient-name" className="mb-1 block text-sm font-medium text-ink">
          Patient name
        </label>
        <input
          id="patient-name"
          ref={nameInputRef}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          placeholder="e.g. Ananya Rao"
          autoComplete="off"
          maxLength={80}
          className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-slate-light focus:border-primary focus:bg-surface focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="patient-phone" className="mb-1 block text-sm font-medium text-ink">
          Phone <span className="text-slate-light">(optional)</span>
        </label>
        <input
          id="patient-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="For SMS-when-near-turn (future)"
          autoComplete="off"
          className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-slate-light focus:border-primary focus:bg-surface focus:outline-none"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-line disabled:text-slate-light"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
        {submitting ? 'Adding…' : 'Add to queue'}
      </button>

      {lastAddedToken && !submitting && (
        <p className="text-center text-xs text-primary-dark">
          Added — token <span className="font-display font-bold">#{String(lastAddedToken).padStart(3, '0')}</span>
        </p>
      )}
    </form>
  );
}
