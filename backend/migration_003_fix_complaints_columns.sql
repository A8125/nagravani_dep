-- Migration to add missing columns to complaints table
-- This fixes the "column 'upvoteCount' does not exist" error

ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS "upvoteCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "priorityScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
