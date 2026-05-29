import { NextRequest } from 'next/server';
import pool, { ok, err } from '@/lib/db';

async function ensureTelegramColumns() {
  await pool.query(`
    ALTER TABLE settings
      ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS telegram_enabled BOOLEAN DEFAULT false
  `);
}

export async function GET() {
  try {
    await ensureTelegramColumns();
    const [settingsRes, yearsRes] = await Promise.all([
      pool.query('SELECT default_year, app_name, income_categories, expense_categories, telegram_chat_id, telegram_enabled FROM settings LIMIT 1'),
      pool.query('SELECT id, year_name, is_default FROM years ORDER BY created_at ASC'),
    ]);
    const s = settingsRes.rows[0] || {};
    return ok({
      settings: {
        default_year: s.default_year || '',
        app_name: s.app_name || 'Padanolsavam',
        income_categories: Array.isArray(s.income_categories) ? s.income_categories : [],
        expense_categories: Array.isArray(s.expense_categories) ? s.expense_categories : [],
        telegram_chat_id: s.telegram_chat_id || '',
        telegram_enabled: s.telegram_enabled || false,
      },
      years: yearsRes.rows,
    });
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
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
    if (body.telegram_chat_id !== undefined) {
      updates.push(`telegram_chat_id = $${values.length + 1}`); values.push(body.telegram_chat_id);
    }
    if (body.telegram_enabled !== undefined) {
      updates.push(`telegram_enabled = $${values.length + 1}`); values.push(body.telegram_enabled);
    }

    if (updates.length) {
      updates.push(`updated_at = NOW()`);
      await pool.query(
        `INSERT INTO settings DEFAULT VALUES ON CONFLICT (lock) DO UPDATE SET ${updates.join(', ')}`,
        values
      );
    }
    return ok(null, 'Settings updated');
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed', 500);
  }
}
