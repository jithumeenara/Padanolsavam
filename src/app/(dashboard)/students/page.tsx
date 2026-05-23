'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getStudents, deleteStudent } from '@/lib/api';
import { useYear } from '@/hooks/useYear';
import { getSession } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import { Student, CLASS_OPTIONS } from '@/types';
import { useToast } from '@/components/ToastContext';

export default function StudentsPage() {
  const { activeYear } = useYear();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const session = getSession();

  async function load() {
    if (!activeYear) { setLoading(false); return; }
    setLoading(true);
    try {
      const addedBy = session?.role === 'user' ? session.id : undefined;
      const data = await getStudents(activeYear, addedBy);
      setStudents(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [activeYear]);

  const filtered = useMemo(() => {
    return students.filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.student_name.toLowerCase().includes(q)
        || s.house_name.toLowerCase().includes(q)
        || s.parent_phone.includes(q);
      const matchClass = !filterClass || s.class === filterClass;
      return matchSearch && matchClass;
    });
  }, [students, search, filterClass]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this student?')) return;
    setDeleting(id);
    try {
      await deleteStudent(id);
      setStudents(prev => prev.filter(s => s.id !== id));
      toast('Student deleted', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="page-enter">
      {/* Search & Filter */}
      <div className="px-4 pt-4 pb-2 space-y-3 bg-white sticky top-0 z-10 shadow-sm">
        <input
          type="search"
          placeholder="🔍  Search name, house, phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50"
        />
        <div className="flex gap-2 overflow-x-auto hide-scroll pb-1">
          <button
            onClick={() => setFilterClass('')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${!filterClass ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            All
          </button>
          {CLASS_OPTIONS.map(c => (
            <button
              key={c}
              onClick={() => setFilterClass(c === filterClass ? '' : c)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filterClass === c ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {c}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">{filtered.length} students</p>
      </div>

      {/* List */}
      <div className="px-4 py-3 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <span className="text-5xl block mb-3">🎓</span>
            <p className="font-medium text-gray-600">No students found</p>
            <p className="text-sm mt-1">Add a student using the + button</p>
          </div>
        ) : (
          filtered.map(s => (
            <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm card-hover flex gap-3">
              {/* Photo */}
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-blue-50 shrink-0">
                {s.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.photo_url} alt={s.student_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-800 truncate text-sm">{s.student_name}</p>
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                    Class {s.class}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{s.house_name}</p>
                <p className="text-xs text-gray-500 truncate">📞 {s.parent_phone}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-400">{formatDate(s.created_at)}</p>
                  <div className="flex gap-2">
                    <Link href={`/students/add?id=${s.id}`} className="text-xs text-blue-700 font-medium">Edit</Link>
                    {session?.role === 'admin' && (
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deleting === s.id}
                        className="text-xs text-red-500 font-medium disabled:opacity-50"
                      >
                        {deleting === s.id ? '...' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <Link
        href="/students/add"
        className="fixed bottom-20 right-4 w-14 h-14 bg-blue-900 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform no-print z-20"
      >
        <span className="text-white text-2xl font-light">+</span>
      </Link>
    </div>
  );
}
