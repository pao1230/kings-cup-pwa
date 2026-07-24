import { NavLink, Outlet } from 'react-router-dom';
import { useT } from '../i18n/useT';
import PwaPrompts from './PwaPrompts';

const TABS = [
  { to: '/', key: 'nav_play', icon: '🎴', end: true },
  { to: '/rules', key: 'nav_rules', icon: '📜', end: false },
  { to: '/rulesets', key: 'nav_rulesets', icon: '🗂️', end: false },
  { to: '/settings', key: 'nav_settings', icon: '⚙️', end: false },
] as const;

export default function Layout() {
  const t = useT();
  return (
    <div className="mx-auto flex h-full max-w-md flex-col">
      <main className="safe-top flex-1 overflow-y-auto px-4 pb-24 pt-4">
        <Outlet />
      </main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-border bg-surface/95 backdrop-blur">
        <ul className="flex">
          {TABS.map((tab) => (
            <li key={tab.to} className="flex-1">
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `tap flex flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition ${
                    isActive ? 'text-brand' : 'text-muted'
                  }`
                }
              >
                <span className="text-xl leading-none" aria-hidden>
                  {tab.icon}
                </span>
                <span>{t(tab.key)}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <PwaPrompts />
    </div>
  );
}
