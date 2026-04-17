# Complaint Priority Algorithm - Implementation Questions

## Overview

This document captures the key questions and decisions needed before implementing the complaint priority algorithm with embedding-based duplicate detection.

**Priority Score Formula:**
```
priorityScore = upvoteCount * 10 + daysSinceCreated * 2
```

**Core Workflow:**
1. User submits complaint → Generate embedding
2. Compare against open complaints in same category + ward
3. If similarity > 0.85 → Mark as duplicate, increment upvote, recalculate priority
4. If similarity < 0.85 → Create new complaint with embedding

---

## Open Questions

### 1. Fine-tuned Local Model

**Status:** Pending decision

The user mentioned using a fine-tuned local model for generating embeddings instead of a pre-trained model like `all-MiniLM-L6-v2`.

**Questions to resolve:**

- [ ] **Where is the model located?**
  - Local file path (e.g., `/models/complaint-embedder/`)
  - HuggingFace repository name
  - Private model repository (requires auth)

- [ ] **What format is the model in?**
  - ONNX (optimal for transformers.js)
  - PyTorch (.pt/.pth files)
  - TensorFlow SavedModel
  - Other format

- [ ] **Is the model ONNX Runtime compatible?**
  - If not, we may need conversion tools (optimum-cli, onnxruntime-tools)
  - Or use a different inference engine

- [ ] **What are the embedding dimensions?**
  - 384 (like MiniLM)
  - 768 (like BERT-base)
  - 1024+ (larger models)
  - **Required for:** Database schema vector column size

- [ ] **What tokenizer does the model use?**
  - Same tokenizer needed for preprocessing
  - Max sequence length?

**Recommendation:** If model is in PyTorch format, use `optimum-cli` to convert to ONNX for browser/Node.js compatibility.

---

### 2. Upvote Mechanism

**Current understanding:** Two ways upvotes are added:
1. **Implicit upvote**: Duplicate complaint submission (similarity > 0.85)
2. **Explicit upvote**: User clicks "upvote" button on existing complaint

**Questions to resolve:**

- [ ] **Should we prevent duplicate upvotes from the same user?**
  - If yes: How to identify users? (no auth system currently)
  - Options:
    - IP address tracking (problematic with NAT)
    - Device fingerprinting
    - Browser localStorage (easily bypassed)
    - Anonymous but rate-limited by IP
  - **Note:** Current system has no user authentication

- [ ] **Should there be a limit on upvotes per complaint?**
  - No limit (purely community-driven)
  - Soft cap (diminishing returns on priority score)
  - Hard cap (max upvotes per complaint)

- [ ] **Should we track WHO upvoted (for transparency)?**
  - Create separate `upvotes` table with timestamps
  - Or just store count (simpler, but less auditable)

---

### 3. Priority Recalculation Timing

The formula includes `daysSinceCreated * 2`, which changes every day.

**Questions to resolve:**

- [ ] **Should priority scores be recalculated automatically as complaints age?**
  - **Option A:** Daily cron job recalculates ALL active complaints
    - Pros: Priority reflects actual age accurately
    - Cons: DB write overhead daily, need job scheduler
  - **Option B:** Recalculate only on upvote events
    - Pros: Simpler, fewer writes
    - Cons: A 30-day-old complaint with no upvotes has same priority as new complaint
  - **Option C:** Calculate priority on-the-fly when fetching
    - Pros: Always accurate, no stored score needed
    - Cons: Slower queries (can't index on calculated value easily)

**Recommended approach:** Option A (daily cron) + recalculate on upvote events

---

### 4. Duplicate Detection UX

When similarity > 0.85, the backend returns `isDuplicate: true`.

**Questions to resolve:**

- [ ] **What should the frontend show when a duplicate is detected?**
  - Simple message: "This complaint already exists (ID: XXX)"
  - Detailed view: Show original complaint title, description, status
  - Redirect: Automatically navigate to original complaint page
  - Confirmation: "Did you mean this complaint? [Yes/No]" (allows override)

- [ ] **Should the user be able to force-submit anyway?**
  - Yes: Add "Submit anyway" button (edge cases, slight differences)
  - No: Strict duplicate prevention

- [ ] **Should the user see the original complaint's current status?**
  - Yes: Helps user understand if issue is being addressed
  - No: Simpler, just acknowledge the duplicate

---

### 5. Similarity Threshold & Matching Logic

**Current threshold:** 0.85 cosine similarity

**Questions to resolve:**

- [ ] **Is 0.85 the right threshold?**
  - Too high: Miss valid duplicates
  - Too low: False positives
  - Should we A/B test or tune based on feedback?

- [ ] **Should matching be restricted by category + ward only?**
  - Current: Same category + same ward
  - Alternative: Cross-category matching (e.g., "water" and "sewage" might overlap)
  - Alternative: Cross-ward matching (nearby wards might have similar issues)

- [ ] **What statuses should be checked for duplicates?**
  - Current: Only "pending" complaints
  - Should "in_progress" also be checked?
  - Should "resolved" complaints be excluded from matching?

---

### 6. Database & Infrastructure

**Questions to resolve:**

- [ ] **Can we enable pgvector extension in PostgreSQL?**
  - Required for vector similarity search
  - Alternative: Store embeddings as JSONB and calculate cosine similarity in application code (slower)

- [ ] **Should we store embedding generation model version?**
  - If model is updated later, embeddings might not be comparable
  - Add `embeddingModel` column to track which model generated each embedding?

- [ ] **Index strategy for vector search:**
  - ivfflat (approximate, faster, good for <1M vectors)
  - hnsw (more accurate, slightly slower, better for >1M vectors)
  - Exact search (brute force, slowest, most accurate)

---

### 7. Priority Score Visibility

**Questions to resolve:**

- [ ] **Should priority scores be visible to end users?**
  - Yes: Show "Priority: High/Medium/Low" badge on complaints
  - No: Internal only, users see just upvote count

- [ ] **Should complaints be sorted by priority by default?**
  - Yes: High priority first (might feel overwhelming)
  - Alternative: Sort by recency, but show priority indicator
  - Alternative: Let users choose sort (recency, priority, upvotes)

---

### 8. Performance Considerations

**Questions to resolve:**

- [ ] **How many open complaints per category+ward?**
  - If 100s: Brute force similarity comparison is fine
  - If 1000s+: Need vector index (pgvector ivfflat/hnsw)
  - If 10000s+: Consider dedicated vector DB (Pinecone, Weaviate, Qdrant)

- [ ] **Embedding generation time:**
  - Local model: ~50-200ms per complaint (depending on hardware)
  - Is this acceptable for user wait time?
  - Should we make complaint submission async (queue-based)?

- [ ] **Should we batch-process embeddings?**
  - Store complaint first, generate embedding in background
  - Risk: Brief window where duplicate might not be detected

---

### 9. Edge Cases

**Questions to resolve:**

- [ ] **What if embedding generation fails?**
  - Reject complaint (hard fail)
  - Create complaint without embedding (no duplicate detection for this one)
  - Retry mechanism?

- [ ] **What if database has no pgvector extension?**
  - Fail deployment (hard requirement)
  - Degrade to no duplicate detection (soft fallback)

- [ ] **What about very short complaints?**
  - "Road broken" vs "Broken road" (high similarity, valid duplicate)
  - "Road" vs "Water" (low similarity, different issues)
  - Should there be a minimum text length for embedding generation?

---

## Decision Log

| Question | Decision | Date | Rationale |
|----------|----------|------|-----------|
| Model location | TBD | | |
| Embedding dimensions | TBD | | |
| User upvote tracking | TBD | | |
| Priority recalculation | TBD | | |
| Duplicate UX | TBD | | |
| Similarity threshold | 0.85 | Initial | Can tune later |
| pgvector requirement | TBD | | |
| Score visibility | TBD | | |

---

## Implementation Blockers

These must be resolved before implementation can proceed:

1. **Model specification** - Need to know embedding dimensions for DB schema
2. **PostgreSQL pgvector** - Confirm if extension can be enabled
3. **Upvote deduplication** - Decide if/how to prevent duplicate upvotes

---

## Related Documents

- `complaint_priority.txt` - Original algorithm specification
- `basic implementation.txt` - Basic implementation notes

---

*Last updated: 2025-04-06*
