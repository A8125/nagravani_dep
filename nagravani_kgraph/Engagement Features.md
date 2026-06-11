---
tags: [features, engagement, comments, upvoting, sharing]
---

# Engagement Features

## Upvoting ("Add Me Too")

- Button on each feed card: `PATCH /api/feed/:id/upvote`
- Increments `upvoteCount` on the problem
- Recalculates `priorityScore = upvoteCount * 10 + days * 2`
- Optimistic UI update on success
- Implemented in `backend/routes/complaints.js:827-854` and `CommunityFeed.tsx:573-593`

## Comments System

### Citizen Comments (Feed Page)

- Displayed in a `CommentSection` component inside the problem detail dialog/drawer
- Requires `author_name` (max 100) and `content` (max 500 chars)
- Optional `aadhaar_last4` for verification
- Empty state: "No comments yet. Start the thread."
- Comment count badge on each feed card (from lateral join query)

### Official Comments

- Posted from the Government Portal dashboard
- Same API (`POST /api/feed/:id/comments`) with `is_official: true`
- Displayed with dark background (`bg-gray-900`), "Official Response" label, and `ShieldCheck` icon
- `author_name` is auto-set to `"{Department} Official"` (e.g., "PWD Official")

### Comment Deletion

- Only available on the Government Portal (`/gov/dashboard`)
- Gov official clicks trash icon on any comment
- `DELETE /api/feed/:id/comments/:commentId` — validates `department` header against known departments
- Comment count on feed cards is decremented accordingly
- Implemented in `backend/routes/complaints.js:713-734` and `GovDashboard.tsx`

### Data Model

```sql
problem_comments (
  id            SERIAL PRIMARY KEY,
  problem_id    VARCHAR(36) NOT NULL REFERENCES problems(id),
  author_name   VARCHAR(100) NOT NULL,
  content       TEXT NOT NULL,
  is_official   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Share Feature

- Share button on each feed card
- On mobile: uses `navigator.share()` (native share sheet)
- On desktop: copies URL to clipboard with `navigator.clipboard.writeText()`
- URL format: `/feed?issue={problemId}` — opens the issue detail directly
- Toast notification: "Link copied!" / "Could not share link"
- Implemented in `CommunityFeed.tsx:595-614`

## Related

- [[Nagravani]]
- [[Complaint_System_Architecture]]
- [[Government Portal]]
