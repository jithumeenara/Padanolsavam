'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getFinance, deleteFinance } from '@/lib/api';
import { useYear } from '@/hooks/useYear';
import { getSession } from '@/lib/auth';
import { formatCurrency, formatDate, downloadCSV } from '@/lib/utils';
import { Income, Expense } from '@/types';
import { useToast } from '@/components/ToastContext';
import ConfirmDialog from '@/components/ConfirmDialog';

type Tab = 'income' | 'expenses';
type AnyEntry = (Income | Expense) & { _type: Tab };

export default function FinancePage() {
  const { activeYear } = useYear();
  const { toast } = useToast();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('income');
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<AnyEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = getSession()?.role === 'admin';

  async function load() {
    if (!activeYear) { setLoading(false); return; }
    setLoading(true);
    try {
      const [inc, exp] = await Promise.all([
        getFinance('income', activeYear),
        getFinance('expenses', activeYear),
      ]);
      setIncome(inc as Income[]);
      setExpenses(exp as Expense[]);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [activeYear]);

  const totalIncome = income.reduce((s, r) => s + Number(r.amount || 0), 0);
  const totalExpense = expenses.reduce((s, r) => s + Number(r.amount || 0), 0);
  const balance = totalIncome - totalExpense;
  const list: AnyEntry[] = (tab === 'income' ? income : expenses).map(i => ({ ...i, _type: tab }));

  function handleExport() {
    downloadCSV(list as unknown as Record<string, unknown>[], `${tab}_${activeYear}.csv`);
    toast('Exported!', 'success');
  }

  async function handleDelete() {
    if (!confirm) return;
    setDeleting(true);
    try {
      await deleteFinance(confirm._type, confirm.id);
      if (confirm._type === 'income') setIncome(prev => prev.filter(i => i.id !== confirm.id));
      else setExpenses(prev => prev.filter(e => e.id !== confirm.id));
      toast('Deleted', 'success');
      setConfirm(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const categoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      'Membership Fee': 'bg-red-100 text-red-700',
      'Donation': 'bg-green-100 text-green-700',
      'Event Income': 'bg-orange-100 text-orange-700',
      'Event Expense': 'bg-red-100 text-red-700',
      'Travel': 'bg-yellow-100 text-yellow-700',
      'Food': 'bg-amber-100 text-amber-700',
    };
    return colors[cat] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="page-enter">
      <ConfirmDialog
        open={!!confirm}
        title="Delete Entry"
        message={confirm ? `Delete "${confirm.title}" (${formatCurrency(Number(confirm.amount))})?` : ''}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />

      {/* Summary */}
      <div className="bg-gradient-to-r from-red-950 to-red-800 px-4 py-4">
        <div className="flex justify-around text-center">
          <div>
            <p className="text-green-300 text-xs font-medium">Income</p>
            <p className="text-white font-bold text-base">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="w-px bg-white/20" />
          <div>
            <p className="text-red-300 text-xs font-medium">Expense</p>
            <p className="text-white font-bold text-base">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="w-px bg-white/20" />
          <div>
            <p className="text-red-200 text-xs font-medium">Balance</p>
            <p className={`font-bold text-base ${balance >= 0 ? 'text-green-300' : 'text-orange-300'}`}>
              {formatCurrency(balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white px-4 pt-3 pb-0 shadow-sm sticky top-14 z-10">
        <button
          onClick={() => setTab('income')}
          className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 transition-colors ${tab === 'income' ? 'border-red-800 text-red-800' : 'border-transparent text-gray-400'}`}
        >
          Income ({income.length})
        </button>
        <button
          onClick={() => setTab('expenses')}
          className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 transition-colors ${tab === 'expenses' ? 'border-red-800 text-red-800' : 'border-transparent text-gray-400'}`}
        >
          Expenses ({expenses.length})
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-2 bg-white">
        <p className="text-xs text-gray-500">{list.length} entries</p>
        <div className="flex gap-2">
          <button onClick={handleExport} className="text-xs text-red-700 font-medium bg-red-50 px-3 py-1.5 rounded-lg active:scale-90">
            Export CSV
          </button>
          <button onClick={() => window.print()} className="text-xs text-gray-600 font-medium bg-gray-100 px-3 py-1.5 rounded-lg active:scale-90 no-print">
            Print
          </button>
        </div>
      </div>

      {/* List */}
      <div className="px-4 py-2 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)
        ) : list.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg viewBox="0 0 24 24" className="w-8 h-8 fill-red-300">
                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
              </svg>
            </div>
            <p className="font-medium text-gray-600">No {tab} entries</p>
            <p className="text-sm mt-1">Tap + to add one</p>
          </div>
        ) : (
          list.map(item => (
            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm card-hover">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {item.category && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{item.payment_method}</span>
                  </div>
                  {item.remarks && <p className="text-xs text-gray-500 mt-1 truncate">{item.remarks}</p>}

                  {/* Audit info — admin only */}
                  {isAdmin && (
                    <div className="mt-1.5 space-y-0.5">
                      {item.added_by_name && (
                        <p className="text-[10px] text-gray-400">
                          Added by <span className="font-medium text-gray-500">{item.added_by_name}</span>
                          {' '}&middot; {formatDate(item.created_at)}
                        </p>
                      )}
                      {!item.added_by_name && (
                        <p className="text-[10px] text-gray-400">{formatDate(item.created_at)}</p>
                      )}
                      {item.updated_by_name && (
                        <p className="text-[10px] text-orange-400">
                          Edited by <span className="font-medium">{item.updated_by_name}</span>
                          {item.updated_at ? ` · ${formatDate(item.updated_at)}` : ''}
                        </p>
                      )}
                    </div>
                  )}
                  {!isAdmin && (
                    <p className="text-xs text-gray-400 mt-1">{formatDate(item.created_at)}</p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <p className={`font-bold text-base ${tab === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {tab === 'income' ? '+' : '-'}{formatCurrency(Number(item.amount))}
                  </p>
                  {'bill_url' in item && (item as Expense).bill_url && (
                    <a href={(item as Expense).bill_url} target="_blank" rel="noreferrer"
                      className="text-xs text-red-700 mt-1 block">
                      View Bill
                    </a>
                  )}

                  {/* Edit / Delete — admin only */}
                  {isAdmin && (
                    <div className="flex gap-2 mt-2 justify-end">
                      <button
                        onClick={() => router.push(`/finance/add?type=${tab}&id=${item.id}`)}
                        className="text-xs text-red-700 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirm(item)}
                        className="text-xs text-red-400 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <Link
        href={`/finance/add?type=${tab}`}
        className="fixed bottom-20 right-4 w-14 h-14 bg-red-800 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform no-print z-20"
      >
        <span className="text-white text-2xl font-light">+</span>
      </Link>
    </div>
  );
}
