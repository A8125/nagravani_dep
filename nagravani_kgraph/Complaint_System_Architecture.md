---
tags: [architecture, complaints, database, duplicate-detection, submission-flow]
---

# Complaint System Architecture

## Overview

The complaint system uses a **two-table architecture** to group similar citizen submissions while maintaining individual complaint records.

## Two-Table Architecture

| Table | Purpose |
|-------|---------|
| **`problems`** | Groups similar complaints together — the "issue" |
| **`complaints`** | Individual citizen submissions linked to a problem |

### Problems Table

Stores the aggregated issue. Key columns: `id` (UUID), `title`, `category`, `ward`, `summary` (AI-generated), `status`, `severity`, `upvoteCount`, `priorityScore`, `embedding` (768-dim vector), `department_id`, `lat`, `lng`, `address`, `source`.

### Complaints Table

Stores individual submissions. Key columns: `id` (readable format like `CMP-PWD-0042`), `citizen_name`, `aadhaar_hash` (SHA-256), `aadhaar_last4`, `problem_id` (FK), `embedding`, `photoPath`, `source` (web/whatsapp), `whatsapp_number`.

## Complete Submission Flow

```
Citizen submits complaint (POST /api/report)
         ↓
Validate: title, category, description, ward, citizen_name (max 100), aadhaar (12 digits)
         ↓
Generate embedding via Ollama (nomic-embed-text, 768-dim)
  └─ Falls back gracefully if Ollama unavailable (dedup skipped)
         ↓
Upload photo to Supabase Storage (complaint-photos bucket)
  └─ 5 MB limit, supports multipart or photo_url
         ↓
Hash Aadhaar (SHA-256), extract last 4 digits
         ↓
Search problems table for duplicates:
  - Filter: same category + ward + status IN (pending, inProgress)
  - Stage 1: Vector similarity > 0.75 → definite match
  - Stage 2: Vector 0.60-0.75 → use pg_trgm as tiebreaker (≥ 0.5)
  - Candidates: top 5 by cosine distance
         ↓
┌────────┴────────┐
↓                  ↓
MATCH FOUND       NO MATCH
(duplicate)       (new problem)
↓                  ↓
Insert complaint   Generate AI summary from description
  linked to        Insert new problem (upvoteCount=1)
  existing         Insert complaint linked to it
  problem          
Increment          Calculate priorityScore
  upvoteCount
Recalculate
  priorityScore
Regenerate AI
  summary
```

## Priority Score

```js
priorityScore = upvoteCount * 10 + daysSinceCreated * 2
```

Calculated in `backend/routes/complaints.js:53-58`. Used for ordering the feed (highest first).

## Duplicate Detection

Two-stage approach in `backend/routes/complaints.js:74-173`:

1. **Vector similarity** (pgvector) — cosine similarity between embeddings using HNSW index
2. **Text similarity** (pg_trgm) — trigram matching as tiebreaker for borderline cases

This catches both semantically similar complaints and textually similar ones.

## Complaint ID Generation

Format: `CMP-{DEPT_SHORT}-{SEQUENCE}`

Implemented in `backend/lib/generateComplaintId.js`. Uses a `complaint_counters` table to track sequences per department.

## Aadhaar Handling

- Hashed with SHA-256 (never stored raw) — `backend/routes/complaints.js:357`
- Last 4 digits stored for display/verification
- Used for duplicate citizen detection per problem

## Photo Upload

- Supabase Storage bucket: `complaint-photos`
- 5 MB file size limit
- Supports multipart upload (`req.file`) or `photo_url` string
- URL format: `{SUPABASE_URL}/storage/v1/object/public/complaint-photos/{filename}`

## Reverse Geocoding

After submission response is sent, the server fetches an address from OpenStreetMap Nominatim (`backend/routes/complaints.js:236-250`) and updates both `complaints` and `problems` tables asynchronously.

## AI Summary Generation

When a new complaint is merged into an existing problem, all linked complaint descriptions are sent to Ollama (`llama3.2:3b`) with a prompt to generate a single-sentence summary. This is stored in `problems.summary`.

## Feed Query

`GET /api/feed` uses a query with lateral joins (`backend/routes/complaints.js:553-590`):

- `LEFT JOIN LATERAL` for latest photo + all photos
- `LEFT JOIN LATERAL` for comment count
- Filters: category, ward, status
- Order: `priorityScore DESC, createdAt DESC`
- Pagination: `limit` + `offset`

## Department Routing

Complaints are routed to departments via `CATEGORY_TO_DEPT_ID` mapping (`backend/routes/complaints.js:30-38`):

| Category | Department |
|----------|------------|
| road | PWD |
| water | CMC |
| streetlight | CESC |
| garbage | CMC |
| sewage | CMC |
| noise | DHO |
| encroachment | MUDA |

## Related

- [[Nagravani]]
- [[Engagement Features]]
- [[Government Portal]]
- [[AI Features]]
