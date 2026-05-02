// routes/complaints.js — works against complaints + problems tables (two-table schema)
import { Router } from "express";
import multer from "multer";
import { v4 as uuid } from "uuid";
import { query } from "../db.js";
import { embed, toVectorLiteral } from "../embeddings.js";
import { createHash } from 'crypto';
import { generateComplaintId } from '../lib/generateComplaintId.js';
import { generateProblemSummary } from '../ai.js';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// ── Initialize Supabase client ─────────────────────────────
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// ── Constants ─────────────────────────────────────────────
const VALID_CATEGORIES = [
  "road",
  "water",
  "streetlight",
  "garbage",
  "sewage",
  "noise",
  "encroachment",
];

const CATEGORY_TO_DEPT_ID = {
  road:         '4532bd59-eb0a-4c05-bace-9ee210ee0078',
  water:        '11e1918e-7c31-4be6-9b2f-374449e4e0ee',
  streetlight:  '3737a8b7-3fb2-40e2-a687-534afd04439b',
  garbage:      '11e1918e-7c31-4be6-9b2f-374449e4e0ee',
  sewage:       '11e1918e-7c31-4be6-9b2f-374449e4e0ee',
  noise:        '9d6c4f8f-6f4e-4a9f-a9ec-c8d3fe63833b',
  encroachment: '892f379f-538b-457d-ad3c-d06259edb4cb',
};

// ── Severity: keyword matching only (no LLM) ──────────────
function quickSeverity(description) {
  const t = description.toLowerCase();
  if (/accident|injur|death|collapse|fire|flood|emergency|fatal/.test(t)) return 'Critical';
  if (/dangerous|broken|blocked|burst|leak|unsafe|overflow/.test(t))      return 'High';
  if (/damage|pothole|missing|dirty|smell|not working/.test(t))            return 'Medium';
  return 'Low';
}

// ── Priority score ────────────────────────────────────────
function calcPriorityScore(upvoteCount, createdAt) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  return upvoteCount * 10 + days * 2;
}

// ── Text normalization for duplicate detection ───────────
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ')  // Replace punctuation with spaces
    .replace(/\s+/g, ' ');        // Normalize multiple spaces to single space
}

// ── Enhanced duplicate detection with vector + pg_trgm ────
// Vector similarity > 0.75 → definite match
// Vector similarity 0.60–0.75 → run pg_trgm as tiebreaker
// Vector similarity < 0.60 → new problem
async function findDuplicateProblem(vectorLiteral, normalizedTitle, category, ward) {
  // Stage 1: Vector similarity search (> 0.60 to catch borderline cases)
  const { rows: candidates } = await query(
    `
    SELECT id, "upvoteCount", "createdAt", title,
           1 - (embedding <=> $1::vector) AS similarity
    FROM problems
    WHERE category = $2
      AND ward = $3
      AND status IN ('pending', 'inProgress')
      AND embedding IS NOT NULL
      AND 1 - (embedding <=> $1::vector) > 0.60
    ORDER BY embedding <=> $1::vector
    LIMIT 5
    `,
    [vectorLiteral, category, ward]
  );

  if (candidates.length === 0) {
    return null;
  }

  const bestMatch = candidates[0];
  const vectorSim = bestMatch.similarity;

  // Definite match: vector similarity > 0.75
  if (vectorSim > 0.75) {
    console.log(`[DEDUP] Definite match (vector: ${Math.round(vectorSim * 100)}%)`);
    return bestMatch;
  }

  // Borderline: vector similarity 0.60-0.75, use pg_trgm as tiebreaker
  if (vectorSim >= 0.60) {
    console.log(`[DEDUP] Borderline match (vector: ${Math.round(vectorSim * 100)}%), checking pg_trgm...`);

    // Check pg_trgm similarity with the best candidate
    const { rows: trgmResult } = await query(
      `
      SELECT 
        similarity($1, $2) AS title_similarity,
        word_similarity($1, $2) AS word_sim
      `,
      [normalizedTitle, normalizeText(bestMatch.title)]
    );

    const titleSim = trgmResult[0]?.title_similarity || 0;
    const wordSim = trgmResult[0]?.word_sim || 0;

    // Use the higher of title_similarity or word_similarity
    const trgmSim = Math.max(titleSim, wordSim);

    console.log(`[DEDUP] pg_trgm similarity: ${Math.round(trgmSim * 100)}%`);

    // If pg_trgm similarity is high enough, it's a match
    if (trgmSim >= 0.5) {
      console.log(`[DEDUP] Match confirmed by pg_trgm`);
      return bestMatch;
    }

    // Check other candidates if the best one didn't match
    for (let i = 1; i < candidates.length; i++) {
      const candidate = candidates[i];
      const { rows: trgmCheck } = await query(
        `
        SELECT 
          similarity($1, $2) AS title_similarity,
          word_similarity($1, $2) AS word_sim
        `,
        [normalizedTitle, normalizeText(candidate.title)]
      );

      const checkSim = Math.max(trgmCheck[0]?.title_similarity || 0, trgmCheck[0]?.word_sim || 0);

      if (checkSim >= 0.5) {
        console.log(`[DEDUP] Match found with candidate ${i} (pg_trgm: ${Math.round(checkSim * 100)}%)`);
        return candidate;
      }
    }
  }

  // No match found
  console.log(`[DEDUP] No match (best vector: ${Math.round(vectorSim * 100)}%)`);
  return null;
}

// ── AI-powered summary regeneration ─────────────────────────
async function regenerateSummary(problemId) {
  const { rows } = await query(
    'SELECT description FROM complaints WHERE problem_id = $1 ORDER BY "createdAt" ASC',
    [problemId]
  );

  const descriptions = rows.map(r => r.description);

  // Use AI to generate summary
  return await generateProblemSummary(descriptions);
}

// ── File upload (memory storage) ───────────────────────────
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { files: 1, fileSize: 5 * 1024 * 1024 },
});

// ── Background reverse geocode ────────────────────────────
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: { "User-Agent": "NagaraVaani/1.0" },
        signal: AbortSignal.timeout(8000),
      },
    );
    const data = await res.json();
    return data.display_name || null;
  } catch {
    return null;
  }
}

// ── POST /api/report ──────────────────────────────────────
router.post("/report", upload.single("photo"), async (req, res) => {
  console.log("[1] received", {
    title: req.body?.title,
    category: req.body?.category,
    ward: req.body?.ward,
  });
  try {
    const { title, category, description, ward, lat, lng, citizen_name, aadhaar } = req.body;

    if (!title || !category || !description || !ward)
      return res
        .status(400)
        .json({ error: "title, category, description, ward are required" });
    if (!VALID_CATEGORIES.includes(category))
      return res
        .status(400)
        .json({
          error: `category must be one of: ${VALID_CATEGORIES.join(", ")}`,
        });
    if (!citizen_name || citizen_name.trim().length === 0 || citizen_name.length > 100) {
      return res.status(400).json({ error: 'citizen_name is required (max 100 chars)' });
    }
    if (!aadhaar || !/^[0-9]{12}$/.test(aadhaar)) {
      return res.status(400).json({ error: 'aadhaar must be exactly 12 digits' });
    }

    // 1. Embed (graceful fallback if Ollama unavailable)
    let vectorLiteral = null;
    console.log("[2] embedding...");
    try {
      const embedding = await embed(`${title} ${description}`);
      if (embedding) {
        vectorLiteral = toVectorLiteral(embedding);
        console.log("[2] embed done");
      } else {
        console.log("[2] embed skipped (Ollama unavailable), proceeding without embeddings");
      }
    } catch (err) {
      console.warn("[2] embed failed:", err.message);
    }

    // 2. Search problems table for duplicates (skip if no embedding)
    let problemMatch = null;
    if (vectorLiteral) {
      console.log("[3] dedup query against problems...");
      const normalizedTitle = normalizeText(title);
      problemMatch = await findDuplicateProblem(vectorLiteral, normalizedTitle, category, ward);
      console.log("[3] dedup done, match found:", problemMatch ? 'yes' : 'no');
    } else {
      console.log("[3] dedup skipped (no embedding)");
    }

    const severity = quickSeverity(`${title} ${description}`);
    const deptId = CATEGORY_TO_DEPT_ID[category] || null;
    const latVal = lat ? parseFloat(lat) : null;
    const lngVal = lng ? parseFloat(lng) : null;

    // 3. Upload photo to Supabase Storage if provided
    let photoUrl = null;
    if (req.file) {
      const filename = `${Date.now()}-${req.file.originalname}`;
      const { error } = await supabase.storage
        .from('complaint-photos')
        .upload(filename, req.file.buffer, { contentType: req.file.mimetype });

      if (error) {
        console.error('[UPLOAD ERROR]', error);
        throw new Error(`Failed to upload photo: ${error.message}`);
      }

      photoUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/complaint-photos/${filename}`;
      console.log("[PHOTO UPLOAD]", photoUrl);
    }

    // Hash Aadhaar
    const aadhaarHash = createHash('sha256').update(aadhaar).digest('hex');
    const aadhaarLast4 = aadhaar.slice(-4);

    // Generate complaint ID
    const DEPT_ID_TO_SHORT = {
      '4532bd59-eb0a-4c05-bace-9ee210ee0078': 'PWD',
      '11e1918e-7c31-4be6-9b2f-374449e4e0ee': 'CMC',
      '3737a8b7-3fb2-40e2-a687-534afd04439b': 'CESC',
      '892f379f-538b-457d-ad3c-d06259edb4cb': 'MUDA',
      '9d6c4f8f-6f4e-4a9f-a9ec-c8d3fe63833b': 'DHO',
    };
    const deptShort = DEPT_ID_TO_SHORT[deptId];
    const complaintId = await generateComplaintId(deptShort);

    // 3a. Match found → insert complaint linked to existing problem, increment upvoteCount, recalc priorityScore, regenerate summary
    if (problemMatch) {
      const newUpvotes = (problemMatch.upvoteCount || 0) + 1;
      const newPriority = calcPriorityScore(newUpvotes, problemMatch.createdAt);

      // Insert complaint linked to existing problem
      const { rows: complaintRows } = await query(
        `
         INSERT INTO complaints
           (id, title, category, description, ward, "photoPath",
            lat, lng, address, status, severity, embedding, department_id, problem_id,
            citizen_name, aadhaar_hash, aadhaar_last4)
         VALUES
           ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',$10,$11::vector,$12,$13,$14,$15,$16)
         RETURNING *
       `,
        [
          complaintId,
          title,
          category,
          description,
          ward,
          photoUrl,
          latVal,
          lngVal,
          ward,
          severity,
          vectorLiteral,
          deptId,
          problemMatch.id,
          citizen_name.trim(),
          aadhaarHash,
          aadhaarLast4,
        ],
      );

      // Regenerate summary from all linked complaints using AI
      const newSummary = await regenerateSummary(problemMatch.id);

      // Update problem: increment upvoteCount, recalc priorityScore, update summary
      const { rows: updatedProblem } = await query(
        `
        UPDATE problems
        SET "upvoteCount" = $1, "priorityScore" = $2, summary = $3
        WHERE id = $4
        RETURNING *
      `,
        [newUpvotes, newPriority, newSummary, problemMatch.id],
      );

      console.log("[4] duplicate merged into existing problem, responding");
      return res.status(200).json({
        success: true,
        merged: true,
        complaint: complaintRows[0],
        problem: updatedProblem[0],
        message: `Similar problem already reported. Your complaint has been merged!`,
      });
    }

    // 3b. No match → create new problem first, then insert complaint linked to it
    const problemId = uuid();
    const problemPriority = calcPriorityScore(1, new Date().toISOString());
    // Generate AI summary for single complaint too (can enhance it)
    const problemSummary = await generateProblemSummary([`${title}: ${description}`]);

    // Create new problem
    await query(
      `
      INSERT INTO problems
        (id, title, category, ward, summary, status, "upvoteCount", "priorityScore",
         embedding, department_id, lat, lng, address)
      VALUES
        ($1,$2,$3,$4,$5,'pending',1,$6,$7::vector,$8,$9,$10,$11)
    `,
      [
        problemId,
        title,
        category,
        ward,
        problemSummary,
        problemPriority,
        vectorLiteral,
        deptId,
        latVal,
        lngVal,
        ward,
      ],
    );

    // Insert complaint linked to new problem
    const { rows: complaintRows } = await query(
      `
       INSERT INTO complaints
         (id, title, category, description, ward, "photoPath",
          lat, lng, address, status, severity, embedding, department_id, problem_id,
          citizen_name, aadhaar_hash, aadhaar_last4)
       VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',$10,$11::vector,$12,$13,$14,$15,$16)
       RETURNING *
    `,
      [
         complaintId,
         title,
         category,
         description,
         ward,
         photoUrl,
         latVal,
         lngVal,
         ward,
         severity,
         vectorLiteral,
         deptId,
         problemId,
         citizen_name.trim(),
         aadhaarHash,
         aadhaarLast4,
       ],
    );

    // Fetch the newly created problem
    const { rows: problemRows } = await query(
      'SELECT * FROM problems WHERE id = $1',
      [problemId],
    );

    console.log("[4] new problem and complaint created, responding");
    res.status(201).json({
      success: true,
      merged: false,
      complaint: complaintRows[0],
      problem: problemRows[0],
    });

    // Geocode after responding
    if (latVal && lngVal) {
      reverseGeocode(latVal, lngVal).then((address) => {
        if (address) {
          query("UPDATE complaints SET address = $1 WHERE id = $2", [
            address,
            complaintId,
          ]).catch((e) => console.warn("[GEOCODE complaints]", e.message));
          query("UPDATE problems SET address = $1 WHERE id = $2", [
            address,
            problemId,
          ]).catch((e) => console.warn("[GEOCODE problems]", e.message));
        }
      });
    }
  } catch (err) {
    console.error("[REPORT ERROR]", err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// ── GET /api/feed ─────────────────────────────────────────
router.get("/feed", async (req, res) => {
  try {
    const { category, ward, status, limit = 50, offset = 0 } = req.query;
    const conditions = ["1=1"];
    const params = [];
    let p = 1;

    if (category) {
      conditions.push(`p.category = $${p++}`);
      params.push(category);
    }
    if (status) {
      conditions.push(`p.status = $${p++}`);
      params.push(status);
    }
    if (ward) {
      conditions.push(`p.ward = $${p++}`);
      params.push(ward);
    }
    params.push(parseInt(limit), parseInt(offset));

    const { rows } = await query(
      `
      SELECT p.id, p.category, p.ward, p.summary,
             p.status, p.severity, p."upvoteCount", p."priorityScore",
             p.lat, p.lng, p.address, p."createdAt",
             d.short AS dept_short, d.name AS dept_name
      FROM problems p
      LEFT JOIN departments d ON d.id = p.department_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY p."priorityScore" DESC, p."createdAt" DESC
      LIMIT $${p++} OFFSET $${p++}
    `,
      params,
    );

    res.json({ success: true, total: rows.length, data: rows });
  } catch (err) {
    console.error("[FEED ERROR]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/feed/:id ─────────────────────────────────────
router.get("/feed/:id", async (req, res) => {
  try {
    // Get problem
    const { rows: problemRows } = await query(
      `
      SELECT p.*, d.short AS dept_short, d.name AS dept_name, d.officer_phone
      FROM problems p
      LEFT JOIN departments d ON d.id = p.department_id
      WHERE p.id = $1
    `,
      [req.params.id],
    );
    if (!problemRows[0]) return res.status(404).json({ error: "Not found" });

    // Get all linked complaints
    const { rows: complaintRows } = await query(
      `
      SELECT c.*, d.short AS dept_short, d.name AS dept_name
      FROM complaints c
      LEFT JOIN departments d ON d.id = c.department_id
      WHERE c.problem_id = $1
      ORDER BY c."createdAt" ASC
    `,
      [req.params.id],
    );

    res.json({ success: true, problem: problemRows[0], complaints: complaintRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/complaints/:id ─────────────────────────────────
router.get("/complaints/:id", async (req, res) => {
  try {
    // Get single complaint
    const { rows: complaintRows } = await query(
      `
      SELECT c.*, d.short AS dept_short, d.name AS dept_name
      FROM complaints c
      LEFT JOIN departments d ON d.id = c.department_id
      WHERE c.id = $1
    `,
      [req.params.id],
    );
    if (!complaintRows[0]) return res.status(404).json({ error: "Complaint not found" });

    const complaint = complaintRows[0];
    const problemId = complaint.problem_id;

    let problem = null;
    if (problemId) {
      // Get parent problem
      const { rows: problemRows } = await query(
        `
        SELECT p.*, d.short AS dept_short, d.name AS dept_name, d.officer_phone
        FROM problems p
        LEFT JOIN departments d ON d.id = p.department_id
        WHERE p.id = $1
      `,
        [problemId],
      );
      problem = problemRows[0] || null;
    }

    res.json({ success: true, complaint, problem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/feed/:id/upvote ────────────────────────────
router.patch("/feed/:id/upvote", async (req, res) => {
  try {
    const { rows: cur } = await query(
      'SELECT "upvoteCount", "createdAt" FROM problems WHERE id = $1',
      [req.params.id],
    );
    if (!cur[0]) return res.status(404).json({ error: "Not found" });

    const newUpvotes = (cur[0].upvoteCount || 0) + 1;
    const newPriority = calcPriorityScore(newUpvotes, cur[0].createdAt);

    const { rows } = await query(
      `
      UPDATE problems SET "upvoteCount" = $1, "priorityScore" = $2
      WHERE id = $3 RETURNING "upvoteCount", "priorityScore"
    `,
      [newUpvotes, newPriority, req.params.id],
    );

    res.json({
      success: true,
      upvoteCount: rows[0].upvoteCount,
      priorityScore: rows[0].priorityScore,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/feed/:id/status ────────────────────────────
router.patch("/feed/:id/status", async (req, res) => {
  const { status } = req.body;
  const valid = ["pending", "inProgress", "resolved", "rejected"];
  if (!valid.includes(status))
    return res
      .status(400)
      .json({ error: `status must be one of: ${valid.join(", ")}` });

  const resolved_at = status === "resolved" ? new Date().toISOString() : null;
  try {
    // Update problem status
    await query(
      "UPDATE problems SET status = $1, resolved_at = $2 WHERE id = $3",
      [status, resolved_at, req.params.id],
    );

    // Update all linked complaints to same status
    await query(
      "UPDATE complaints SET status = $1, resolved_at = $2 WHERE problem_id = $3",
      [status, resolved_at, req.params.id],
    );

    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/search ───────────────────────────────────────
router.get("/search", async (req, res) => {
  try {
    const { q, threshold = 0.6, limit = 10 } = req.query;
    if (!q) return res.status(400).json({ error: "q is required" });

    const embedding = await embed(q);
    const vectorLiteral = toVectorLiteral(embedding);

    const { rows } = await query(
      `
      SELECT p.id, p.category, p.ward, p.status, p.severity,
             p."upvoteCount", p."priorityScore", p.address, p."createdAt", p.summary,
             d.short AS dept_short,
             1 - (p.embedding <=> $1::vector) AS similarity
      FROM problems p
      LEFT JOIN departments d ON d.id = p.department_id
      WHERE p.embedding IS NOT NULL
        AND 1 - (p.embedding <=> $1::vector) > $2
      ORDER BY p.embedding <=> $1::vector
      LIMIT $3
    `,
      [vectorLiteral, parseFloat(threshold), parseInt(limit)],
    );

    res.json({ success: true, query: q, total: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/stats ────────────────────────────────────────
router.get("/stats", async (_req, res) => {
  try {
    const { rows } = await query(`
      SELECT
        COUNT(*)                                           AS total_problems,
        COUNT(*) FILTER (WHERE status = 'resolved')        AS resolved,
        COUNT(*) FILTER (WHERE status = 'pending')         AS pending,
        COUNT(*) FILTER (WHERE status = 'inProgress')      AS in_progress,
        SUM("upvoteCount")                                 AS total_upvotes,
        ROUND(AVG("priorityScore"))                        AS avg_priority,
        ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - "createdAt")) / 3600)
              FILTER (WHERE status = 'resolved' AND resolved_at IS NOT NULL))
                                                           AS avg_resolution_hours
      FROM problems
    `);
    const s = rows[0];
    const total = parseInt(s.total_problems);
    const resolved = parseInt(s.resolved);
    res.json({
      success: true,
      data: {
        total_problems: total,
        resolved_problems: resolved,
        pending_problems: parseInt(s.pending),
        in_progress: parseInt(s.in_progress),
        total_upvotes: parseInt(s.total_upvotes) || 0,
        avg_priority_score: parseInt(s.avg_priority) || 0,
        resolution_pct: total ? Math.round((resolved / total) * 100) : 0,
        avg_resolution_hours: parseInt(s.avg_resolution_hours) || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
