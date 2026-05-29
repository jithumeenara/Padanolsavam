'use client';
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { addIncome, addExpense, getSettings, getFinanceEntry, updateFinance } from '@/lib/api';
import { useYear } from '@/hooks/useYear';
import { getSession } from '@/lib/auth';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/types';
import ImageUpload from '@/components/ImageUpload';
import { useToast } from '@/components/ToastContext';

function AddFinanceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeYear } = useYear();
  const { toast } = useToast();

  const defaultType = searchParams.get('type') === 'expenses' ? 'expenses' : 'income';
  const editId = searchParams.get('id');
  const isEdit = !!editId;

  const [type, setType] = useState<'income' | 'expenses'>(defaultType);
  const [form, setForm] = useState({
    title: '', amount: '', category: '', payment_method: 'Cash', remarks: '', bill_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(isEdit);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [incomeCategories, setIncomeCategories] = useState<string[]>(INCOME_CATEGORIES);
  const [expenseCategories, setExpenseCategories] = useState<string[]>(EXPENSE_CATEGORIES);

  useEffect(() => {
    const s = getSession();
    if (s) { setUserId(s.id); setUserName(s.name || ''); }
    getSettings().then(({ settings }) => {
      if (Array.isArray(settings?.income_categories) && settings.income_categories.length > 0)
        setIncomeCategories(settings.income_categories);
      if (Array.isArray(settings?.expense_categories) && settings.expense_categories.length > 0)
        setExpenseCategories(settings.expense_categories);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit || !editId) return;
    setLoadingEntry(true);
    getFinanceEntry(defaultType, editId).then(entry => {
      setForm({
        title: entry.title || '',
        amount: String(entry.amount || ''),
        category: entry.category || '',
        payment_method: entry.payment_method || 'Cash',
        remarks: entry.remarks || '',
        bill_url: ('bill_url' in entry ? entry.bill_url : '') || '',
      });
    }).catch(err => {
      toast(err instanceof Error ? err.message : 'Failed to load entry', 'error');
    }).finally(() => setLoadingEntry(false));
  }, [editId]);

  function setField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast('Title is required', 'error'); return; }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      toast('Enter a valid amount', 'error'); return;
    }
    if (!isEdit && !activeYear) { toast('No active year. Set one in Settings.', 'error'); return; }

    setLoading(true);
    try {
      if (isEdit && editId) {
        await updateFinance(type, editId, { ...form, amount: Number(form.amount), updated_by: userId });
        toast('Entry updated!', 'success');
      } else {
        const payload = { ...form, amount: Number(form.amount), year: activeYear, created_by: userId, added_by_name: userName };
        if (type === 'income') await addIncome(payload);
        else await addExpense(payload);
        toast(`${type === 'income' ? 'Income' : 'Expense'} added!`, 'success');
      }
      router.back();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setLoading(false);
    }
  }

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  if (loadingEntry) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-enter max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-white shadow-sm sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 text-red-800 font-bold text-lg active:scale-90 transition-transform"
          aria-label="Back"
        >
          &lsaquo;
        </button>
        <h2 className="font-bold text-gray-800 text-base">{isEdit ? 'Edit Transaction' : 'Add Transaction'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        {/* Type Toggle */}
        <div className={`flex bg-gray-100 rounded-xl p-1 ${isEdit ? 'opacity-50 pointer-events-none' : ''}`}>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              type === 'income' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500'
            }`}
          >
            Income
          </button>
          <button
            type="button"
            onClick={() => setType('expenses')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              type === 'expenses' ? 'bg-red-700 text-white shadow-sm' : 'text-gray-500'
            }`}
          >
            Expense
          </button>
        </div>

        {/* Title */}
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

        {/* Amount */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">Amount (Rs.) *</label>
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

        {/* Category */}
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

        {/* Payment Method */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">Payment Method</label>
          <div className="flex gap-2 flex-wrap">
            {PAYMENT_METHODS.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setField('payment_method', m)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  form.payment_method === m
                    ? 'bg-red-700 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Bill upload for expenses */}
        {type === 'expenses' && (
          <ImageUpload
            value={form.bill_url}
            onChange={url => setField('bill_url', url)}
            label="Bill / Receipt (optional)"
          />
        )}

        {/* Remarks */}
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
          className={`w-full text-white rounded-xl py-3.5 font-semibold text-sm disabled:opacity-50 transition-colors ${
            type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-700 hover:bg-red-800'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : isEdit ? 'Save Changes' : `Add ${type === 'income' ? 'Income' : 'Expense'}`}
        </button>
      </form>
    </div>
  );
}

export default function AddFinancePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AddFinanceForm />
    </Suspense>
  );
}
