import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import pool, { ok, err } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { mobile, password } = await req.json();
  if (!mobile || !password) return err('Mobile and password required');

  const { rows } = await pool.query(
    `SELECT id, name, mobile, password, role, status, first_login
     FROM users WHERE mobile = $1`,
    [String(mobile).trim()]
  );

  const user = rows[0];
  if (!user || user.status !== 'active') return err('User not found or inactive');

  const match = await bcrypt.compare(String(password), user.password);
  if (!match) return err('Invalid password');

  return ok({
    id: user.id,
    name: user.name,
    mobile: user.mobile,
    role: user.role,
    first_login: user.first_login,
  }, 'Login successful');
}
