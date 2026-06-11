# NagaraVaani

A citizen complaint and civic issue reporting platform for **Mandya, Karnataka, India**. Residents can report problems (roads, water, electricity, garbage, sewage, noise, encroachment) and track them through government departments until resolution.

---

## Features

- **Complaint Reporting**: Multi-step form with photo upload, map picker, duplicate detection (hybrid vector + trigram similarity)
- **AI-Powered**: Ollama (llama3.2:3b + nomic-embed-text) for semantic search, dedup, classification, Kannada translation, and RAG chatbot
- **Multi-Channel**: Web portal + WhatsApp chatbot (Twilio state-machine flow)
- **Community Feed**: Upvote, comment, share issues; filter by category/ward/status
- **Government Dashboard**: Department login, status management, official responses
- **Garbage Management**: Schedules by ward, missed report tracking, auto-complaint creation
- **Mapping**: Interactive Leaflet map with issue markers and ward heatmap
- **Smart Dedup**: Two-table architecture (`problems` + `complaints`) with pgvector HNSW index and pg_trgm

---

## Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **Components**: Radix UI + Lucide Icons
- **Maps**: Leaflet + React-Leaflet
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js + Express
- **Database**: PostgreSQL (Supabase) with pgvector + pg_trgm
- **AI**: Ollama (local) / Groq / Together AI
- **Integrations**: Twilio, WhatsApp-Web.js, Multer, Supabase Storage

---

## Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL with pgvector extension
- Ollama (optional, for AI features)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/christopherbatemen-ai/puttanaiha-foundation.git
   cd puttanaiha-foundation
   ```

2. **Setup Frontend**:
   ```bash
   cd app
   npm install
   npm run dev
   ```

3. **Setup Backend**:
   ```bash
   cd ../backend
   npm install
   cp .env.example .env  # configure database and API keys
   node seed.js          # seed departments and database
   npm run dev
   ```

4. **Start Ollama (for AI features)**:
   ```bash
   ollama pull nomic-embed-text
   ollama pull llama3.2:3b
   ollama serve
   ```

---

## Knowledge Graph (Obsidian Vault)

The `nagravani_kgraph/` directory is an [Obsidian](https://obsidian.md/) vault containing project documentation, architecture specs, API reference, and feature guides.

To open it:
1. Install Obsidian from [obsidian.md](https://obsidian.md/)
2. Click **Open folder as vault**
3. Select `nagravani_kgraph/` from the project root
4. Trust the author and enable the vault
5. Press CTRL+G to view the graph

---

## Project Structure

```
.
├── app/                    # React frontend
│   ├── src/
│   │   ├── components/    # UI components + Navbar, WardHeatMap
│   │   ├── pages/         # ComplaintPortal, CommunityFeed, MapPage, GovDashboard, AIHelpDesk, etc.
│   │   ├── sections/      # Landing page sections
│   │   ├── hooks/
│   │   ├── context/
│   │   └── lib/           # API client, Supabase, translations
│   └── public/
├── backend/                # Express API server
│   ├── routes/            # complaints, ai, departments, garbage, stats, users, whatsapp
│   ├── migrations/        # SQL migration files
│   ├── server.js
│   ├── db.js
│   ├── embeddings.js
│   └── ai.js
├── nagravani_kgraph/       # Obsidian knowledge graph / documentation
└── README.md
```

---

## License

ISC
