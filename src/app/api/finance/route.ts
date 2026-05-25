import { NextRequest } from 'next/server';
import pool, { ok, err } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get('type');
  const year = searchParams.get('year');
  if (!type || (type !== 'income' && type !== 'expenses')) return err('type must be income or expenses');
  if (!year) return err('year is required');

  const { rows } = await pool.query(
    `SELECT * FROM ${type} WHERE year = $1 ORDER BY created_at DESC`,
    [year]
  );
  return ok(rows);
}
