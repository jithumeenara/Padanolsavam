import { NextRequest } from 'next/server';
import pool, { ok, err } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const year = searchParams.get('year');
  const added_by = searchParams.get('added_by');
  if (!year) return err('year is required');

  const values: unknown[] = [year];
  let query = `SELECT id, student_name, class, parent_phone, address, house_name, remarks,
                      photo_url, added_by, year, created_at
               FROM students WHERE year = $1`;
  if (added_by) { values.push(added_by); query += ` AND added_by = $${values.length}`; }
  query += ` ORDER BY created_at DESC`;

  const { rows } = await pool.query(query, values);
  return ok(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.student_name?.trim()) return err('Student name required');
  if (!body.year) return err('Year required');

  const { rows } = await pool.query(
    `INSERT INTO students (student_name, class, parent_phone, address, house_name, remarks, photo_url, added_by, year)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [body.student_name, body.class || '', body.parent_phone || '', body.address || '',
     body.house_name || '', body.remarks || '', body.photo_url || '', body.added_by || '', body.year]
  );
  return ok({ id: rows[0].id }, 'Student added');
}
