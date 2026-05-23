'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';
import { setSession } from '@/lib/auth';
import { AuthUser } from '@/types';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { useToast } from '@/components/ToastContext';
import DyfiLogo from '@/components/DyfiLogo';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);
  const [showPwChange, setShowPwChange] = useState(false);

  async function handleLogin(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!mobile || !password) { toast('Enter mobile and password', 'error'); return; }
    setLoading(true);
    try {
      const user = await login(mobile.trim(), password.trim());
      const authUser: AuthUser = {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        role: user.role as 'admin' | 'user',
        first_login: user.first_login,
      };
      setSession(authUser);
      if (user.first_login) {
        setPendingUser(authUser);
        setShowPwChange(true);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-950 via-red-900 to-red-800 px-4">
      <div className="mb-8 text-center">
        <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20">
          <DyfiLogo size={52} />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Padanolsavam</h1>
        <p className="text-red-200 text-sm mt-1">DYFI Meenara Unit</p>
      </div>

      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Welcome back</h2>
        <p className="text-sm text-gray-500 mb-6">Sign in to your account</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Mobile Number</label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              placeholder="10-digit mobile number"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white placeholder:text-gray-400"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white placeholder:text-gray-400"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-700 hover:bg-red-800 active:scale-95 text-white rounded-xl py-3.5 font-semibold text-sm transition-all disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-6">DYFI Padanolsavam &copy; 2024</p>
      </div>

      {showPwChange && pendingUser && (
        <ChangePasswordModal
          userId={pendingUser.id}
          onDone={() => { setShowPwChange(false); router.push('/dashboard'); }}
          onLater={() => { setShowPwChange(false); router.push('/dashboard'); }}
          required
        />
      )}
    </div>
  );
}
