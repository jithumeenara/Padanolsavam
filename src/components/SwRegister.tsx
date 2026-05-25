'use client';
import { useEffect } from 'react';

export default function SwRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Sync offline students queued while offline
    function syncOfflineStudents() {
      const queue = JSON.parse(localStorage.getItem('dyfi_offline_students') || '[]');
      if (!queue.length) return;
      queue.forEach((item: Record<string, unknown>) => {
        fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
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
