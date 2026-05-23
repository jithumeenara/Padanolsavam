'use client';
import { useEffect } from 'react';

export default function SwRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Sync offline students when back online
    function syncOfflineStudents() {
      const queue = JSON.parse(localStorage.getItem('dyfi_offline_students') || '[]');
      if (!queue.length) return;
      const url = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;
      if (!url) return;
      queue.forEach((item: Record<string, unknown>) => {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'addStudent', ...item }),
        }).then(r => r.json()).then(res => {
          if (res.success) {
            const q = JSON.parse(localStorage.getItem('dyfi_offline_students') || '[]');
            const filtered = q.filter((x: Record<string, unknown>) => x._ts !== item._ts);
            localStorage.setItem('dyfi_offline_students', JSON.stringify(filtered));
          }
        }).catch(() => {});
      });
    }

    window.addEventListener('online', syncOfflineStudents);
    if (navigator.onLine) syncOfflineStudents();
    return () => window.removeEventListener('online', syncOfflineStudents);
  }, []);

  return null;
}
