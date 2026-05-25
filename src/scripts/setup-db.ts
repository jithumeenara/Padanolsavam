/**
 * Run once to create tables and seed the admin user.
 * Usage:  npx tsx src/scripts/setup-db.ts
 */
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // --- Tables ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        name        TEXT        NOT NULL,
        mobile      TEXT        UNIQUE NOT NULL,
        password    TEXT        NOT NULL,
        role        TEXT        NOT NULL DEFAULT 'user',
        status      TEXT        NOT NULL DEFAULT 'active',
        first_login BOOLEAN     NOT NULL DEFAULT true,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS students (
        id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        student_name TEXT        NOT NULL,
        class        TEXT,
        parent_phone TEXT,
        address      TEXT,
        house_name   TEXT,
        remarks      TEXT,
        photo_url    TEXT,
        added_by     TEXT,
        year         TEXT        NOT NULL,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS income (
        id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        title          TEXT        NOT NULL,
        amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
        category       TEXT,
        payment_method TEXT,
        remarks        TEXT,
        year           TEXT        NOT NULL,
        created_by     TEXT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        title          TEXT        NOT NULL,
        amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
        category       TEXT,
        payment_method TEXT,
        bill_url       TEXT,
        remarks        TEXT,
        year           TEXT        NOT NULL,
        created_by     TEXT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS years (
        id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        year_name  TEXT        UNIQUE NOT NULL,
        is_default BOOLEAN     NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS settings (
        lock               BOOLEAN PRIMARY KEY DEFAULT true,
        CONSTRAINT         settings_one_row CHECK (lock = true),
        default_year       TEXT    NOT NULL DEFAULT '',
        app_name           TEXT    NOT NULL DEFAULT 'Padanolsavam',
        income_categories  JSONB   NOT NULL DEFAULT '[]',
        expense_categories JSONB   NOT NULL DEFAULT '[]',
        updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS photos (
        id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        data       TEXT        NOT NULL,
        mime_type  TEXT        NOT NULL DEFAULT 'image/jpeg',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Indexes for fast queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_students_year ON students(year);
      CREATE INDEX IF NOT EXISTS idx_students_added_by ON students(added_by);
      CREATE INDEX IF NOT EXISTS idx_income_year ON income(year);
      CREATE INDEX IF NOT EXISTS idx_expenses_year ON expenses(year);
    `);

    // Seed settings (single row)
    await client.query(`
      INSERT INTO settings DEFAULT VALUES ON CONFLICT (lock) DO NOTHING;
    `);

    // Seed admin user
    const hash = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users (name, mobile, password, role, status, first_login)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (mobile) DO NOTHING;
    `, ['Admin', '8590551176', hash, 'admin', 'active', false]);

    await client.query('COMMIT');
    console.log('Database setup complete.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Setup failed:', e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
