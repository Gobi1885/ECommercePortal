import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { lookupToken } from '../api/client';

export default function TokenLookup() {
  const [tokenInput, setTokenInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const n = Number(tokenInput);
    if (!tokenInput || !Number.isInteger(n) || n <= 0) {
      setError('Enter a valid token number');
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await lookupToken(n);
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-card">
      <p className="mb-3 text-center text-sm font-semibold text-ink">Find your token</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="number"
          min="1"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          placeholder="e.g. 7"
          className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-center font-display text-sm text-ink focus:border-primary focus:bg-surface focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          Check
        </button>
      </form>

      {error && <p className="mt-3 text-center text-sm text-danger">{error}</p>}

      {result && (
        <div className="mt-4 rounded-lg bg-bg p-3 text-center">
          <p className="text-xs uppercase tracking-wide text-slate">
            Token #{String(result.tokenNumber).padStart(3, '0')} — {result.name}
          </p>
          {result.status === 'waiting' && (
            <p className="mt-1 text-sm text-ink">
              <span className="font-semibold">{result.tokensAhead}</span> patients ahead · est.{' '}
              <span className="font-semibold">~{result.estimatedWaitMinutes} min</span>
            </p>
          )}
          {result.status === 'in-consultation' && (
            <p className="mt-1 text-sm font-semibold text-accent-dark">You're up now!</p>
          )}
          {result.status === 'completed' && (
            <p className="mt-1 text-sm text-slate">This consultation is already complete.</p>
          )}
          {result.status === 'skipped' && (
            <p className="mt-1 text-sm text-danger">
              This token was skipped — please check with the receptionist.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
