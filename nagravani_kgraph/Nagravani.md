
/home/flickowens/nagravani_dep/
├── app/                    # Frontend (React + TypeScript + Vite + Tailwind)
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Client-side utilities
│   │   ├── pages/          # Page components
│   │   ├── sections/       # Section components
│   │   ├── App.tsx         # Main app component
│   │   ├── index.css       # Global styles
│   │   └── main.tsx        # Entry point
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                # Backend (Node.js + Express + PostgreSQL)
│   ├── routes/
│   │   ├── ai.js          # AI/embedding routes
│   │   ├── complaints.js   # Complaint CRUD + voting
│   │   ├── departments.js  # Department routes
│   │   └── users.js        # User routes
│   ├── ai.js              # AI service
│   ├── db.js              # Database connection
│   ├── embeddings.js      # Embedding service
│   ├── server.js          # Express server
│   ├── migration_*.sql    # Database migrations
│   ├── seed.js            # Seed script
│   └── package.json
│
├── nagravani_kgraph/       # Obsidian vault 
├── notes/                   # Original notes
├── tech-spec.md           # Technical specification
├── README.md
└── package.json            # Root package (deploy config)


NagaraVaani - Project Overview

NagaraVaani is a citizen complaint and civic issue reporting platform for Mandya, Karnataka, India. Residents report problems (roads, water, electricity, garbage, sewage) and track them through government departments until resolution.
Technology Stack
Layer	Technologies

Frontend	React 19 + TypeScript, Vite, Tailwind CSS, Framer Motion, React-Leaflet (maps), Recharts

Backend	Node.js + Express, PostgreSQL + pgvector (embeddings), Better-SQLite3
AI/ML	Ollama (llama3.2:3b for chat), nomic-embed-text for embeddings
Cloud	Supabase (storage + hosted Postgres), Twilio (WhatsApp)

Core Features
1. Complaint Reporting - Photo, GPS location, category, ward, severity
2. Smart Deduplication - AI embeddings detect duplicate complaints and merge them
3. Automatic Department Routing - Vector similarity routes issues to correct dept (PWD, CESC, CMC, MUDA, DHO)
4. Community Feed - Public feed filterable by category/ward/status
5. Interactive Map - Leaflet-based problem map
6. AI Help Desk - RAG-powered chatbot for citizen questions
7. WhatsApp Integration - Report via WhatsApp

Architecture
app/          → React frontend (Vite)
backend/      → Express API server
  ├── routes/   → complaints, departments, users, ai
  ├── ai.js    → Ollama LLM wrapper
  └── db.js    → PostgreSQL pool
nagravani_kgraph/ → Knowledge base

How It Works
1. Complaint Submitted → Embed description → Search for duplicates (vector similarity >0.60) → Merge or create new
2. Routing → Compare embedding to department embeddings → Assign to best match
3. AI Chat → Embed question → Fetch similar complaints (RAG context) → LLM generates response
The project uses PostgreSQL with pgvector for semantic search, Ollama for local LLM inference, and Supabase for cloud storage.

## System Documentation

[[Complaint_System_Architecture]] - How the complaint system works

## Related


[[DB_Queries]]
[[Features to Implement]]


