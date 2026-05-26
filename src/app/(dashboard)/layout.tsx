'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, clearSession } from '@/lib/auth';
import { getSettings } from '@/lib/api';
import { clearCache } from '@/lib/cache';
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
        const def = years.find(y => y.is_default === true || String(y.is_default).toUpperCase() === 'TRUE');
        if (def) setActiveYear(def.year_name);
        else if (years.length > 0) setActiveYear(years[years.length - 1].year_name);
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    clearSession();
    clearCache();
    router.replace('/');
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-red-50">
      <header className="bg-gradient-to-r from-red-900 to-red-700 text-white px-4 pt-safe no-print sticky top-0 z-30">
        <div className="flex items-center justify-between h-14 max-w-lg mx-auto">
          <div>
            <h1 className="font-bold text-base leading-tight">{appName}</h1>
            <p className="text-red-200 text-xs">Meenara Unit</p>
          </div>
          <div className="flex items-center gap-2">
            {activeYear && (
              <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                {activeYear}
              </span>
            )}
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-full">
              <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {user?.name?.[0]?.toUpperCase()}
              </span>
              <span className="text-white text-xs font-medium max-w-[70px] truncate">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-red-100 text-xs font-medium bg-white/10 px-3 py-1.5 rounded-full active:scale-90 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 overflow-y-auto hide-scroll">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
