---
tags: [government, dashboard, auth, official-comments]
---

# Government Portal

## Authentication

Simple client-side authentication via `sessionStorage`:

- **Login page**: `/gov` — `GovLogin.tsx`
- User selects department and enters employee key
- Hardcoded credentials: `CMC2024`, `PWD2024`, `CESC2024`, `MUDA2024`, `DHO2024`
- On success, stores `{ department, loggedInAt }` in `sessionStorage`
- No backend auth middleware — department name sent as header/param in API calls
- Logout clears session and redirects to login

See `app/src/lib/govAuth.ts`.

## Dashboard

Route: `/gov/dashboard` — `GovDashboard.tsx`

### Stats Cards

- Open Cases (pending)
- In Progress
- Resolved This Month
- Avg Resolution Days

### Complaint Table

- Columns: ID, Title, Ward, Category, Priority Score, Citizens Affected, Days Open, Status, Actions
- Sortable by Priority Score or Days Open
- Filterable by Status and Ward
- Aged-pending rows (>7 days in pending) highlighted with amber border

### Status Management

- Dropdown to change status: pending → inProgress → resolved
- `PATCH /api/feed/:id/status` updates both `problems` and linked `complaints` tables
- Sets `resolved_at` timestamp when resolved

### Expanded Panel

Click a row to expand and view:

- **Discussion section**: All comments (citizen + official) for that problem
- **Official Comment form**: Textarea (max 500 chars) to post as department
- **Delete button**: Trash icon on every comment for gov officials

### Comment Deletion

- Gov officials see a trash icon on every comment
- Calls `DELETE /api/feed/:id/comments/:commentId` with `department` header
- State updates immediately via `setCommentsById`
- See [[Engagement Features]] for full comment details

## Related

- [[Nagravani]]
- [[Engagement Features]]
- [[Complaint_System_Architecture]]
