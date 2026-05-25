'use client';
import { useEffect, useRef, useState } from 'react';
import { getStudents, getFinance, getSettings } from '@/lib/api';
import { useYear } from '@/hooks/useYear';
import { formatCurrency, formatDate, downloadCSV } from '@/lib/utils';
import { Student, Income, Expense, Year } from '@/types';
import { useToast } from '@/components/ToastContext';

type Tab = 'financial' | 'students';

export default function ReportsPage() {
  const { activeYear } = useYear();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const [tab, setTab] = useState<Tab>('financial');
  const [years, setYears] = useState<Year[]>([]);
  const [selectedYear, setSelectedYear] = useState(activeYear || '');

  const [students, setStudents] = useState<Student[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  const [classFilter, setClassFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expenses'>('all');

  useEffect(() => {
    getSettings().then(({ years: y }) => setYears(y)).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeYear && !selectedYear) setSelectedYear(activeYear);
  }, [activeYear, selectedYear]);

  useEffect(() => {
    if (!selectedYear) return;
    setLoading(true);
    Promise.all([
      getStudents(selectedYear),
      getFinance('income', selectedYear),
      getFinance('expenses', selectedYear),
    ]).then(([s, i, e]) => {
      setStudents(s as Student[]);
      setIncome(i as Income[]);
      setExpenses(e as Expense[]);
    }).catch(err => toast(err instanceof Error ? err.message : 'Load failed', 'error'))
      .finally(() => setLoading(false));
  }, [selectedYear]);

  const totalIncome = income.reduce((s, r) => s + Number(r.amount || 0), 0);
  const totalExpense = expenses.reduce((s, r) => s + Number(r.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  const filteredStudents = classFilter
    ? students.filter(s => s.class === classFilter)
    : students;

  const visibleFinance = (() => {
    if (typeFilter === 'income') return income.map(i => ({ ...i, _type: 'income' as const }));
    if (typeFilter === 'expenses') return expenses.map(e => ({ ...e, _type: 'expenses' as const }));
    return [
      ...income.map(i => ({ ...i, _type: 'income' as const })),
      ...expenses.map(e => ({ ...e, _type: 'expenses' as const })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  })();

  const classOptions = [...new Set(students.map(s => s.class))].sort((a, b) => {
    const n = Number(a) - Number(b);
    return isNaN(n) ? a.localeCompare(b) : n;
  });

  function handlePrint() { window.print(); }

  function handleExportFinance() {
    const data = visibleFinance.map(r => ({
      type: r._type,
      title: r.title,
      amount: r.amount,
      category: r.category,
      payment_method: r.payment_method,
      remarks: r.remarks,
      year: r.year,
      date: formatDate(r.created_at),
    }));
    downloadCSV(data as unknown as Record<string, unknown>[], `financial_report_${selectedYear}.csv`);
    toast('Exported!', 'success');
  }

  function handleExportStudents() {
    const data = filteredStudents.map(s => ({
      name: s.student_name,
      class: s.class,
      parent_phone: s.parent_phone,
      house_name: s.house_name,
      address: s.address,
      remarks: s.remarks,
      year: s.year,
      date_added: formatDate(s.created_at),
    }));
    downloadCSV(data as unknown as Record<string, unknown>[], `students_report_${selectedYear}.csv`);
    toast('Exported!', 'success');
  }

  return (
    <div className="page-enter">
      {/* Controls */}
      <div className="no-print">
        <div className="bg-white px-4 py-3 shadow-sm flex items-center justify-between gap-3">
          <h2 className="font-bold text-gray-800 text-base">Reports</h2>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 max-w-[130px]"
          >
            <option value="">Select year</option>
            {years.map(y => (
              <option key={y.id} value={y.year_name}>{y.year_name}</option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex bg-white px-4 pt-2 pb-0 border-b border-gray-100">
          <button
            onClick={() => setTab('financial')}
            className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 transition-colors ${tab === 'financial' ? 'border-red-800 text-red-800' : 'border-transparent text-gray-400'}`}
          >
            Financial Report
          </button>
          <button
            onClick={() => setTab('students')}
            className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 transition-colors ${tab === 'students' ? 'border-red-800 text-red-800' : 'border-transparent text-gray-400'}`}
          >
            Student Report
          </button>
        </div>
      </div>

      {/* Printable area */}
      <div ref={printRef} className="print-area">

        {/* Financial Report */}
        {tab === 'financial' && (
          <div>
            <div className="no-print px-4 pt-3 pb-2 space-y-2 bg-white">
              <div className="flex gap-2 flex-wrap">
                {(['all', 'income', 'expenses'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold ${typeFilter === t ? 'bg-red-800 text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {t === 'all' ? 'All' : t === 'income' ? 'Income' : 'Expense'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 items-center justify-between">
                <p className="text-xs text-gray-500">{visibleFinance.length} entries</p>
                <div className="flex gap-2">
                  <button onClick={handleExportFinance} className="bg-red-50 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg">Export CSV</button>
                  <button onClick={handlePrint} className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg">Print</button>
                </div>
              </div>
            </div>

            {/* Print header */}
            <div className="print-only print-doc-header">
              <h1>പഠനോത്സവം</h1>
              <h2>DYFI Meenara Unit</h2>
              <hr />
              <p className="print-report-label">Financial Report &mdash; Year: {selectedYear}</p>
              <p className="print-date-label">Printed: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>

            {/* Summary */}
            <div className="px-4 pt-4 pb-2 grid grid-cols-3 gap-3">
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Total Income</p>
                <p className="font-bold text-green-700 text-sm">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Total Expense</p>
                <p className="font-bold text-red-700 text-sm">{formatCurrency(totalExpense)}</p>
              </div>
              <div className={`${balance >= 0 ? 'bg-emerald-50' : 'bg-orange-50'} rounded-xl p-3 text-center`}>
                <p className="text-xs text-gray-500 mb-1">Balance</p>
                <p className={`font-bold text-sm ${balance >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>{formatCurrency(balance)}</p>
              </div>
            </div>

            {/* Table */}
            <div className="px-4 pb-4">
              {loading ? (
                <div className="space-y-2 pt-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}</div>
              ) : visibleFinance.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg viewBox="0 0 24 24" className="w-8 h-8 fill-red-200">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z" />
                    </svg>
                  </div>
                  <p className="font-medium text-gray-600">No data for this year</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100 mt-2">
                  <table className="w-full text-xs min-w-[480px]">
                    <thead>
                      <tr className="bg-red-50 border-b border-red-100">
                        <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Type</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Title</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Category</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Method</th>
                        <th className="text-right px-3 py-2.5 font-semibold text-gray-600">Amount</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleFinance.map((item, idx) => (
                        <tr key={item.id} className={`border-b border-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${item._type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {item._type === 'income' ? 'Income' : 'Expense'}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-medium text-gray-800 max-w-[120px] truncate">{item.title}</td>
                          <td className="px-3 py-2 text-gray-500">{item.category}</td>
                          <td className="px-3 py-2 text-gray-500">{item.payment_method}</td>
                          <td className={`px-3 py-2 text-right font-semibold ${item._type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                            {item._type === 'income' ? '+' : '-'}{formatCurrency(Number(item.amount))}
                          </td>
                          <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{formatDate(item.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-red-50 border-t-2 border-red-100">
                        <td colSpan={4} className="px-3 py-2.5 font-bold text-gray-700 text-xs">Balance</td>
                        <td className={`px-3 py-2.5 text-right font-bold text-sm ${balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {formatCurrency(balance)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Student Report */}
        {tab === 'students' && (
          <div>
            <div className="no-print px-4 pt-3 pb-2 space-y-2 bg-white">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setClassFilter('')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold ${!classFilter ? 'bg-red-800 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  All Classes
                </button>
                {classOptions.map(c => (
                  <button
                    key={c}
                    onClick={() => setClassFilter(c === classFilter ? '' : c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold ${classFilter === c ? 'bg-red-800 text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    Class {c}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 items-center justify-between">
                <p className="text-xs text-gray-500">{filteredStudents.length} students</p>
                <div className="flex gap-2">
                  <button onClick={handleExportStudents} className="bg-red-50 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg">Export CSV</button>
                  <button onClick={handlePrint} className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg">Print</button>
                </div>
              </div>
            </div>

            {/* Print header */}
            <div className="print-only print-doc-header">
              <h1>പഠനോത്സവം</h1>
              <h2>DYFI Meenara Unit</h2>
              <hr />
              <p className="print-report-label">Student Report &mdash; Year: {selectedYear}{classFilter ? ` | Class ${classFilter}` : ''}</p>
              <p className="print-date-label">Printed: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>

            {/* Summary */}
            <div className="px-4 pt-4 pb-2">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Total Students</p>
                  <p className="font-bold text-red-900 text-lg">{filteredStudents.length}</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Year</p>
                  <p className="font-bold text-orange-800 text-sm">{selectedYear || '&mdash;'}</p>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="px-4 pb-4">
              {loading ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}</div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg viewBox="0 0 24 24" className="w-8 h-8 fill-red-200">
                      <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 12.4L5.47 11.6 4 12.44V17l8 4 8-4v-4.56l-1.47-.84L12 15.4z" />
                    </svg>
                  </div>
                  <p className="font-medium text-gray-600">No students found</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                  <table className="w-full text-xs min-w-[560px]">
                    <thead>
                      <tr className="bg-red-50 border-b border-red-100">
                        <th className="text-left px-3 py-2.5 font-semibold text-gray-600">#</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Name</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Class</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Parent Phone</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-gray-600">House Name</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Remarks</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Added</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s, idx) => (
                        <tr key={s.id} className={`border-b border-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{s.student_name}</td>
                          <td className="px-3 py-2">
                            <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-semibold">{s.class}</span>
                          </td>
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{s.parent_phone}</td>
                          <td className="px-3 py-2 text-gray-600 max-w-[120px] truncate">{s.house_name}</td>
                          <td className="px-3 py-2 text-gray-500 max-w-[100px] truncate">{s.remarks}</td>
                          <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{formatDate(s.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-red-50 border-t-2 border-red-100">
                        <td colSpan={7} className="px-3 py-2.5 font-bold text-gray-700 text-xs">
                          Total: {filteredStudents.length} students{classFilter ? ` in Class ${classFilter}` : ''}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating print button */}
      <button
        onClick={handlePrint}
        className="no-print fixed bottom-20 right-4 w-14 h-14 bg-red-800 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform z-20"
        title="Print Report"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
          <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" />
        </svg>
      </button>
    </div>
  );
}
