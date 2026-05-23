'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getFinance } from '@/lib/api';
import { useYear } from '@/hooks/useYear';
import { formatCurrency, formatDate, downloadCSV } from '@/lib/utils';
import { Income, Expense } from '@/types';
import { useToast } from '@/components/ToastContext';

type Tab = 'income' | 'expenses';

export default function FinancePage() {
  const { activeYear } = useYear();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('income');
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

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

  const list = tab === 'income' ? income : expenses;

  function handleExport() {
    downloadCSV(list as unknown as Record<string, unknown>[], `${tab}_${activeYear}.csv`);
    toast('Exported!', 'success');
  }

  const categoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      'Membership Fee': 'bg-blue-100 text-blue-700',
      'Donation': 'bg-green-100 text-green-700',
      'Event Income': 'bg-purple-100 text-purple-700',
      'Event Expense': 'bg-red-100 text-red-700',
      'Travel': 'bg-orange-100 text-orange-700',
      'Food': 'bg-yellow-100 text-yellow-700',
    };
    return colors[cat] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="page-enter">
      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-950 to-blue-800 px-4 py-4">
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
            <p className="text-blue-200 text-xs font-medium">Balance</p>
            <p className={`font-bold text-base ${balance >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {formatCurrency(balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white px-4 pt-3 pb-0 shadow-sm sticky top-14 z-10">
        <button
          onClick={() => setTab('income')}
          className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 transition-colors ${tab === 'income' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-400'}`}
        >
          Income ({income.length})
        </button>
        <button
          onClick={() => setTab('expenses')}
          className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 transition-colors ${tab === 'expenses' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-400'}`}
        >
          Expenses ({expenses.length})
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-2 bg-white">
        <p className="text-xs text-gray-500">{list.length} entries</p>
        <div className="flex gap-2">
          <button onClick={handleExport} className="text-xs text-blue-700 font-medium bg-blue-50 px-3 py-1.5 rounded-lg active:scale-90">
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
            <span className="text-5xl block mb-3">💰</span>
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
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColor(item.category)}`}>
                      {item.category}
                    </span>
                    <span className="text-xs text-gray-400">{item.payment_method}</span>
                  </div>
                  {item.remarks && <p className="text-xs text-gray-500 mt-1 truncate">{item.remarks}</p>}
                  <p className="text-xs text-gray-400 mt-1">{formatDate(item.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-base ${tab === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {tab === 'income' ? '+' : '-'}{formatCurrency(Number(item.amount))}
                  </p>
                  {'bill_url' in item && (item as { bill_url: string }).bill_url && (
                    <a href={(item as { bill_url: string }).bill_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 mt-1 block">
                      View Bill
                    </a>
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
        className="fixed bottom-20 right-4 w-14 h-14 bg-blue-900 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform no-print z-20"
      >
        <span className="text-white text-2xl font-light">+</span>
      </Link>
    </div>
  );
}
