import { NavLink } from 'react-router-dom';
import { Armchair, ClipboardList } from 'lucide-react';

const tabs = [
  { to: '/receptionist', label: 'Receptionist', icon: ClipboardList },
  { to: '/waiting-room', label: 'Waiting Room', icon: Armchair },
];

export default function TabNav() {
  return (
    <nav className="flex gap-1 rounded-xl border border-line bg-surface p-1 shadow-card" role="tablist" aria-label="Screens">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          role="tab"
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate hover:bg-bg hover:text-ink'
            }`
          }
        >
          <Icon size={16} strokeWidth={2.25} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
