'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/dashboard', icon: '🏠', label: 'Home' },
  { href: '/students', icon: '🎓', label: 'Students' },
  { href: '/finance', icon: '💰', label: 'Finance' },
  { href: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-40 pb-safe no-print">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV.map(({ href, icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-2xl transition-all active:scale-90 ${
                active ? 'text-blue-900' : 'text-gray-400'
              }`}
            >
              <span className="text-xl leading-none">{icon}</span>
              <span className={`text-[10px] font-semibold ${active ? 'text-blue-900' : 'text-gray-400'}`}>
                {label}
              </span>
              {active && (
                <span className="w-1 h-1 rounded-full bg-blue-900 mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
