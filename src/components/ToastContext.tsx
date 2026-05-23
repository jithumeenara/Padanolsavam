'use client';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Toast { id: number; message: string; type: 'success' | 'error' | 'info'; }

const ToastCtx = createContext<{ toast: (msg: string, type?: Toast['type']) => void }>({
  toast: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  const bg = (type: Toast['type']) =>
    type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-gray-800';

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`${bg(t.type)} text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium toast-in`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
