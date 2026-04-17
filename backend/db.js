// ─────────────────────────────────────────────────────────
//  db.js  —  PostgreSQL + pgvector client
//  Supabase Postgres with pgvector extension
//  Used for complaints (embeddings, semantic search, RAG)
//  Supabase is still used for departments (no change there)
// ─────────────────────────────────────────────────────────

import pg from 'pg';
import 'dotenv/config';

console.log('[DB DEBUG] DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 30));

const { Pool } = pg;

// Support Railway's default DATABASE_URL var
const dbUrl = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING;

// Validate we have a real connection string (not empty or placeholder)
const isValidUrl = dbUrl && dbUrl.startsWith('postgresql://') && dbUrl.includes('@');

if (!isValidUrl) {
  console.error('[DB] DATABASE_URL is missing or invalid. Value received:', dbUrl ? dbUrl.substring(0, 20) + '...' : 'undefined/empty');
  const relevantVars = Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('PG') || k.includes('POSTGRES'));
  console.error('[DB] Available env vars:', relevantVars.join(', '));
  throw new Error(
    'Missing DATABASE_URL in environment. Set in Railway: postgresql://user:password@host:5432/database'
  );
}

export const pool = new Pool({
  connectionString: dbUrl,
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
