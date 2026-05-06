---
tags: [architecture, complaints, system, database, duplicate-detection]
---

# Complaint System Architecture

## Overview

The complaint system uses a two-table architecture to group similar citizen submissions while maintaining individual complaint records.

## Two-Table Architecture

| Table | Purpose |
|-------|---------|
| **problems** | Groups similar complaints together (the "issue") |
| **complaints** | Individual citizen submissions (can be merged into a problem) |

## Submission Flow

```
Citizen submits complaint (POST /api/report)
         ↓
Generate embedding via Ollama (nomic-embed-text, 768-dim)
         ↓
Search problems table for duplicates:
  - Vector similarity > 0.75 → definite match
  - Vector 0.60-0.75 → use pg_trgm as tiebreaker
  - Filters: same category + ward + status IN (pending, inProgress)
         ↓
┌────────┴────────┐
↓                 ↓
MATCH FOUND      NO MATCH
(merged)        (new problem)
↓                 ↓
Link to existing  Create new problem
problem           with upvoteCount=1
Upvotes +1        Link complaint to it
Recalculate       Generate AI summary
priorityScore
Regenerate AI
summary
```

## Priority Score Formula

```js
priorityScore = upvoteCount * 10 + daysSinceCreated * 2
```

Calculated in `backend/routes/complaints.js:48-51`.

## Duplicate Detection

The system uses a two-stage approach:

1. **Vector similarity** (`pgvector`) - cosine similarity between embeddings
2. **Text similarity** (`pg_trgm`) - trigram-based matching as tiebreaker

This handles cases where embeddings are similar but text is different, and vice versa.

## Data Model

### Complaints Table
- **id**: Readable format `CMP-PWD-0001`, `CMP-CMC-0042`
- **citizen_name**: Required, max 100 chars
- **aadhaar_hash**: SHA-256 hash (never stored raw)
- **aadhaar_last4**: Last 4 digits for display
- **problem_id**: FK to problems table
- **embedding**: 768-dim vector (nomic-embed-text)

### Problems Table
- **id**: UUID (not readable)
- **summary**: AI-generated summary from all linked complaints
- **upvoteCount**: Aggregated from all merged complaints
- **priorityScore**: Calculated from formula above
- **embedding**: Copy of first complaint's embedding

## Key API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/report` | Submit new complaint (with duplicate detection) |
| `GET /api/feed` | List problems with filters |
| `GET /api/feed/:id` | Get problem + all linked complaints |
| `PATCH /api/feed/:id/upvote` | Add upvote to problem |
| `PATCH /api/feed/:id/status` | Update problem status |
| `GET /api/search` | Semantic search via embeddings |

## Implementation

See `backend/routes/complaints.js` for the full implementation.

## Related
- [[Nagravani]]
