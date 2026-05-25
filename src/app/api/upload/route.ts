import { NextRequest } from 'next/server';
import pool, { ok, err } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { data, mimeType } = await req.json();
    if (!data) return err('No file data');

    const { rows } = await pool.query(
      'INSERT INTO photos (data, mime_type) VALUES ($1, $2) RETURNING id',
      [data, mimeType || 'image/jpeg']
    );
    const id = rows[0].id;
    return ok({ url: `/api/photos/${id}`, fileId: id }, 'Uploaded');
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Upload failed', 500);
  }
}
