---
tags: [database, postgresql, queries, reference]
---

# Database Queries

Quick-reference SQL queries for debugging and inspection.

## Tables

### Complaints

```sql
SELECT id, title, ward, citizen_name, aadhaar_last4, problem_id, source
FROM complaints
ORDER BY "createdAt" DESC
LIMIT 20;
```

### Problems

```sql
SELECT id, title, category, ward, "upvoteCount", "priorityScore", status, source
FROM problems
ORDER BY "priorityScore" DESC
LIMIT 20;
```

### Comments

```sql
SELECT pc.id, pc.problem_id, pc.author_name, pc.content, pc.is_official, pc.created_at
FROM problem_comments pc
ORDER BY pc.created_at DESC
LIMIT 20;
```

### Complaint Counters

```sql
SELECT * FROM complaint_counters;
```

### Garbage Missed Reports

```sql
SELECT * FROM garbage_missed_reports
ORDER BY created_at DESC
LIMIT 20;
```

### Garbage Schedules

```sql
SELECT ward, collection_days, time_slot, vehicle_number
FROM garbage_schedules
ORDER BY ward;
```

### Auto-Complaints

```sql
SELECT id, title, ward, status, "upvoteCount", "createdAt"
FROM problems
WHERE source = 'auto'
ORDER BY "createdAt" DESC;
```

### Departments

```sql
SELECT * FROM departments;
```

## Clear Tables (Dev Only)

```sql
TRUNCATE complaints, problems CASCADE;
UPDATE complaint_counters SET number_of_complaints = 0;
```

## Related

- [[Nagravani]]
- [[Complaint_System_Architecture]]
