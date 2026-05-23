'use client';
import { useEffect, useState } from 'react';
import { getStudents, getFinance } from '@/lib/api';
import { useYear } from '@/hooks/useYear';
import { formatCurrency } from '@/lib/utils';
import { Student, Income, Expense } from '@/types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const PIE_COLORS = ['#991b1b','#b91c1c','#dc2626','#ef4444','#f87171','#fca5a5','#fecaca','#16a34a','#15803d','#166534','#4ade80','#86efac'];

export default function DashboardPage() {
  const { activeYear } = useYear();
  const [students, setStudents] = useState<Student[]>([]);
  const [incomeList, setIncomeList] = useState<Income[]>([]);
  const [expenseList, setExpenseList] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeYear) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      getStudents(activeYear),
      getFinance('income', activeYear),
      getFinance('expenses', activeYear),
    ]).then(([s, i, e]) => {
      setStudents(s as Student[]);
      setIncomeList(i as Income[]);
      setExpenseList(e as Expense[]);
    }).catch(console.error).finally(() => setLoading(false));
  }, [activeYear]);

  const totalIncome = incomeList.reduce((s, r) => s + Number(r.amount || 0), 0);
  const totalExpense = expenseList.reduce((s, r) => s + Number(r.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  const stats = [
    { label: 'Students', value: String(students.length), bg: 'bg-red-50', color: 'text-red-900', border: 'border-red-200' },
    { label: 'Active Year', value: activeYear || '--', bg: 'bg-orange-50', color: 'text-orange-900', border: 'border-orange-200' },
    { label: 'Total Income', value: formatCurrency(totalIncome), bg: 'bg-green-50', color: 'text-green-800', border: 'border-green-200' },
    { label: 'Total Expense', value: formatCurrency(totalExpense), bg: 'bg-red-50', color: 'text-red-800', border: 'border-red-200' },
    { label: 'Balance', value: formatCurrency(balance), bg: balance >= 0 ? 'bg-emerald-50' : 'bg-orange-50', color: balance >= 0 ? 'text-emerald-800' : 'text-orange-800', border: balance >= 0 ? 'border-emerald-200' : 'border-orange-200' },
    { label: 'Transactions', value: String(incomeList.length + expenseList.length), bg: 'bg-rose-50', color: 'text-rose-900', border: 'border-rose-200' },
  ];

  const monthlyData = (() => {
    const months: Record<string, { month: string; income: number; expense: number }> = {};
    const fmt = (iso: string) => {
      if (!iso) return 'Unknown';
      const d = new Date(iso);
      return d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
    };
    incomeList.forEach(r => {
      const m = fmt(r.created_at);
      if (!months[m]) months[m] = { month: m, income: 0, expense: 0 };
      months[m].income += Number(r.amount || 0);
    });
    expenseList.forEach(r => {
      const m = fmt(r.created_at);
      if (!months[m]) months[m] = { month: m, income: 0, expense: 0 };
      months[m].expense += Number(r.amount || 0);
    });
    return Object.values(months).slice(-6);
  })();

  const classData = (() => {
    const dist: Record<string, number> = {};
    students.forEach(s => { const c = s.class || 'Unknown'; dist[c] = (dist[c] || 0) + 1; });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  })();

  if (!activeYear) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 px-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-red-700"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" /></svg>
        </div>
        <p className="font-semibold text-gray-700">No year selected</p>
        <p className="text-sm mt-1 text-gray-500">Go to Settings to add and select a year</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 max-w-lg mx-auto space-y-5 page-enter">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)
          : stats.map(s => (
              <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4 card-hover`}>
                <p className={`text-lg font-bold ${s.color} leading-tight`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))
        }
      </div>

      {/* Income vs Expense chart */}
      {!loading && monthlyData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-red-100">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">Income vs Expense</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#15803d" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#991b1b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#991b1b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#fecaca" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => formatCurrency(Number(v) || 0)} />
              <Area type="monotone" dataKey="income" stroke="#15803d" fill="url(#incGrad)" strokeWidth={2} name="Income" />
              <Area type="monotone" dataKey="expense" stroke="#991b1b" fill="url(#expGrad)" strokeWidth={2} name="Expense" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Class distribution */}
      {!loading && classData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-red-100">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">Students by Class</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={classData} cx="50%" cy="50%" outerRadius={70} dataKey="value" fontSize={10}>
                {classData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && students.length === 0 && incomeList.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-red-100">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-red-300"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" /></svg>
          </div>
          <p className="font-semibold text-gray-700">No data yet</p>
          <p className="text-sm text-gray-500 mt-1">Start by adding students or finance entries</p>
        </div>
      )}
    </div>
  );
}
