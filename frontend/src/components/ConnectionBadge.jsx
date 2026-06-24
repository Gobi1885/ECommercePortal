import { WifiOff } from 'lucide-react';

export default function ConnectionBadge({ connected }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
        connected
          ? 'border-primary/30 bg-primary-light text-primary-dark'
          : 'border-danger/30 bg-danger-light text-danger'
      }`}
      title={connected ? 'Connected — updates arrive live, no refresh needed' : 'Reconnecting…'}
    >
      {connected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulseDot rounded-full bg-primary" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Live
        </>
      ) : (
        <>
          <WifiOff size={13} strokeWidth={2.5} />
          Reconnecting…
        </>
      )}
    </span>
  );
}
