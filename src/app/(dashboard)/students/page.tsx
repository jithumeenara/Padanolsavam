'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getStudents, deleteStudent } from '@/lib/api';
import { useYear } from '@/hooks/useYear';
import { getSession } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import { Student, CLASS_OPTIONS } from '@/types';
import { useToast } from '@/components/ToastContext';
import ConfirmDialog from '@/components/ConfirmDialog';
import { AuthUser } from '@/types';

export default function StudentsPage() {
  const { activeYear } = useYear();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [session, setSession] = useState<AuthUser | null>(null);

  useEffect(() => { setSession(getSession()); }, []);

  async function load() {
    if (!activeYear) { setLoading(false); return; }
    setLoading(true);
    try {
      const s = getSession();
      const addedBy = s?.role === 'user' ? s.id : undefined;
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

  async function handleDelete() {
    if (!confirmId) return;
    setDeleting(confirmId);
    try {
      await deleteStudent(confirmId);
      setStudents(prev => prev.filter(s => s.id !== confirmId));
      toast('Student deleted', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setDeleting(null);
      setConfirmId(null);
    }
  }

  const confirmStudent = students.find(s => s.id === confirmId);

  return (
    <div className="page-enter">
      <ConfirmDialog
        open={!!confirmId}
        title="Delete Student"
        message={confirmStudent ? `Remove "${confirmStudent.student_name}" from ${activeYear}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        loading={deleting === confirmId}
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
      {/* Search & Filter */}
      <div className="px-4 pt-4 pb-2 space-y-3 bg-white sticky top-0 z-10 shadow-sm">
        <div className="relative">
          <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 fill-gray-400">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            type="search"
            placeholder="Search name, house, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-gray-50"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scroll pb-1">
          <button
            onClick={() => setFilterClass('')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${!filterClass ? 'bg-red-800 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            All
          </button>
          {CLASS_OPTIONS.map(c => (
            <button
              key={c}
              onClick={() => setFilterClass(c === filterClass ? '' : c)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filterClass === c ? 'bg-red-800 text-white' : 'bg-gray-100 text-gray-600'}`}
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
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg viewBox="0 0 24 24" className="w-8 h-8 fill-red-300">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 12.4L5.47 11.6 4 12.44V17l8 4 8-4v-4.56l-1.47-.84L12 15.4z" />
              </svg>
            </div>
            <p className="font-medium text-gray-600">No students found</p>
            <p className="text-sm mt-1">Add a student using the + button</p>
          </div>
        ) : (
          filtered.map(s => (
            <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm card-hover flex gap-3">
              {/* Photo */}
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-red-50 shrink-0">
                {s.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.photo_url} alt={s.student_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-8 h-8 fill-red-300">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-800 truncate text-sm">{s.student_name}</p>
                  <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                    Class {s.class}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{s.house_name}</p>
                <p className="text-xs text-gray-500 truncate">Ph: {s.parent_phone}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-400">{formatDate(s.created_at)}</p>
                  <div className="flex gap-2">
                    <Link href={`/students/add?id=${s.id}`} className="text-xs text-red-700 font-medium">Edit</Link>
                    {session?.role === 'admin' && (
                      <button
                        onClick={() => setConfirmId(s.id)}
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
        className="fixed bottom-20 right-4 w-14 h-14 bg-red-800 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform no-print z-20"
      >
        <span className="text-white text-2xl font-light">+</span>
      </Link>
    </div>
  );
}
