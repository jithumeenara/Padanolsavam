'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, clearSession } from '@/lib/auth';
import { getSettings } from '@/lib/api';
import { useYear } from '@/hooks/useYear';
import BottomNav from '@/components/BottomNav';
import { AuthUser } from '@/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const { activeYear, setActiveYear } = useYear();
  const [appName, setAppName] = useState('Padanolsavam');

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace('/'); return; }
    setUser(session);

    getSettings().then(({ settings, years }) => {
      if (settings?.app_name) setAppName(settings.app_name);
      if (!activeYear) {
        const def = years.find(y => y.is_default === true || String(y.is_default) === 'TRUE');
        if (def) setActiveYear(def.year_name);
        else if (years.length > 0) setActiveYear(years[years.length - 1].year_name);
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    clearSession();
    router.replace('/');
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-950 to-blue-800 text-white px-4 pt-safe no-print sticky top-0 z-30">
        <div className="flex items-center justify-between h-14 max-w-lg mx-auto">
          <div>
            <h1 className="font-bold text-base leading-tight">{appName}</h1>
            <p className="text-blue-200 text-xs">Meenara Unit</p>
          </div>
          <div className="flex items-center gap-3">
            {activeYear && (
              <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                {activeYear}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-blue-200 text-xs font-medium bg-white/10 px-3 py-1.5 rounded-full active:scale-90 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20 overflow-y-auto hide-scroll">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
