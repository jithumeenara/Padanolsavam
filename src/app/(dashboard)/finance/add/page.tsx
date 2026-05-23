'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { addIncome, addExpense } from '@/lib/api';
import { useYear } from '@/hooks/useYear';
import { getSession } from '@/lib/auth';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/types';
import ImageUpload from '@/components/ImageUpload';
import { useToast } from '@/components/ToastContext';
import { useEffect } from 'react';

function AddFinanceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeYear } = useYear();
  const { toast } = useToast();

  const defaultType = searchParams.get('type') === 'expenses' ? 'expenses' : 'income';
  const [type, setType] = useState<'income' | 'expenses'>(defaultType);
  const [form, setForm] = useState({
    title: '', amount: '', category: '', payment_method: 'Cash', remarks: '', bill_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const s = getSession();
    if (s) setUserId(s.id);
  }, []);

  function setField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast('Title is required', 'error'); return; }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      toast('Enter a valid amount', 'error'); return;
    }
    if (!activeYear) { toast('No active year. Set one in Settings.', 'error'); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        year: activeYear,
        created_by: userId,
      };
      if (type === 'income') await addIncome(payload);
      else await addExpense(payload);
      toast(`${type === 'income' ? 'Income' : 'Expense'} added!`, 'success');
      router.back();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setLoading(false);
    }
  }

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="page-enter max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-4 py-4 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-2xl text-gray-500 active:scale-90 transition-transform">â†</button>
        <h2 className="font-bold text-gray-800 text-base">Add Transaction</h2>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        {/* Type Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${type === 'income' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500'}`}
          >
            â¬†ï¸ Income
          </button>
          <button
            type="button"
            onClick={() => setType('expenses')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${type === 'expenses' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500'}`}
          >
            â¬‡ï¸ Expense
          </button>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">Title *</label>
          <input
            value={form.title}
            onChange={e => setField('title', e.target.value)}
            placeholder="e.g. Programme fee"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white"
            required
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">Amount (â‚¹) *</label>
          <input
            type="number"
            inputMode="numeric"
            value={form.amount}
            onChange={e => setField('amount', e.target.value)}
            placeholder="0"
            min="1"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white"
            required
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">Category</label>
          <select
            value={form.category}
            onChange={e => setField('category', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white"
          >
            <option value="">Select category</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">Payment Method</label>
          <div className="flex gap-2 flex-wrap">
            {PAYMENT_METHODS.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setField('payment_method', m)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${form.payment_method === m ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {type === 'expenses' && (
          <ImageUpload value={form.bill_url} onChange={url => setField('bill_url', url)} label="Bill / Receipt (optional)" />
        )}

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">Remarks</label>
          <textarea
            value={form.remarks}
            onChange={e => setField('remarks', e.target.value)}
            placeholder="Any notes"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full text-white rounded-xl py-3.5 font-semibold text-sm disabled:opacity-50 transition-colors ${type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : `Add ${type === 'income' ? 'Income' : 'Expense'}`}
        </button>
      </form>
    </div>
  );
}

export default function AddFinancePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AddFinanceForm />
    </Suspense>
  );
}

