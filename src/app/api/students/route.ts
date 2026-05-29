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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const year = searchParams.get('year');
    const added_by = searchParams.get('added_by');
    if (!year) return err('year is required');

    const values: unknown[] = [year];
    let query = `SELECT id, student_name, class, parent_phone, address, house_name,
                        remarks, photo_url, added_by, year, created_at
                 FROM students WHERE year = $1`;
    if (added_by) { values.push(added_by); query += ` AND added_by = $${values.length}`; }
    query += ` ORDER BY created_at DESC`;

    const { rows } = await pool.query(query, values);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.student_name?.trim()) return err('Student name required');
    if (!body.year) return err('Year required');

    const { rows } = await pool.query(
      `INSERT INTO students (student_name, class, parent_phone, address, house_name, remarks, photo_url, added_by, year)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [body.student_name, body.class || '', body.parent_phone || '', body.address || '',
       body.house_name || '', body.remarks || '', body.photo_url || '', body.added_by || '', body.year]
    );

    // Build absolute photo URL so Telegram can fetch it
    const host = req.headers.get('host') || '';
    const protocol = host.startsWith('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    const absolutePhoto = body.photo_url
      ? (body.photo_url.startsWith('/') ? `${baseUrl}${body.photo_url}` : body.photo_url)
      : '';

    // Fire-and-forget Telegram notification
    getTelegramConfig().then(({ chat_id, enabled }) => {
      if (!enabled || !chat_id) return;
      const caption = [
        `🎓 <b>New Student Added</b>`,
        ``,
        `👤 <b>Name:</b> ${body.student_name}`,
        `📚 <b>Class:</b> ${body.class || '—'}`,
        `📞 <b>Parent Phone:</b> ${body.parent_phone || '—'}`,
        `🏠 <b>House Name:</b> ${body.house_name || '—'}`,
        `📍 <b>Address:</b> ${body.address || '—'}`,
        body.remarks ? `📝 <b>Remarks:</b> ${body.remarks}` : null,
        `👤 <b>Added By:</b> ${body.added_by_name || body.added_by || '—'}`,
        `🗓 <b>Year:</b> ${body.year}`,
      ].filter(Boolean).join('\n');

      if (absolutePhoto) {
        sendTelegramPhoto(chat_id, absolutePhoto, caption);
      } else {
        sendTelegramMessage(chat_id, caption);
      }
    });

    return ok({ id: rows[0].id }, 'Student added');
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed', 500);
  }
}
