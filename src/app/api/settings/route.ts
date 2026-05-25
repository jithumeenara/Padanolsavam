import { NextRequest } from 'next/server';
import pool, { ok } from '@/lib/db';

export async function GET() {
  const [settingsRes, yearsRes] = await Promise.all([
    pool.query('SELECT default_year, app_name, income_categories, expense_categories FROM settings LIMIT 1'),
    pool.query('SELECT id, year_name, is_default FROM years ORDER BY created_at ASC'),
  ]);

  const s = settingsRes.rows[0] || {};
  return ok({
    settings: {
      default_year: s.default_year || '',
      app_name: s.app_name || 'Padanolsavam',
      income_categories: Array.isArray(s.income_categories) ? s.income_categories : [],
      expense_categories: Array.isArray(s.expense_categories) ? s.expense_categories : [],
    },
    years: yearsRes.rows,
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.default_year !== undefined) {
    updates.push(`default_year = $${values.length + 1}`); values.push(body.default_year);
  }
  if (body.app_name !== undefined) {
    updates.push(`app_name = $${values.length + 1}`); values.push(body.app_name);
  }
  if (body.income_categories !== undefined) {
    updates.push(`income_categories = $${values.length + 1}`);
    values.push(JSON.stringify(body.income_categories));
  }
  if (body.expense_categories !== undefined) {
    updates.push(`expense_categories = $${values.length + 1}`);
    values.push(JSON.stringify(body.expense_categories));
  }

  if (updates.length) {
    updates.push(`updated_at = NOW()`);
    await pool.query(
      `INSERT INTO settings DEFAULT VALUES ON CONFLICT (lock) DO UPDATE SET ${updates.join(', ')}`,
      values
    );
  }
  return ok(null, 'Settings updated');
}
