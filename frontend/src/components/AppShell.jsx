import { useLocation } from 'react-router-dom';
import TabNav from './TabNav';

export default function AppShell({ children }) {
  const location = useLocation();
  const onWaitingRoom = location.pathname === '/waiting-room';

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-bold tracking-tight text-ink">
              Queue Cure
            </span>
            <span className="hidden text-sm text-slate sm:inline">
              Live clinic token queue
            </span>
          </div>
          <TabNav />
        </div>
      </header>

      {onWaitingRoom && (
        <div className="border-b border-line bg-primary-light/60">
          <p className="mx-auto max-w-6xl px-4 py-2 text-center text-xs text-primary-dark sm:px-6">
            Built to run full-screen on a waiting-room TV or tablet — open this tab on that
            display and it stays live on its own.
          </p>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
