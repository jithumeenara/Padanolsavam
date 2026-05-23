'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { addStudent, updateStudent, getStudents } from '@/lib/api';
import { useYear } from '@/hooks/useYear';
import { getSession } from '@/lib/auth';
import { CLASS_OPTIONS, Student } from '@/types';
import ImageUpload from '@/components/ImageUpload';
import { useToast } from '@/components/ToastContext';

function AddStudentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { activeYear } = useYear();
  const { toast } = useToast();

  const [session, setSession] = useState<ReturnType<typeof getSession>>(null);
  const [form, setForm] = useState({
    student_name: '', class: '1', parent_phone: '',
    address: '', house_name: '', remarks: '', photo_url: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => { setSession(getSession()); }, []);

  useEffect(() => {
    if (editId && activeYear) {
      getStudents(activeYear).then(list => {
        const s = list.find((x: Student) => x.id === editId);
        if (s) setForm({
          student_name: s.student_name, class: s.class,
          parent_phone: s.parent_phone, address: s.address,
          house_name: s.house_name, remarks: s.remarks, photo_url: s.photo_url,
        });
      }).catch(console.error);
    }
  }, [editId, activeYear]);

  function setField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!form.student_name) { toast('Student name is required', 'error'); return; }
    if (!activeYear) { toast('No active year. Set one in Settings.', 'error'); return; }
    setLoading(true);
    try {
      if (editId) {
        await updateStudent(editId, form);
        toast('Student updated!', 'success');
      } else {
        await addStudent({ ...form, added_by: session?.id || '', year: activeYear });
        toast('Student added!', 'success');
      }
      router.back();
    } catch (err) {
      if (!navigator.onLine) {
        const queue = JSON.parse(localStorage.getItem('dyfi_offline_students') || '[]');
        queue.push({ ...form, added_by: session?.id || '', year: activeYear, _ts: Date.now() });
        localStorage.setItem('dyfi_offline_students', JSON.stringify(queue));
        toast('Saved offline. Will sync when connected.', 'info');
        router.back();
      } else {
        toast(err instanceof Error ? err.message : 'Failed to save', 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-enter max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-4 py-4 bg-white shadow-sm sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 text-red-800 font-bold text-lg active:scale-90 transition-transform"
          aria-label="Back"
        >
          &lsaquo;
        </button>
        <h2 className="font-bold text-gray-800 text-base">{editId ? 'Edit Student' : 'Add Student'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        <ImageUpload value={form.photo_url} onChange={url => setField('photo_url', url)} label="Student Photo" />

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">Student Name *</label>
          <input
            value={form.student_name}
            onChange={e => setField('student_name', e.target.value)}
            placeholder="Full name"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white"
            required
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">Class *</label>
          <select
            value={form.class}
            onChange={e => setField('class', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white"
          >
            {CLASS_OPTIONS.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">Parent Phone</label>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={form.parent_phone}
            onChange={e => setField('parent_phone', e.target.value)}
            placeholder="10-digit mobile"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">House Name</label>
          <input
            value={form.house_name}
            onChange={e => setField('house_name', e.target.value)}
            placeholder="House / family name"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">Address</label>
          <textarea
            value={form.address}
            onChange={e => setField('address', e.target.value)}
            placeholder="Full address"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white resize-none"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">Remarks</label>
          <textarea
            value={form.remarks}
            onChange={e => setField('remarks', e.target.value)}
            placeholder="Any additional notes"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-700 hover:bg-red-800 text-white rounded-xl py-3.5 font-semibold text-sm disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : editId ? 'Update Student' : 'Add Student'}
        </button>
      </form>
    </div>
  );
}

export default function AddStudentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AddStudentForm />
    </Suspense>
  );
}
