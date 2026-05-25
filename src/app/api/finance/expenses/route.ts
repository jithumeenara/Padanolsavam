import { NextRequest } from 'next/server';
import pool, { ok, err } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title?.trim()) return err('Title required');
    if (!body.amount || Number(body.amount) <= 0) return err('Valid amount required');
    if (!body.year) return err('Year required');

    const { rows } = await pool.query(
      `INSERT INTO expenses (title, amount, category, payment_method, bill_url, remarks, year, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [body.title, Number(body.amount), body.category || '', body.payment_method || '',
       body.bill_url || '', body.remarks || '', body.year, body.created_by || '']
    );
    return ok({ id: rows[0].id }, 'Expense added');
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed', 500);
  }
}
