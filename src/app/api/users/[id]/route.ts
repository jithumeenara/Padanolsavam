import { NextRequest } from 'next/server';
import pool, { ok, err } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updates: string[] = [];
    const values: unknown[] = [];
    if (body.name) { updates.push(`name = $${values.length + 1}`); values.push(body.name); }
    if (body.role) { updates.push(`role = $${values.length + 1}`); values.push(body.role); }
    if (!updates.length) return err('Nothing to update');
    values.push(id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${values.length}`, values);
    return ok(null, 'User updated');
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed', 500);
  }
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { rows } = await pool.query('SELECT status FROM users WHERE id = $1', [id]);
    if (!rows.length) return err('User not found');
    const newStatus = rows[0].status === 'active' ? 'inactive' : 'active';
    await pool.query('UPDATE users SET status = $1 WHERE id = $2', [newStatus, id]);
    return ok({ status: newStatus });
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed', 500);
  }
}
