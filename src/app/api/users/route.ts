import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import pool, { ok, err } from '@/lib/db';

export async function GET() {
  const { rows } = await pool.query(
    `SELECT id, name, mobile, role, status, first_login, created_at
     FROM users ORDER BY created_at ASC`
  );
  return ok(rows);
}

export async function POST(req: NextRequest) {
  const { name, mobile, role } = await req.json();
  if (!name || !mobile) return err('Name and mobile required');

  const exists = await pool.query('SELECT id FROM users WHERE mobile = $1', [mobile]);
  if (exists.rows.length) return err('User with this mobile already exists');

  const hash = await bcrypt.hash('password', 10);
  const { rows } = await pool.query(
    `INSERT INTO users (name, mobile, password, role, status, first_login)
     VALUES ($1, $2, $3, $4, 'active', true) RETURNING id`,
    [name.trim(), mobile.trim(), hash, role || 'user']
  );
  return ok({ id: rows[0].id }, 'User added');
}
