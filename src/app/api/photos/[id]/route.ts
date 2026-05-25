import { NextRequest } from 'next/server';
import pool from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { rows } = await pool.query('SELECT data, mime_type FROM photos WHERE id = $1', [id]);
  if (!rows.length) return new Response('Not found', { status: 404 });

  const buf = Buffer.from(rows[0].data, 'base64');
  return new Response(buf, {
    headers: {
      'Content-Type': rows[0].mime_type,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
