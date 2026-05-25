import { NextRequest } from 'next/server';
import pool, { ok, err } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const fields = ['student_name','class','parent_phone','address','house_name','remarks','photo_url'];
    const updates: string[] = [];
    const values: unknown[] = [];
    fields.forEach(f => {
      if (body[f] !== undefined) { updates.push(`${f} = $${values.length + 1}`); values.push(body[f]); }
    });
    if (!updates.length) return err('Nothing to update');
    values.push(id);
    await pool.query(`UPDATE students SET ${updates.join(', ')} WHERE id = $${values.length}`, values);
    return ok(null, 'Student updated');
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed', 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await pool.query('DELETE FROM students WHERE id = $1', [id]);
    return ok(null, 'Student deleted');
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed', 500);
  }
}
