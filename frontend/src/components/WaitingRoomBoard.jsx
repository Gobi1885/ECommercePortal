import { useEffect, useRef, useState } from 'react';

export default function WaitingRoomBoard({ snapshot }) {
  const current = snapshot?.currentToken || null;
  const upNext = (snapshot?.waiting || []).slice(0, 6);
  const [flip, setFlip] = useState(false);
  const prevTokenId = useRef(null);

  useEffect(() => {
    const id = current?.id || null;
    if (id !== prevTokenId.current) {
      setFlip(true);
      const t = setTimeout(() => setFlip(false), 600);
      prevTokenId.current = id;
      return () => clearTimeout(t);
    }
  }, [current?.id]);

  return (
    <div className="space-y-6">
      <div className="ticket-hero mx-auto max-w-xl rounded-3xl border border-line p-8 text-center shadow-card sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate">
          Now serving
        </p>
        {current ? (
          <p
            className={`mt-4 font-display text-8xl font-bold leading-none text-ink sm:text-9xl ${
              flip ? 'animate-flip' : ''
            }`}
          >
            #{String(current.tokenNumber).padStart(3, '0')}
          </p>
        ) : (
          <p className="mt-4 font-display text-5xl font-bold leading-none text-slate-light sm:text-6xl">
            Please wait
          </p>
        )}
        <div className="ticket-seam mt-6 pt-4">
          <p className="text-sm text-slate">
            Average time per patient:{' '}
            <span className="font-semibold text-ink">
              ~{snapshot?.averageConsultationMinutes ?? '—'} min
            </span>
          </p>
        </div>
      </div>

      <div>
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate">
          Up next
        </p>
        {upNext.length === 0 ? (
          <p className="text-center text-sm text-slate-light">No one else waiting right now.</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
            {upNext.map((p) => (
              <div
                key={p.id}
                className="min-w-[120px] rounded-xl border border-line bg-surface px-4 py-3 text-center shadow-card"
              >
                <p className="font-display text-2xl font-bold text-ink">
                  #{String(p.tokenNumber).padStart(3, '0')}
                </p>
                <p className="mt-1 text-xs text-slate">
                  {p.tokensAhead === 0 ? 'Up next' : `${p.tokensAhead} ahead`}
                </p>
                <p className="text-xs text-slate-light">~{p.estimatedWaitMinutes} min</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
