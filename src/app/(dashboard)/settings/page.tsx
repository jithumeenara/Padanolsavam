'use client';
import { useEffect, useState } from 'react';
import { getSettings, updateSettings, addYear, getUsers, addUser, toggleUser, changePassword } from '@/lib/api';
import { useYear } from '@/hooks/useYear';
import { getSession } from '@/lib/auth';
import { Year, User, AuthUser } from '@/types';
import { useToast } from '@/components/ToastContext';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { activeYear, setActiveYear } = useYear();
  const { toast } = useToast();

  const [session, setSession] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [years, setYears] = useState<Year[]>([]);
  const [appName, setAppName] = useState('');
  const [newYear, setNewYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ name: '', mobile: '', role: 'user' });
  const [addingUser, setAddingUser] = useState(false);

  const [pwForm, setPwForm] = useState({ newPw: '', confirm: '' });
  const [changingPw, setChangingPw] = useState(false);

  async function loadData(admin: boolean) {
    setLoading(true);
    try {
      const { settings, years: y } = await getSettings();
      setYears(y);
      setAppName(settings?.app_name || 'Padanolsavam');
      if (admin) {
        const u = await getUsers();
        setUsers(u);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Load failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const s = getSession();
    setSession(s);
    const admin = s?.role === 'admin';
    setIsAdmin(admin);
    loadData(admin);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSaveSettings() {
    setSavingSettings(true);
    try {
      await updateSettings({ app_name: appName, default_year: activeYear });
      toast('Settings saved!', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleAddYear() {
    if (!newYear.trim()) { toast('Enter year name', 'error'); return; }
    try {
      await addYear(newYear.trim());
      toast('Year added!', 'success');
      setNewYear('');
      const { years: y } = await getSettings();
      setYears(y);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  }

  async function handleAddUser() {
    if (!newUser.name || !newUser.mobile) { toast('Name and mobile required', 'error'); return; }
    setAddingUser(true);
    try {
      await addUser(newUser.name, newUser.mobile, newUser.role);
      toast('User added! Default password: password', 'success');
      setNewUser({ name: '', mobile: '', role: 'user' });
      const u = await getUsers();
      setUsers(u);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setAddingUser(false);
    }
  }

  async function handleToggleUser(id: string) {
    try {
      const { status } = await toggleUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: status as 'active' | 'inactive' } : u));
      toast(`User ${status}`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  }

  async function handleChangePassword(e: React.SyntheticEvent) {
    e.preventDefault();
    if (pwForm.newPw.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
    if (pwForm.newPw !== pwForm.confirm) { toast('Passwords do not match', 'error'); return; }
    if (!session?.id) { toast('Not logged in', 'error'); return; }
    setChangingPw(true);
    try {
      await changePassword(session.id, pwForm.newPw);
      toast('Password changed successfully!', 'success');
      setPwForm({ newPw: '', confirm: '' });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setChangingPw(false);
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="page-enter px-4 py-4 max-w-lg mx-auto space-y-5">

      {/* Year Management */}
      <Section title="Year Management">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Active Year</label>
            <select
              value={activeYear}
              onChange={e => setActiveYear(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50"
            >
              <option value="">-- Select year --</option>
              {years.map(y => (
                <option key={y.id} value={y.year_name}>{y.year_name}</option>
              ))}
            </select>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <input
                value={newYear}
                onChange={e => setNewYear(e.target.value)}
                placeholder="e.g. 2024-25"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50"
              />
              <button
                onClick={handleAddYear}
                className="bg-blue-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold"
              >
                Add Year
              </button>
            </div>
          )}
        </div>
      </Section>

      {/* App Settings — admin only */}
      {isAdmin && (
        <Section title="App Settings">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">App Name</label>
              <input
                value={appName}
                onChange={e => setAppName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50"
              />
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="w-full bg-blue-900 text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-50"
            >
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </Section>
      )}

      {/* User Management — admin only */}
      {isAdmin && (
        <Section title="User Management">
          <div className="space-y-4">
            {/* Add user form */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-600 mb-2">Add New Member</p>
              <input
                value={newUser.name}
                onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                placeholder="Full name"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
              />
              <input
                type="tel"
                maxLength={10}
                value={newUser.mobile}
                onChange={e => setNewUser(p => ({ ...p, mobile: e.target.value }))}
                placeholder="Mobile number"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
              />
              <select
                value={newUser.role}
                onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
              >
                <option value="user">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={handleAddUser}
                disabled={addingUser}
                className="w-full bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {addingUser ? 'Adding...' : 'Add Member (Default password: password)'}
              </button>
            </div>

            {/* Users list */}
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.mobile} &middot; {u.role}</p>
                  </div>
                  <button
                    onClick={() => handleToggleUser(u.id)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                      u.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {u.status}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Change Password */}
      <Section title="Change Password">
        <form onSubmit={handleChangePassword} className="space-y-3">
          <input
            type="password"
            value={pwForm.newPw}
            onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
            placeholder="New password (min 6 chars)"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50"
            required
          />
          <input
            type="password"
            value={pwForm.confirm}
            onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
            placeholder="Confirm new password"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50"
            required
          />
          <button
            type="submit"
            disabled={changingPw}
            className="w-full bg-blue-900 text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-50"
          >
            {changingPw ? 'Saving...' : 'Change Password'}
          </button>
        </form>
      </Section>

      {/* About */}
      <div className="text-center text-xs text-gray-400 py-2">
        <p className="font-semibold text-gray-600">DYFI Padanolsavam</p>
        <p>Meenara Unit &bull; v1.0.0</p>
      </div>
    </div>
  );
}
