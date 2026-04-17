-- ─────────────────────────────────────────────────────────
--  migration_002_problems_schema.sql
--  Drop old complaints table and create new problems + complaints schema
--  Run against your nagaravaani database:
--    psql -U postgres -d nagaravaani -f migration_002_problems_schema.sql
-- ─────────────────────────────────────────────────────────

-- Drop old table (keep departments and department_embeddings untouched)
DROP TABLE IF EXISTS complaints CASCADE;

-- Individual complaint submitted by a citizen
CREATE TABLE complaints (
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
  severity        VARCHAR(50) DEFAULT 'Medium',
  embedding       vector(768),
  problem_id      VARCHAR(36),  -- FK to problems, set after matching
  department_id   UUID REFERENCES departments(id),
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Aggregated problem (one per unique civic issue per ward)
CREATE TABLE problems (
  id              VARCHAR(36) PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,      -- from first complaint
  category        VARCHAR(100) NOT NULL,
  ward            VARCHAR(100) NOT NULL,
  summary         TEXT,                       -- AI-generated or concatenated from all linked complaint descriptions
  status          VARCHAR(50) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','inProgress','resolved','rejected')),
  severity        VARCHAR(50) DEFAULT 'Medium',
  "upvoteCount"   INTEGER NOT NULL DEFAULT 1, -- starts at 1 (the first complaint)
  "priorityScore" INTEGER NOT NULL DEFAULT 0,
  embedding       vector(768),                -- embedding of first complaint, used for similarity matching
  department_id   UUID REFERENCES departments(id),
  lat             DOUBLE PRECISION,           -- from first complaint
  lng             DOUBLE PRECISION,
  address         TEXT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

-- FK from complaints to problems
ALTER TABLE complaints ADD CONSTRAINT fk_problem
  FOREIGN KEY (problem_id) REFERENCES problems(id);

-- Indexes
CREATE INDEX complaints_problem_idx    ON complaints (problem_id);
CREATE INDEX complaints_category_idx   ON complaints (category);
CREATE INDEX complaints_ward_idx       ON complaints (ward);
CREATE INDEX problems_ward_idx         ON problems (ward);
CREATE INDEX problems_category_idx     ON problems (category);
CREATE INDEX problems_priority_idx     ON problems ("priorityScore" DESC);
CREATE INDEX problems_embedding_hnsw
  ON problems USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Helper function: regenerate problem summary
CREATE OR REPLACE FUNCTION regenerate_problem_summary(p_problem_id VARCHAR(36))
RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE
  complaint_count INTEGER;
  descriptions TEXT;
BEGIN
  SELECT COUNT(*), STRING_AGG(description, ' ' ORDER BY "createdAt" ASC)
  INTO complaint_count, descriptions
  FROM complaints
  WHERE problem_id = p_problem_id;
  
  IF complaint_count = 1 THEN
    RETURN descriptions;
  ELSE
    RETURN complaint_count || ' citizens report: ' || descriptions;
  END IF;
END;
$$;

-- Helper function: calculate priority score
CREATE OR REPLACE FUNCTION calc_priority_score(upvotes INTEGER, created_at TIMESTAMPTZ)
RETURNS INTEGER
LANGUAGE sql IMMUTABLE AS $$
  SELECT upvotes * 10 + EXTRACT(DAY FROM (NOW() - created_at))::INTEGER * 2;
$$;
