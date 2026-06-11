---
tags: [testing, api, curl]
---

# Test Commands

## Submit a Complaint

```bash
curl -X POST http://localhost:3000/api/report \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Broken streetlight on MG Road",
    "category": "streetlight",
    "ward": "Gandhi Nagar",
    "description": "The streetlight near MG Road junction has been broken for 3 weeks. Very dark at night, safety risk for pedestrians.",
    "citizen_name": "Ravi Kumar",
    "aadhaar": "123456789012",
    "severity": "high"
  }'
```

## Submit a Duplicate (to test merging)

```bash
curl -X POST http://localhost:3000/api/report \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Streetlight not working near MG Road",
    "category": "streetlight",
    "ward": "Gandhi Nagar",
    "description": "The streetlight at the MG Road junction is completely out. People are struggling to walk at night and there have been minor accidents.",
    "citizen_name": "Anjali Nair",
    "aadhaar": "456789012345",
    "severity": "medium"
  }'
```

## Get Feed

```bash
curl "http://localhost:3000/api/feed?category=streetlight&ward=Gandhi%20Nagar&limit=10"
```

## Get Problem Detail

```bash
curl "http://localhost:3000/api/feed/PROBLEM_ID_HERE"
```

## Get Comments

```bash
curl "http://localhost:3000/api/feed/PROBLEM_ID_HERE/comments"
```

## Post a Comment

```bash
curl -X POST "http://localhost:3000/api/feed/PROBLEM_ID_HERE/comments" \
  -H "Content-Type: application/json" \
  -d '{"author_name": "Test User", "content": "This is a test comment"}'
```

## Delete a Comment (Gov Only)

```bash
curl -X DELETE "http://localhost:3000/api/feed/PROBLEM_ID_HERE/comments/COMMENT_ID_HERE" \
  -H "department: CMC"
```

## Upvote

```bash
curl -X PATCH "http://localhost:3000/api/feed/PROBLEM_ID_HERE/upvote"
```

## Update Status

```bash
curl -X PATCH "http://localhost:3000/api/feed/PROBLEM_ID_HERE/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "inProgress"}'
```

## Semantic Search

```bash
curl "http://localhost:3000/api/search?q=broken+streetlight+dark&threshold=0.6&limit=5"
```

## AI Chatbot

```bash
curl -X POST http://localhost:3000/api/ai/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "How do I report a pothole?", "lang": "en"}'
```

## Translate to Kannada

```bash
curl -X POST http://localhost:3000/api/ai/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "The road is broken"}'
```

## Gov Complaints

```bash
curl "http://localhost:3000/api/gov/complaints?department=CMC"
```

## Garbage Schedule

```bash
curl "http://localhost:3000/api/garbage/schedule/Your%20Ward"
```

## Report Missed Garbage

```bash
curl -X POST http://localhost:3000/api/garbage/missed \
  -H "Content-Type: application/json" \
  -d '{"ward": "Gandhi Nagar", "aadhaar_last4": "9012"}'
```

## Health Check

```bash
curl http://localhost:3000/health
```

## API Index

```bash
curl http://localhost:3000/api
```

## Related

- [[Complaint_System_Architecture]]
- [[Nagravani]]
