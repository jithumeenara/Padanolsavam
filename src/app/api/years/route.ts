import { NextRequest } from 'next/server';
import pool, { ok, err } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { year_name } = await req.json();
    if (!year_name?.trim()) return err('Year name required');

    const exists = await pool.query('SELECT id FROM years WHERE year_name = $1', [year_name.trim()]);
    if (exists.rows.length) return err('Year already exists');

    const { rows } = await pool.query(
      'INSERT INTO years (year_name) VALUES ($1) RETURNING id',
      [year_name.trim()]
    );
    return ok({ id: rows[0].id }, 'Year added');
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed', 500);
  }
}
