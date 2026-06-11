---
tags: [garbage, waste-management, auto-complaint, schedules]
---

# Garbage Management

## Overview

A dedicated garbage tracking system with schedules, missed collection reporting, and automatic complaint generation.

## Frontend

Route: `/garbage` — `GarbageTracker.tsx`

Features:
- Ward selector to view garbage schedule
- Collection days, time slot, vehicle number display
- Report missed collection (requires Aadhaar last 4 digits)
- Today's missed count badge
- 28-day missed collection history chart (Recharts)
- Auto-complaint status indicator

## API Endpoints

All in `backend/routes/garbage.js`.

### GET /api/garbage/schedules

Returns all garbage collection schedules, grouped by ward.

### GET /api/garbage/schedule/:ward

Returns schedule for a specific ward: `collection_days`, `time_slot`, `vehicle_number`, `updated_at`.

### GET /api/garbage/missed/:ward

Returns today's missed collection report count for a ward.

### POST /api/garbage/missed

Reports a missed collection. Requires `ward` and `aadhaar_last4`. Uses `ON CONFLICT DO NOTHING` to prevent duplicate reports from the same citizen.

If count reaches **5 or more**, an automatic complaint is created:

```sql
INSERT INTO problems (id, title, category, ward, summary, status, "upvoteCount", "priorityScore", department_id, address, source)
VALUES ($1, $2, 'garbage', $3, $4, 'pending', $5, $6, $7, $3, 'auto')
```

Auto-complaints have `source = 'auto'` and are tracked separately. Only one auto-complaint per ward per day is created.

### GET /api/garbage/history/:ward

Returns the last 28 days of missed collection counts, grouped by date.

### GET /api/garbage/autocomplaint/:ward

Returns the latest auto-generated complaint for the ward, or null if none exists.

## Database Tables

- `garbage_schedules` — Ward collection schedules
- `garbage_missed_reports` — Missed collection reports with `ward`, `reported_date`, `aadhaar_last4`
- `garbage_trucks` — Truck names/IDs (used for schedule display)
- `problems` with `source = 'auto'` — Auto-generated complaints

## Related

- [[Nagravani]]
- [[Complaint_System_Architecture]]
