-- Migration to enable pg_trgm extension for fuzzy text matching
-- This enables similarity() and word_similarity() functions for duplicate detection

CREATE EXTENSION IF NOT EXISTS pg_trgm;