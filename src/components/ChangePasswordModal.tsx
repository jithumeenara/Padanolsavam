'use client';
import { useState } from 'react';
import { changePassword } from '@/lib/api';
import { useToast } from './ToastContext';

interface Props {
  userId: string;
  onDone: () => void;
  onLater?: () => void;
  required?: boolean;
}

export default function ChangePasswordModal({ userId, onDone, onLater, required }: Props) {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
    if (pw !== confirm) { toast('Passwords do not match', 'error'); return; }
    setLoading(true);
    try {
      await changePassword(userId, pw);
      toast('Password changed successfully!', 'success');
      onDone();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 slide-up">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
        <h2 className="text-xl font-bold text-gray-800 mb-1">Change Password</h2>
        <p className="text-sm text-gray-500 mb-6">
          {required ? 'Please set a new password to continue.' : 'Update your account password.'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">New Password</label>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 text-white rounded-xl py-3.5 font-semibold text-sm disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Change Password'}
          </button>
          {onLater && !required && (
            <button type="button" onClick={onLater} className="w-full text-gray-500 text-sm py-2">
              Continue Later
            </button>
          )}
          {onLater && required && (
            <button type="button" onClick={onLater} className="w-full text-gray-500 text-sm py-2">
              Skip for Now
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
