// ─────────────────────────────────────────────────────────
//  db.js  —  PostgreSQL + pgvector client
//  Supabase Postgres with pgvector extension
//  Used for complaints (embeddings, semantic search, RAG)
//  Supabase is still used for departments (no change there)
// ─────────────────────────────────────────────────────────

import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    'Missing DATABASE_URL in .env\n' +
    'Example: postgresql://user:password@host:5432/database'
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

// ── Convenience query wrapper ────────────────────────────
export async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

// ── Health check ─────────────────────────────────────────
export async function dbHealthCheck() {
  const { rows } = await query('SELECT NOW() AS now');
  return rows[0].now;
}

export default pool;
