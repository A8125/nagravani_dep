# NagaraVaani

A citizen complaint and civic issue reporting platform for **Mandya, Karnataka, India**. Residents report problems (roads, water, electricity, garbage, sewage, noise, encroachment) and track them through government departments until resolution.

---

## Features

### Complaint System

- **Two-Table Architecture**: `problems` (aggregated issues) + `complaints` (individual submissions linked via FK) — groups duplicate reports under a single problem
- **Hybrid Duplicate Detection**: Two-stage dedup using pgvector (cosine similarity, HNSW index) + pg_trgm (trigram tiebreaker for borderline cases)
- **Complaint IDs**: Human-readable format `CMP-DEPT-NNNN` (e.g., `CMP-PWD-0042`) via per-department sequence counters
- **Priority Scoring**: `upvoteCount × 10 + daysSinceCreated × 2` — feed sorted by priority
- **Department Routing**: Auto-routed by category (road → PWD, water/garbage/sewage → CMC, streetlight → CESC, noise → DHO, encroachment → MUDA)
- **Aadhaar Handling**: SHA-256 hashed (never stored raw), last 4 digits for verification
- **Photo Upload**: Supabase Storage bucket (`complaint-photos`), 5 MB limit
- **Reverse Geocoding**: Async OpenStreetMap Nominatim lookup after submission
- **AI Summary Generation**: Merged complaints are summarized into a single sentence via Ollama `llama3.2:3b`

### AI & Intelligence (Ollama)

- **Embeddings**: `nomic-embed-text` (768-dim) for semantic search, dedup, and department routing
- **RAG Chatbot**: Citizens ask questions → vector search top-5 similar problems → Ollama generates answer with optional Kannada translation
- **Semantic Department Routing**: Vector comparison against `department_embeddings` table, falls back to LLM classification
- **Severity Assessment**: Keyword-based (critical/high/medium/low) with LLM fallback
- **Category Classification**: Ollama categorizes free-text complaints when no category provided
- **Translation**: English → Kannada (`POST /api/ai/translate`)
- **Similar Complaints**: Semantic search endpoint (`GET /api/ai/similar`)

### Engagement

- **"Add Me Too" Upvoting**: Increments `upvoteCount`, recalculates priority score, optimistic UI
- **Comments**: Citizen discussion + official responses (dark background, "Official Response" label, ShieldCheck icon, auto-set `"{Department} Official"` author)
- **Comment Deletion**: Gov officials only, via dashboard trash icon
- **Share**: Native share sheet on mobile (`navigator.share()`), clipboard copy on desktop, URL format `/feed?issue={problemId}`

### WhatsApp Integration (Twilio)

Guided 8-step state-machine flow: Title → Category (numbered list) → Description → Ward (validated against DB) → Severity → Name → Aadhaar (last 4) → Photo (optional). Submits via same `POST /api/report` path as web.

### Garbage Management

- Ward-based collection schedules with vehicle numbers
- Report missed collection (requires Aadhaar last 4)
- Auto-complaint generation when **5+ missed reports** accumulate in a ward (one auto-complaint per ward per day, `source = 'auto'`)
- 28-day missed collection history chart (Recharts)

### Government Portal

- Department login with hardcoded keys (`CMC2024`, `PWD2024`, etc.)
- Dashboard: stats cards (open, in progress, resolved, avg days), sortable/filterable complaint table, aged-pending highlight (>7 days)
- Status management dropdown: pending → inProgress → resolved
- Expanded panel with discussion, official comment form, and comment deletion

### Additional

- Interactive Leaflet map with category-filterable markers
- Kannada language toggle
- Community feed with filters (category, ward, status, department) and photo gallery
- City-wide and ward-level stats dashboards
- Citizen dashboard with complaint history and notifications

---

## Tech Stack

### Frontend
React 19 + TypeScript, Vite, Tailwind CSS, Framer Motion, Radix UI, React-Leaflet, Recharts, Lucide Icons, React Router

### Backend
Node.js + Express, PostgreSQL + pgvector + pg_trgm, Ollama (llama3.2:3b + nomic-embed-text), Supabase (storage + hosted Postgres), Twilio, Multer

---

## Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL with pgvector extension
- Ollama (optional, for AI features)

### Installation

```bash
git clone https://github.com/christopherbatemen-ai/puttanaiha-foundation.git
cd puttanaiha-foundation

# Frontend
cd app && npm install && npm run dev

# Backend
cd ../backend && npm install && cp .env.example .env
node seed.js && npm run dev

# AI (optional)
ollama pull nomic-embed-text && ollama pull llama3.2:3b && ollama serve
```

---

## Knowledge Graph (Obsidian Vault)

The `nagravani_kgraph/` directory is an [Obsidian](https://obsidian.md/) vault with architecture docs, API reference, and feature guides.

To open it:
1. Install Obsidian from [obsidian.md](https://obsidian.md/)
2. Click **Open folder as vault**
3. Select `nagravani_kgraph/` from the project root
4. Trust the author and enable the vault
5. Press `Ctrl+G` to view the graph view

---

## Project Structure

```
.
├── app/                     # React frontend
│   ├── src/
│   │   ├── components/     # UI components (54 Radix-based) + Navbar, WardHeatMap
│   │   ├── pages/          # ComplaintPortal, CommunityFeed, MapPage, GovDashboard, AIHelpDesk, GarbageTracker, etc.
│   │   ├── sections/       # Landing page sections (Hero, Features, HowItWorks, etc.)
│   │   ├── hooks/          # use-mobile, useScrollPosition
│   │   ├── context/        # AppContext (language toggle)
│   │   └── lib/            # API client, supabase, govAuth, translations
│   └── public/
├── backend/                 # Express API server
│   ├── routes/             # complaints, ai, departments, garbage, stats, users, whatsapp
│   ├── migrations/         # SQL migrations (pgvector, pg_trgm, schema)
│   ├── server.js, db.js, embeddings.js, ai.js, seed.js
│   └── uploads/
├── nagravani_kgraph/        # Obsidian vault (documentation)
└── README.md
```

---

## License

ISC
