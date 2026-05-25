import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import pool, { ok, err } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { id, newPassword } = await req.json();
    if (!id || !newPassword) return err('ID and new password required');
    if (String(newPassword).length < 6) return err('Password must be at least 6 characters');

    const hash = await bcrypt.hash(String(newPassword), 10);
    const { rowCount } = await pool.query(
      `UPDATE users SET password = $1, first_login = false WHERE id = $2`,
      [hash, id]
    );
    if (!rowCount) return err('User not found');
    return ok(null, 'Password changed');
  } catch (e) {
    console.error('[change-password]', e);
    return err(e instanceof Error ? e.message : 'Failed', 500);
  }
}
