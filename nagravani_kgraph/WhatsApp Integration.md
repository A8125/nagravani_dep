---
tags: [whatsapp, twilio, messaging, chatbot]
---

# WhatsApp Integration

## Overview

Citizens can report complaints via WhatsApp using a guided state-machine flow. Powered by Twilio.

## Architecture

- **Twilio webhook** → `POST /api/whatsapp/webhook` → `backend/routes/whatsapp.js`
- State machine stored in-memory (`Map` keyed by phone number)
- Uses the same Supabase Storage and PostgreSQL backend as the web flow

## Conversation Flow

```
User sends "Hi" or "Start" or "Report"
         ↓
Step 1: TITLE — Enter complaint title
         ↓
Step 2: CATEGORY — Choose from numbered list:
         1. Road  2. Water  3. Street Light
         4. Garbage  5. Sewage  6. Noise  7. Encroachment
         ↓
Step 3: DESCRIPTION — Describe the problem
         ↓
Step 4: WARD — Enter ward name (validated against DB)
         ↓
Step 5: SEVERITY — Choose: 1. Low  2. Medium  3. High  4. Critical
         ↓
Step 6: NAME — Enter your name
         ↓
Step 7: AADHAAR — Enter last 4 digits of Aadhaar
         ↓
Step 8: PHOTO — Send a photo (optional, reply "skip")
         ↓
         Complaint submitted via /api/report
         User receives complaint ID confirmation
```

## Implementation

- State machine in `backend/routes/whatsapp.js:34-48`
- Session data: `{ from, step, data: { title, category, description, ward, severity, citizen_name, aadhaar_last4 }, wards[] }`
- Restart commands: `hi`, `hello`, `start`, `report` — resets session
- Ward validation against `wards` table (falls back to free-text if DB unavailable)
- Photo handling via Supabase Storage (same as web flow)
- Submits via the same `POST /api/report` path used by the web frontend

## Session Management

- Sessions stored in `Map` (`sessions` in whatsapp.js)
- `resetSession()` clears and restarts
- Timeout/cleanup is not implemented (sessions persist until server restart)

## Related

- [[Nagravani]]
- [[Complaint_System_Architecture]]
- [[AI Features]]
