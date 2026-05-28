import { Pool, type QueryResult, type QueryResultRow } from "pg";
import bcrypt from "bcryptjs";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __dbInited: boolean | undefined;
}

function getPool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurado");
  if (!global.__pgPool) {
    global.__pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return global.__pgPool;
}

export async function ensureDbInit() {
  if (globalThis.__dbInited) return;
  const pool = getPool();
  const client = await pool.connect();
  try {
    // tabela base (mínima)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin','user')),
        status TEXT NOT NULL CHECK (status IN ('active','blocked')) DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_login_at TIMESTAMPTZ
      );
    `);

    // colunas adicionais (trial/sub)
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS access_until TIMESTAMPTZ`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS access_type TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_used BOOLEAN NOT NULL DEFAULT FALSE`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS current_session_id TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS current_session_issued_at TIMESTAMPTZ`);

    // seed admin se não existir
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    const { rows } = await client.query(`SELECT COUNT(*)::int AS c FROM users WHERE role='admin'`);
    const c = rows[0]?.c ?? 0;
    if (c === 0) {
      const hash = bcrypt.hashSync(adminPassword, 10);
      await client.query(
        `INSERT INTO users (name, username, password_hash, role, status)
         VALUES ($1,$2,$3,'admin','active')`,
        ["Administrador", adminUsername, hash]
      );
    }

    // tabela de estratégias
    await client.query(`
      CREATE TABLE IF NOT EXISTS strategies (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        nums INTEGER[] NOT NULL,
        color TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    globalThis.__dbInited = true;
  } finally {
    client.release();
  }
}

export async function q<T extends QueryResultRow = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
  const pool = getPool();
  return pool.query<T>(text, params);
}
