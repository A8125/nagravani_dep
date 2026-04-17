// ─────────────────────────────────────────────────────────
//  server.js  —  NagaraVaani backend (pgvector edition)
// ─────────────────────────────────────────────────────────

import 'dotenv/config'; // Must be FIRST to load env vars before any other imports

import express from "express";
import cors from "cors";

import complaintsRouter from "./routes/complaints.js";
import departmentsRouter from "./routes/departments.js";
import usersRouter from "./routes/users.js";
import aiRouter from "./routes/ai.js";
import { dbHealthCheck } from "./db.js";

const PORT = process.env.PORT || 3000;

// ── App setup ─────────────────────────────────────────────
const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3001",
      "https://nagravani.netlify.app"
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request logger (dev) ──────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ── Routing ───────────────────────────────────────────────
app.use("/api", complaintsRouter); // POST /api/report  GET /api/feed etc.
//app.use('/api/complaints', complaintsRouter);   // alias + GET /api/complaints/search
app.use("/api/departments", departmentsRouter);
app.use("/api/users", usersRouter);
app.use("/api/ai", aiRouter); // POST /api/ai/ask  GET /api/ai/similar

// ── Health check ──────────────────────────────────────────
app.get("/health", async (_req, res) => {
  let dbTime = null;
  let dbStatus = "error";
  try {
    dbTime = await dbHealthCheck();
    dbStatus = "ok";
  } catch (err) {
    console.error("[HEALTH] DB check failed:", err.message);
  }

  res.json({
    status: dbStatus === "ok" ? "ok" : "degraded",
    platform: "NagaraVaani",
    city: "Mandya, Karnataka",
    center: { lat: 12.5218, lng: 76.8951 },
    ai_model: "llama3.2:3b (Ollama)",
    embed_model: "nomic-embed-text (Ollama)",
    storage: "Supabase Storage",
    database: { status: dbStatus, time: dbTime },
    timestamp: new Date().toISOString(),
  });
});

// ── API index ─────────────────────────────────────────────
app.get("/api", (_req, res) => {
  res.json({
    name: "NagaraVaani API",
    version: "2.0.0",
    changes: "pgvector edition — semantic search, deduplication, RAG Q&A",
    routes: {
      health: "GET  /health",
      report: "POST /api/report  (auto-deduplicates via embeddings)",
      feed: "GET  /api/feed?category=&department=&status=&limit=&offset=",
      feed_detail: "GET  /api/feed/:id",
      search: "GET  /api/complaints/search?q=&threshold=&limit=",
      upvote: "PATCH /api/feed/:id/upvote",
      update_status: "PATCH /api/feed/:id/status { status }",
      city_stats: "GET  /api/stats",
      departments: "GET  /api/departments",
      department: "GET  /api/departments/:id",
      register: "POST /api/users/register",
      dashboard: "GET  /api/users/:id",
      notifications: "GET  /api/users/:id/notifications",
      lang_switch: "PATCH /api/users/:id/lang",
      ai_ask: "POST /api/ai/ask  (RAG-powered)",
      ai_similar: "GET  /api/ai/similar?q=  (semantic + routing)",
      ai_translate: "POST /api/ai/translate",
      ai_whatsapp: "POST /api/ai/whatsapp",
      ai_faq: "GET  /api/ai/faq",
    },
  });
});

// ── 404 catch ─────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// ── Error handler ─────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[UNHANDLED ERROR]", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n🏛️  NagaraVaani backend running on http://localhost:${PORT}`);
  console.log(`📊  pgvector + nomic-embed-text enabled (Ollama)`);
  console.log(`🤖  Chat model: llama3.2:3b (Ollama)`);
  console.log(`📸  Storage: Supabase Storage (complaint-photos bucket)`);
  console.log(`📡  API index:   http://localhost:${PORT}/api\n`);
});
