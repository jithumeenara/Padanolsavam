'use client';
import { useEffect, useState } from 'react';
import { getStudents, getFinance } from '@/lib/api';
import { useYear } from '@/hooks/useYear';
import { formatCurrency } from '@/lib/utils';
import { Student, Income, Expense } from '@/types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface StatCard {
  label: string;
  value: string;
  icon: string;
  bg: string;
  color: string;
}

const CLASS_COLORS = ['#1e3a5f', '#2d5282', '#3182ce', '#4299e1', '#63b3ed', '#90cdf4', '#bee3f8', '#ebf8ff', '#f0fff4', '#e6fffa', '#fffaf0', '#fff5f5'];

export default function DashboardPage() {
  const { activeYear } = useYear();
  const [students, setStudents] = useState<Student[]>([]);
  const [incomeList, setIncomeList] = useState<Income[]>([]);
  const [expenseList, setExpenseList] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeYear) return;
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

  const stats: StatCard[] = [
    { label: 'Students', value: String(students.length), icon: '🎓', bg: 'bg-blue-50', color: 'text-blue-900' },
    { label: 'Active Year', value: activeYear || '—', icon: '📅', bg: 'bg-indigo-50', color: 'text-indigo-900' },
    { label: 'Total Income', value: formatCurrency(totalIncome), icon: '⬆️', bg: 'bg-green-50', color: 'text-green-800' },
    { label: 'Total Expense', value: formatCurrency(totalExpense), icon: '⬇️', bg: 'bg-red-50', color: 'text-red-800' },
    { label: 'Balance', value: formatCurrency(balance), icon: balance >= 0 ? '✅' : '⚠️', bg: balance >= 0 ? 'bg-emerald-50' : 'bg-orange-50', color: balance >= 0 ? 'text-emerald-800' : 'text-orange-800' },
    { label: 'Entries', value: String(incomeList.length + expenseList.length), icon: '📊', bg: 'bg-purple-50', color: 'text-purple-900' },
  ];

  // Monthly chart data
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

  // Class distribution
  const classData = (() => {
    const dist: Record<string, number> = {};
    students.forEach(s => {
      const c = s.class || 'Unknown';
      dist[c] = (dist[c] || 0) + 1;
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  })();

  if (!activeYear) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 px-6 text-center">
        <span className="text-4xl mb-3">📅</span>
        <p className="font-semibold text-gray-700">No year selected</p>
        <p className="text-sm mt-1">Go to Settings to add a year first</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 max-w-lg mx-auto space-y-5 page-enter">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))
          : stats.map(s => (
              <div key={s.label} className={`${s.bg} rounded-2xl p-4 card-hover`}>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xl">{s.icon}</span>
                </div>
                <p className={`text-lg font-bold ${s.color} leading-tight`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))
        }
      </div>

      {/* Income vs Expense Chart */}
      {!loading && monthlyData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">Income vs Expense</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e53e3e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#e53e3e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Area type="monotone" dataKey="income" stroke="#1e3a5f" fill="url(#incGrad)" strokeWidth={2} name="Income" />
              <Area type="monotone" dataKey="expense" stroke="#e53e3e" fill="url(#expGrad)" strokeWidth={2} name="Expense" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Class Distribution */}
      {!loading && classData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">Students by Class</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={classData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10}>
                {classData.map((_, i) => (
                  <Cell key={i} fill={CLASS_COLORS[i % CLASS_COLORS.length]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && students.length === 0 && incomeList.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <span className="text-5xl block mb-3">📋</span>
          <p className="font-semibold text-gray-700">No data yet</p>
          <p className="text-sm text-gray-500 mt-1">Start by adding students or finance entries</p>
        </div>
      )}
    </div>
  );
}
