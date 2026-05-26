import { NextRequest } from 'next/server';
import pool, { ok, err } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const type = req.nextUrl.searchParams.get('type');
    if (!type || (type !== 'income' && type !== 'expenses')) return err('type required');

    const { rows } = await pool.query(`SELECT * FROM ${type} WHERE id = $1`, [id]);
    if (!rows.length) return err('Not found', 404);
    return ok(rows[0]);
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed', 500);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();
    const type = body.type as string;
    if (!type || (type !== 'income' && type !== 'expenses')) return err('type required');

    const allowedFields = type === 'income'
      ? ['title', 'amount', 'category', 'payment_method', 'remarks']
      : ['title', 'amount', 'category', 'payment_method', 'bill_url', 'remarks'];

    const updates: string[] = [];
    const values: unknown[] = [];
    allowedFields.forEach(f => {
      if (body[f] !== undefined) {
        updates.push(`${f} = $${values.length + 1}`);
        values.push(f === 'amount' ? Number(body[f]) : body[f]);
      }
    });
    if (body.updated_by !== undefined) {
      updates.push(`updated_by = $${values.length + 1}`); values.push(body.updated_by);
    }
    updates.push(`updated_at = NOW()`);
    values.push(id);

    await pool.query(`UPDATE ${type} SET ${updates.join(', ')} WHERE id = $${values.length}`, values);
    return ok(null, 'Updated');
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const type = req.nextUrl.searchParams.get('type');
    if (!type || (type !== 'income' && type !== 'expenses')) return err('type required');

    await pool.query(`DELETE FROM ${type} WHERE id = $1`, [id]);
    return ok(null, 'Deleted');
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed', 500);
  }
}
