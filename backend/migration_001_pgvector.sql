-- ─────────────────────────────────────────────────────────
--  migration_001_pgvector.sql  (nagravani schema edition)
--  Run against your nagaravaani database:
--    psql -U postgres -d nagaravaani -f migration_001_pgvector.sql
-- ─────────────────────────────────────────────────────────

-- 1. Extensions ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Departments table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  short          TEXT UNIQUE NOT NULL,
  description    TEXT,
  officer_phone  TEXT,
  email          TEXT,
  color          TEXT,
  icon           TEXT
);

-- 3. Complaints table (matches nagravani schema exactly) ──
--    camelCase columns quoted to match Drizzle ORM convention
CREATE TABLE IF NOT EXISTS complaints (
  id              VARCHAR(36) PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  category        VARCHAR(100) NOT NULL
                    CHECK (category IN ('road','water','streetlight','garbage','sewage','noise','encroachment')),
  description     TEXT NOT NULL,
  ward            VARCHAR(100) NOT NULL,
  "photoPath"     TEXT,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  address         TEXT,
  status          VARCHAR(50) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','inProgress','resolved','rejected')),
  "upvoteCount"   INTEGER NOT NULL DEFAULT 0,
  "priorityScore" INTEGER NOT NULL DEFAULT 0,
  severity        VARCHAR(50) DEFAULT 'Medium',
  embedding       vector(768),
  department_id   UUID REFERENCES departments(id),
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

-- 4. HNSW index for fast ANN search ──────────────────────
CREATE INDEX IF NOT EXISTS complaints_embedding_hnsw
  ON complaints
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 5. Standard indexes ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS complaints_status_idx       ON complaints (status);
CREATE INDEX IF NOT EXISTS complaints_category_idx     ON complaints (category);
CREATE INDEX IF NOT EXISTS complaints_ward_idx         ON complaints (ward);
CREATE INDEX IF NOT EXISTS complaints_priority_idx     ON complaints ("priorityScore" DESC);
CREATE INDEX IF NOT EXISTS complaints_dept_idx         ON complaints (department_id);
-- Composite index for dedup query (category + ward + status)
CREATE INDEX IF NOT EXISTS complaints_dedup_idx
  ON complaints (category, ward, status)
  WHERE status IN ('pending', 'inProgress');

-- 6. Department embeddings (for semantic routing) ─────────
CREATE TABLE IF NOT EXISTS department_embeddings (
  department_id  UUID REFERENCES departments(id) ON DELETE CASCADE,
  label          TEXT NOT NULL,
  embedding      vector(768),
  PRIMARY KEY (department_id, label)
);

CREATE INDEX IF NOT EXISTS dept_embed_hnsw
  ON department_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 8, ef_construction = 32);

-- 7. Seed the 5 Mandya departments ────────────────────────
INSERT INTO departments (id, name, short, description, officer_phone, color, icon) VALUES
  ('4532bd59-eb0a-4c05-bace-9ee210ee0078', 'Public Works Department',        'PWD',  'Roads, bridges, public infrastructure', '08232-225100', '#F97316', '🛣️'),
  ('3737a8b7-3fb2-40e2-a687-534afd04439b', 'City Electric Supply Company',   'CESC', 'Electricity, street lighting',          '1912',         '#EAB308', '⚡'),
  ('11e1918e-7c31-4be6-9b2f-374449e4e0ee', 'City Municipal Council',         'CMC',  'Water, sewage, garbage, drainage',      '08232-224004', '#3B82F6', '💧'),
  ('892f379f-538b-457d-ad3c-d06259edb4cb', 'Mandya Urban Dev Authority',     'MUDA', 'Building plans, zoning, encroachment',  '08232-222100', '#8B5CF6', '🏗️'),
  ('9d6c4f8f-6f4e-4a9f-a9ec-c8d3fe63833b', 'District Health Office',        'DHO',  'Public health, sanitation, disease',    '08232-223000', '#10B981', '🏥')
ON CONFLICT (id) DO NOTHING;

-- 8. Helper function: find similar complaints ─────────────
CREATE OR REPLACE FUNCTION similar_complaints(
  query_embedding  vector(768),
  p_category       TEXT    DEFAULT NULL,
  p_ward           TEXT    DEFAULT NULL,
  match_threshold  FLOAT   DEFAULT 0.85,
  match_count      INTEGER DEFAULT 5
)
RETURNS TABLE (
  id              VARCHAR,
  title           VARCHAR,
  category        VARCHAR,
  ward            VARCHAR,
  status          VARCHAR,
  "upvoteCount"   INTEGER,
  "priorityScore" INTEGER,
  "createdAt"     TIMESTAMPTZ,
  similarity      FLOAT
)
LANGUAGE sql STABLE AS $$
  SELECT
    c.id, c.title, c.category, c.ward, c.status,
    c."upvoteCount", c."priorityScore", c."createdAt",
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM complaints c
  WHERE c.embedding IS NOT NULL
    AND (p_category IS NULL OR c.category = p_category)
    AND (p_ward IS NULL OR c.ward = p_ward)
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;
