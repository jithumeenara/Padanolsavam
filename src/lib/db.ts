import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    // Aiven uses a self-signed CA — disable verification.
    // Connection is still encrypted; only certificate chain validation is skipped.
    ssl: { rejectUnauthorized: false },
    max: 5,                      // stay well under Aiven's 20-connection limit
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

// Reuse pool across hot reloads in development to avoid exhausting connections
const pool = globalThis._pgPool ?? createPool();
if (process.env.NODE_ENV !== 'production') globalThis._pgPool = pool;

export default pool;

export function ok<T>(data: T, message = 'OK') {
  return Response.json({ success: true, data, message });
}

export function err(message: string, status = 400) {
  return Response.json({ success: false, data: null, message }, { status });
}
