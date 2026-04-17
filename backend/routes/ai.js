// ─────────────────────────────────────────────────────────
//  routes/ai.js  (RAG edition)
//  /api/ai/ask     — now RAG-powered via complaint embeddings
//  /api/ai/similar — NEW: find complaints similar to free text
//  /api/ai/translate, /api/ai/whatsapp, /api/ai/faq — unchanged
// ─────────────────────────────────────────────────────────

import { Router }  from 'express';
import twilio      from 'twilio';
import { query }   from '../db.js';
import {
  answerCitizenQueryRAG,
  translateToKannada,
  dispatchDepartmentSemantic,
  assessSeverity,
  classifyCategory,
} from '../ai.js';
import { embed, toVectorLiteral } from '../embeddings.js';

const router   = Router();
const sessions = {}; // WhatsApp state machine memory

// ── POST /api/ai/ask  (RAG-powered) ──────────────────────
router.post('/ask', async (req, res) => {
  const { query: userQuery, user_id = null, lang = 'en' } = req.body;
  if (!userQuery) return res.status(400).json({ error: 'query is required' });

  let answer = await answerCitizenQueryRAG(userQuery);
  if (lang === 'kn') {
    answer = await translateToKannada(answer);
  }

  res.json({ success: true, query: userQuery, answer, lang });
});

// ── POST /api/ai/translate ────────────────────────────────
router.post('/translate', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });

  const translated = await translateToKannada(text);
  res.json({ success: true, original: text, translated });
});

// ── GET /api/ai/similar?q=...&limit=5 ────────────────────
// Returns semantically similar complaints + suggested department routing
router.get('/similar', async (req, res) => {
  try {
    const { q, limit = 5, threshold = 0.60 } = req.query;
    if (!q) return res.status(400).json({ error: 'q is required' });

    const embedding = await embed(q);
    const vectorLiteral = toVectorLiteral(embedding);

    // Similar complaints
    const { rows: similar } = await query(`
      SELECT c.id, c.title, c.description, c.category, c.status,
             c.severity, c.address, c.citizen_count, c.created_at,
             d.short AS dept_short, d.name AS dept_name,
             1 - (c.embedding <=> $1::vector) AS similarity
      FROM complaints c
      LEFT JOIN departments d ON d.id = c.department_id
      WHERE c.embedding IS NOT NULL
        AND 1 - (c.embedding <=> $1::vector) > $3
      ORDER BY c.embedding <=> $1::vector
      LIMIT $2
    `, [vectorLiteral, parseInt(limit), parseFloat(threshold)]);

    // Suggested department routing
    const { rows: deptRoute } = await query(`
      SELECT d.short, d.name, 1 - (de.embedding <=> $1::vector) AS similarity
      FROM department_embeddings de
      JOIN departments d ON d.id = de.department_id
      ORDER BY de.embedding <=> $1::vector
      LIMIT 3
    `, [vectorLiteral]);

    res.json({
      success: true,
      query: q,
      suggested_department: deptRoute[0] ?? null,
      similar_complaints: similar.map(r => ({
        ...r,
        similarity: Math.round(r.similarity * 100),
      })),
    });
  } catch (err) {
    console.error('[SIMILAR ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/ai/whatsapp ─────────────────────────────────
router.post('/whatsapp', async (req, res) => {
  const twiml = new twilio.twiml.MessagingResponse();
  const from  = req.body.From;
  const body  = req.body.Body ? req.body.Body.trim() : '';

  if (!from) return res.status(400).send('Twilio only');

  if (!sessions[from]) {
    sessions[from] = { state: 'WAITING_FOR_DESC', data: {} };
    twiml.message('Welcome to NagaraVaani WhatsApp Bot! 🏛️\n\nWhat civic issue are you facing today? (e.g., "Huge pothole on MG Road")');
    return res.type('text/xml').send(twiml.toString());
  }

  const session = sessions[from];

  if (session.state === 'WAITING_FOR_DESC') {
    session.data.description = body;
    session.state = 'WAITING_FOR_PHOTO';
    twiml.message('Got it! 📝\n\nPlease reply with a PHOTO of the issue. 📸 (Or type "Skip")');
  }
  else if (session.state === 'WAITING_FOR_PHOTO') {
    if (req.body.NumMedia && parseInt(req.body.NumMedia) > 0) {
      session.data.photoUrl = req.body.MediaUrl0;
    }
    session.state = 'WAITING_FOR_LOCATION';
    twiml.message('Photo received! ✅\n\nNow, reply with your LOCATION pin 📍 or type the address/landmark.');
  }
  else if (session.state === 'WAITING_FOR_LOCATION') {
    const location = (req.body.Latitude && req.body.Longitude)
      ? `${req.body.Latitude}, ${req.body.Longitude}`
      : body;
    session.data.location = location;
    session.data.lat = parseFloat(req.body.Latitude) || 12.5218;
    session.data.lng = parseFloat(req.body.Longitude) || 76.8951;
    session.state = 'WAITING_FOR_SEVERITY';
    twiml.message('Location saved! 📍\n\nHow CRITICAL is this? Reply:\n1 for Low\n2 for Medium\n3 for High');
  }
  else if (session.state === 'WAITING_FOR_SEVERITY') {
    let severity = 'Medium';
    if (body.includes('1') || body.toLowerCase().includes('low'))  severity = 'Low';
    if (body.includes('3') || body.toLowerCase().includes('high')) severity = 'High';

    try {
      const desc = session.data.description;
      const [deptShort, category, embedding] = await Promise.all([
        dispatchDepartmentSemantic(desc),
        classifyCategory(desc),
        embed(desc), // Text to embed
      ]);

      const { rows: deptRows } = await query(
        'SELECT id, name FROM departments WHERE short = $1', [deptShort]
      );
      const dept = deptRows[0];

      if (!dept) throw new Error('Department not found: ' + deptShort);

      const vectorLiteral = toVectorLiteral(embedding);
      const title = desc.substring(0, 40) + '...';

      const { rows: inserted } = await query(`
        INSERT INTO complaints
          (title, description, category, department_id, address,
           lat, lng, status, severity, citizen_count, embedding)
        VALUES ($1,$2,$3,$4,$5,$6,$7,'Pending',$8,1,$9::vector)
        RETURNING id
      `, [
        title, desc, category, dept.id,
        session.data.location, session.data.lat, session.data.lng,
        severity, vectorLiteral,
      ]);

      twiml.message(
        `Thank you! 🙏\nYour complaint is LIVE on the NagaraVaani Dashboard (Severity: *${severity}*).\n\n` +
        `Ticket ID: *${inserted[0].id}*\nRouted to: *${dept.name}*\nWe will notify you on updates!`
      );
      delete sessions[from];
    } catch (err) {
      console.error(err);
      twiml.message('Oops, something went wrong. Please try again later.');
      delete sessions[from];
    }
  }

  res.type('text/xml').send(twiml.toString());
});

// ── GET /api/ai/faq ───────────────────────────────────────
router.get('/faq', (_req, res) => {
  res.json({
    success: true,
    data: [
      { q: 'Who is my ward representative?', a: 'Contact the CMC at 08232-224004.' },
      { q: 'Water supply timings?',           a: '6-8 AM and 5-7 PM on alternate days.' },
      { q: 'Pothole complaint?',              a: 'Use the Complaint Portal, or call PWD at 08232-225100.' },
      { q: 'CESC power complaint?',           a: 'Call the CESC 24/7 helpline: 1912.' },
    ],
  });
});

export default router;
