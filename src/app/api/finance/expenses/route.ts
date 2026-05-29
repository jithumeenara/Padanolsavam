import { NextRequest } from 'next/server';
import pool, { ok, err } from '@/lib/db';
import { sendTelegramMessage, sendTelegramPhoto } from '@/lib/telegram';

async function getTelegramConfig(): Promise<{ chat_id: string; enabled: boolean }> {
  try {
    const { rows } = await pool.query('SELECT telegram_chat_id, telegram_enabled FROM settings LIMIT 1');
    const s = rows[0] || {};
    return { chat_id: s.telegram_chat_id || '', enabled: !!s.telegram_enabled };
  } catch { return { chat_id: '', enabled: false }; }
}

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

    const host = req.headers.get('host') || '';
    const protocol = host.startsWith('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    const absoluteBill = body.bill_url
      ? (body.bill_url.startsWith('/') ? `${baseUrl}${body.bill_url}` : body.bill_url)
      : '';

    getTelegramConfig().then(({ chat_id, enabled }) => {
      if (!enabled || !chat_id) return;
      const caption = [
        `💸 <b>Expense Added</b>`,
        ``,
        `📋 <b>Title:</b> ${body.title}`,
        `💵 <b>Amount:</b> ₹${Number(body.amount).toLocaleString('en-IN')}`,
        body.category ? `🏷 <b>Category:</b> ${body.category}` : null,
        body.payment_method ? `💳 <b>Payment:</b> ${body.payment_method}` : null,
        body.remarks ? `📝 <b>Remarks:</b> ${body.remarks}` : null,
        `👤 <b>Added By:</b> ${body.added_by_name || body.created_by || '—'}`,
        `🗓 <b>Year:</b> ${body.year}`,
      ].filter(Boolean).join('\n');

      if (absoluteBill) {
        sendTelegramPhoto(chat_id, absoluteBill, caption);
      } else {
        sendTelegramMessage(chat_id, caption);
      }
    });

    return ok({ id: rows[0].id }, 'Expense added');
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed', 500);
  }
}
