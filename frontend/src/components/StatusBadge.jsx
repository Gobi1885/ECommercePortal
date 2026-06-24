const STYLES = {
  waiting: 'bg-bg text-slate border border-line',
  'in-consultation': 'bg-accent-light text-accent-dark border border-accent/30',
  completed: 'bg-primary-light text-primary-dark border border-primary/20',
  skipped: 'bg-danger-light text-danger border border-danger/20',
};

const LABELS = {
  waiting: 'Waiting',
  'in-consultation': 'In consultation',
  completed: 'Completed',
  skipped: 'Skipped',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STYLES[status] || STYLES.waiting
      }`}
    >
      {LABELS[status] || status}
    </span>
  );
}
