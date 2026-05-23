'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/dashboard', label: 'Home', icon: HomeIcon },
  { href: '/students', label: 'Students', icon: StudentsIcon },
  { href: '/finance', label: 'Finance', icon: FinanceIcon },
  { href: '/reports', label: 'Reports', icon: ReportsIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 ${active ? 'fill-red-800' : 'fill-gray-400'}`}>
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  );
}
function StudentsIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 ${active ? 'fill-red-800' : 'fill-gray-400'}`}>
      <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 12.4L5.47 11.6 4 12.44V17l8 4 8-4v-4.56l-1.47-.84L12 15.4z" />
    </svg>
  );
}
function FinanceIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 ${active ? 'fill-red-800' : 'fill-gray-400'}`}>
      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
    </svg>
  );
}
function ReportsIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 ${active ? 'fill-red-800' : 'fill-gray-400'}`}>
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z" />
    </svg>
  );
}
function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 ${active ? 'fill-red-800' : 'fill-gray-400'}`}>
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.04 7.04 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87a.47.47 0 0 0 .12.61l2.03 1.58c-.05.3-.07.63-.07.94s.02.64.07.94l-2.03 1.58a.47.47 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.37 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-red-100 shadow-lg z-40 pb-safe no-print">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 active:scale-90 transition-transform"
            >
              <Icon active={active} />
              <span className={`text-[9px] font-semibold ${active ? 'text-red-800' : 'text-gray-400'}`}>
                {label}
              </span>
              {active && <span className="w-1 h-1 rounded-full bg-red-700 mt-0.5" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
