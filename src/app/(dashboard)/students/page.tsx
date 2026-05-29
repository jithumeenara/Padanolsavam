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

export default function StudentsPage() {
  const { activeYear } = useYear();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [callStudent, setCallStudent] = useState<Student | null>(null);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);

  const isAdmin = getSession()?.role === 'admin';

  async function load() {
    if (!activeYear) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await getStudents(activeYear);
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

      {/* Call / WhatsApp popup */}
      {callStudent && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setCallStudent(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative w-full bg-white rounded-t-3xl px-5 pt-3 pb-10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <p className="text-center font-bold text-gray-800 mb-1">{callStudent.student_name}</p>
            <p className="text-center text-sm text-gray-500 mb-5">{callStudent.parent_phone}</p>

            <a
              href={`tel:${callStudent.parent_phone}`}
              className="w-full flex items-center gap-4 bg-green-50 border border-green-100 rounded-2xl px-4 py-4 mb-3 active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Call</p>
                <p className="text-xs text-gray-500">Make a phone call</p>
              </div>
            </a>

            <a
              href={`https://wa.me/91${callStudent.parent_phone}`}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center gap-4 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-4 mb-4 active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 bg-[#25D366] rounded-xl flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">WhatsApp</p>
                <p className="text-xs text-gray-500">Send a WhatsApp message</p>
              </div>
            </a>

            <button onClick={() => setCallStudent(null)} className="w-full py-3 text-sm font-semibold text-gray-500 rounded-2xl bg-gray-100 active:opacity-70">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Student profile preview */}
      {viewStudent && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setViewStudent(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white px-5 pt-3 pb-2 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 text-base">Student Profile</h3>
                <button onClick={() => setViewStudent(null)} className="text-gray-400 text-xl font-light w-8 h-8 flex items-center justify-center">&times;</button>
              </div>
            </div>

            <div className="px-5 py-4">
              {/* Photo + name */}
              <div className="flex gap-4 mb-5">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-red-50 shrink-0">
                  {viewStudent.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={viewStudent.photo_url} alt={viewStudent.student_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-10 h-10 fill-red-300">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-lg leading-tight">{viewStudent.student_name}</p>
                  <span className="inline-block bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full mt-1">Class {viewStudent.class}</span>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(viewStudent.created_at)}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                {viewStudent.parent_phone && (
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-green-600 shrink-0">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Parent Phone</p>
                      <p className="text-sm font-semibold text-gray-800">{viewStudent.parent_phone}</p>
                    </div>
                    <button onClick={() => setCallStudent(viewStudent)} className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-lg active:scale-95">
                      Call
                    </button>
                  </div>
                )}
                {viewStudent.house_name && (
                  <div className="bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">House Name</p>
                    <p className="text-sm text-gray-800">{viewStudent.house_name}</p>
                  </div>
                )}
                {viewStudent.address && (
                  <div className="bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">Address</p>
                    <p className="text-sm text-gray-800 whitespace-pre-line">{viewStudent.address}</p>
                  </div>
                )}
                {viewStudent.remarks && (
                  <div className="bg-amber-50 rounded-xl px-4 py-3">
                    <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wide mb-0.5">Remarks</p>
                    <p className="text-sm text-gray-800">{viewStudent.remarks}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-5 pb-2">
                <Link
                  href={`/students/add?id=${viewStudent.id}`}
                  className="flex-1 bg-red-800 text-white text-sm font-semibold py-3 rounded-xl text-center active:scale-95 transition-transform"
                >
                  Edit Profile
                </Link>
                {viewStudent.parent_phone && (
                  <button
                    onClick={() => { setViewStudent(null); setCallStudent(viewStudent); }}
                    className="flex-1 bg-green-600 text-white text-sm font-semibold py-3 rounded-xl active:scale-95 transition-transform"
                  >
                    Call / WhatsApp
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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
            <div key={s.id} className="bg-white rounded-2xl p-3 shadow-sm card-hover">
              <div className="flex gap-3 items-start">
                {/* Photo + class badge below */}
                <button onClick={() => setViewStudent(s)} className="shrink-0 flex flex-col items-center gap-1 active:scale-95 transition-transform">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-red-50">
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
                  <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    {s.class}
                  </span>
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate text-sm">{s.student_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{s.house_name}</p>
                  <p className="text-xs text-gray-500 truncate">{s.parent_phone}</p>
                </div>

                {/* Eye + Call icons — single horizontal row */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setViewStudent(s)}
                    className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-red-700">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                  </button>
                  {s.parent_phone && (
                    <button
                      onClick={() => setCallStudent(s)}
                      className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-green-600">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom row: date + edit/delete */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                <p className="text-xs text-gray-400">{formatDate(s.created_at)}</p>
                <div className="flex gap-3">
                  <Link href={`/students/add?id=${s.id}`} className="text-xs text-red-700 font-semibold">Edit</Link>
                  {isAdmin && (
                    <button
                      onClick={() => setConfirmId(s.id)}
                      disabled={deleting === s.id}
                      className="text-xs text-red-400 font-semibold disabled:opacity-50"
                    >
                      {deleting === s.id ? '...' : 'Delete'}
                    </button>
                  )}
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
