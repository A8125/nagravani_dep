---
tags: [project, overview, hub]
---

# NagaraVaani

NagaraVaani is a **citizen complaint and civic issue reporting platform** for **Mandya, Karnataka, India**. Residents report problems (roads, water, electricity, garbage, sewage, noise, encroachment) and track them through government departments until resolution.

## Directory Structure

```
nagravani_dep/
├── app/                     # Frontend (React 19 + TypeScript + Vite + Tailwind)
│   ├── src/
│   │   ├── components/      # Shared UI components (button, input, dialog, etc.)
│   │   ├── context/         # AppContext (language toggle)
│   │   ├── hooks/           # Custom hooks (use-mobile)
│   │   ├── lib/             # API client, govAuth, supabase client
│   │   ├── pages/           # Page components
│   │   │   └── gov/         # Government portal pages (login, dashboard)
│   │   ├── sections/        # Landing page sections
│   │   ├── App.tsx          # Router + shell
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                 # Backend (Node.js + Express + PostgreSQL)
│   ├── routes/
│   │   ├── complaints.js    # Report, feed, comments, gov complaints, upvote, status
│   │   ├── ai.js            # RAG chatbot, translation, FAQ, similar complaints
│   │   ├── departments.js   # Department listing + stats
│   │   ├── garbage.js       # Garbage schedules, missed reports, auto-complaints
│   │   ├── users.js         # User registration, dashboard, notifications
│   │   ├── stats.js         # City-wide stats, ward stats
│   │   └── whatsapp.js      # Twilio WhatsApp bot state machine
│   ├── ai.js                # LLM helpers (ollamaChat, dispatchDepartment, classifyCategory, etc.)
│   ├── db.js                # PostgreSQL connection pool
│   ├── embeddings.js        # nomic-embed-text embedding service
│   ├── server.js            # Express server setup + route mounting
│   ├── migration_*.sql      # Database migrations
│   ├── seed.js              # Seed script
│   └── package.json
│
├── nagravani_kgraph/        # Obsidian vault (this)
└── README.md
```

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19 + TypeScript, Vite, Tailwind CSS, Framer Motion, React-Leaflet, Recharts, Lucide Icons, Radix UI |
| **Backend** | Node.js + Express, PostgreSQL + pgvector, Twilio |
| **AI/ML** | Ollama (llama3.2:3b for chat), nomic-embed-text (768-dim embeddings) |
| **Cloud** | Supabase (photo storage + hosted Postgres) |

## Features Overview

| Feature | Description | Doc |
|---------|-------------|-----|
| Complaint Reporting | Photo, GPS, category, ward, severity, Aadhaar verification | [[Complaint_System_Architecture]] |
| Smart Deduplication | AI embeddings detect duplicates, merge complaints | [[Complaint_System_Architecture]] |
| Community Feed | Public feed filterable by category/ward/status/department | [[Complaint_System_Architecture]] |
| Comments | Citizen discussion + official responses with shield badge | [[Engagement Features]] |
| Upvoting | "Add Me Too" button with priority score recalculation | [[Engagement Features]] |
| Government Portal | Department login, complaint table, status management | [[Government Portal]] |
| Official Comments | Gov officials post verified responses with department name | [[Government Portal]] |
| Comment Deletion | Gov officials can delete comments from dashboard | [[Government Portal]] |
| AI Help Desk | RAG-powered chatbot for citizen questions | [[AI Features]] |
| Semantic Search | Vector-similarity search across complaints | [[AI Features]] |
| Translation | English → Kannada translation | [[AI Features]] |
| Garbage Tracking | Schedules, missed reports, auto-complaint generation | [[Garbage Management]] |
| WhatsApp Integration | Report complaints via WhatsApp with guided flow | [[WhatsApp Integration]] |
| Interactive Map | Leaflet-based problem map | [[Frontend Architecture]] |
| Department Pages | Public department directory with stats | [[Frontend Architecture]] |
| User Dashboard | Citizen profile, complaint history, notifications | [[Frontend Architecture]] |
| Share Feature | One-tap share / clipboard link to specific issue | [[Engagement Features]] |
| Photo Upload | Supabase Storage for complaint photos | [[Complaint_System_Architecture]] |
| Priority Scoring | upvoteCount × 10 + days × 2 | [[Complaint_System_Architecture]] |
| Complaint ID | Human-readable format (CMP-DEPT-NNNN) | [[Complaint_System_Architecture]] |

## API Index

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/report` | Submit complaint (auto-deduplicate) |
| `GET` | `/api/feed` | List problems with filters |
| `GET` | `/api/feed/:id` | Problem detail + linked complaints |
| `PATCH` | `/api/feed/:id/upvote` | Upvote a problem |
| `PATCH` | `/api/feed/:id/status` | Update problem status |
| `GET` | `/api/feed/:id/comments` | Get comments for a problem |
| `POST` | `/api/feed/:id/comments` | Add comment |
| `DELETE` | `/api/feed/:id/comments/:commentId` | Delete comment (gov only) |
| `GET` | `/api/search` | Semantic search |
| `GET` | `/api/gov/complaints` | Gov dashboard complaints |
| `GET` | `/api/departments` | List departments |
| `GET` | `/api/departments/:id` | Department detail |
| `GET` | `/api/departments/stats` | Per-department stats |
| `GET` | `/api/stats` | City-wide stats |
| `GET` | `/api/stats/wards` | Per-ward stats |
| `POST` | `/api/ai/ask` | RAG chatbot query |
| `GET` | `/api/ai/similar` | Semantic similarity search |
| `POST` | `/api/ai/translate` | English → Kannada |
| `GET` | `/api/ai/faq` | FAQ list |
| `POST` | `/api/users/register` | Register citizen |
| `GET` | `/api/users/:id` | User dashboard |
| `GET` | `/api/users/:id/notifications` | User notifications |
| `GET` | `/api/garbage/schedules` | All garbage schedules |
| `GET` | `/api/garbage/schedule/:ward` | Schedule for ward |
| `GET` | `/api/garbage/missed/:ward` | Today's missed count |
| `POST` | `/api/garbage/missed` | Report missed collection |
| `GET` | `/api/garbage/history/:ward` | 28-day missed history |
| `GET` | `/api/garbage/autocomplaint/:ward` | Auto-complaint status |
| `POST` | `/api/whatsapp/webhook` | Twilio WhatsApp webhook |

## Related

- [[Complaint_System_Architecture]]
- [[Frontend Architecture]]
- [[Government Portal]]
- [[AI Features]]
- [[Garbage Management]]
- [[WhatsApp Integration]]
- [[Engagement Features]]
- [[DB_Queries]]
- [[Ollama_Deployment]]
- [[Test Commands]]
- [[Features to Implement]]
