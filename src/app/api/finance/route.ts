import { NextRequest } from 'next/server';
import pool, { ok, err } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const type = searchParams.get('type');
    const year = searchParams.get('year');
    if (!type || (type !== 'income' && type !== 'expenses')) return err('type must be income or expenses');
    if (!year) return err('year is required');

    // Join with users to resolve added_by_name and updated_by_name
    const { rows } = await pool.query(
      `SELECT f.*,
              u1.name AS added_by_name,
              u2.name AS updated_by_name
       FROM ${type} f
       LEFT JOIN users u1 ON f.created_by = u1.id::text
       LEFT JOIN users u2 ON f.updated_by = u2.id::text
       WHERE f.year = $1
       ORDER BY f.created_at DESC`,
      [year]
    );
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed', 500);
  }
}
