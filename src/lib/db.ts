import { Pool } from 'pg';

// Aiven uses a CA chain that Node.js doesn't bundle.
// The connection is still TLS-encrypted; we only skip chain verification.
if (typeof process !== 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

const pool = globalThis._pgPool ?? createPool();
if (process.env.NODE_ENV !== 'production') globalThis._pgPool = pool;

export default pool;

export function ok<T>(data: T, message = 'OK') {
  return Response.json({ success: true, data, message });
}

export function err(message: string, status = 400) {
  return Response.json({ success: false, data: null, message }, { status });
}

