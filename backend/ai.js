// ─────────────────────────────────────────────────────────
//  ai.js  —  AI helpers (used by routes/ai.js and routes/complaints.js)
//  Uses local Ollama for all LLM calls
// ─────────────────────────────────────────────────────────

import { query }     from './db.js';
import { embed, toVectorLiteral } from './embeddings.js';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const CHAT_MODEL = 'llama3.2:3b';

// ── Low-level Ollama chat completion with timeout ───────────
// Returns null if Ollama fails instead of throwing
async function callLLM(messages, systemPrompt) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[LLM] Ollama returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.message?.content ?? null;
  } catch (err) {
    console.warn('[LLM] Ollama unavailable:', err.message);
    return null;
  }
}

// ── Low-level chat completion (main entry point) ────────────
// Returns null if Ollama unavailable
async function ollamaChat(systemPrompt, userMessage, opts = {}) {
  const content = await callLLM(
    [{ role: 'user', content: userMessage }],
    systemPrompt
  );
  return content?.trim() ?? null;
}

// ── Low-level chat completion with model param ────────────
async function ollamaChatWithModel(model, systemPrompt, userMessage, opts = {}) {
  // model param is ignored — everything routes to Ollama
  return ollamaChat(systemPrompt, userMessage, opts);
}

// ── 1. Semantic department routing ───────────────────────
// Embeds the complaint description and finds the closest
// department label vector in department_embeddings table.
// Falls back to LLM text classification if no embeddings exist.
export async function dispatchDepartmentSemantic(description) {
  try {
    const embedding = await embed(description);
    if (!embedding) {
      console.log('[ROUTING] Embedding unavailable, using direct dispatch');
      return dispatchDepartment(description);
    }
    const vectorLiteral = toVectorLiteral(embedding);

    const { rows } = await query(`
      SELECT d.short, d.name, 1 - (de.embedding <=> $1::vector) AS similarity
      FROM department_embeddings de
      JOIN departments d ON d.id = de.department_id
      ORDER BY de.embedding <=> $1::vector
      LIMIT 1
    `, [vectorLiteral]);

    if (rows.length > 0 && rows[0].similarity > 0.50) {
      console.log(`[ROUTING] Semantic → ${rows[0].short} (${Math.round(rows[0].similarity * 100)}%)`);
      return rows[0].short;
    }
  } catch (err) {
    console.warn('[ROUTING] Vector routing failed:', err.message);
  }

  // Fallback: direct dispatch
  return dispatchDepartment(description);
}

// ── 2. LLM text-based department classification (fallback) ──
export async function dispatchDepartment(description) {
  const answer = await ollamaChat(
    `You are a city department dispatcher for Mandya, Karnataka.
Given a citizen complaint, respond with ONLY the department short code.
Departments: PWD (roads, potholes, bridges), CESC (power, electricity, streetlights),
CMC (water, sewage, drainage, garbage), MUDA (buildings, planning, encroachment),
DHO (health, hospitals, sanitation, disease).
Respond with exactly one code, nothing else.`,
    description
  );
  if (!answer) return 'PWD'; // Fallback if Ollama unavailable
  const code = answer.trim().toUpperCase().split(/\s+/)[0];
  const valid = ['PWD', 'CESC', 'CMC', 'MUDA', 'DHO'];
  return valid.includes(code) ? code : 'PWD';
}

// ── 3. Severity assessment ────────────────────────────────
export async function assessSeverity(description) {
  const answer = await ollamaChat(
    `You are a civic issue severity assessor.
Rate severity as exactly one word: Low, Medium, High, or Critical.
Consider danger to life as Critical, major disruption as High,
moderate inconvenience as Medium, minor issue as Low.
Respond with only one word.`,
    description
  );
  if (!answer) return 'Medium'; // Fallback if Ollama unavailable
  const valid = ['Low', 'Medium', 'High', 'Critical'];
  const trimmed = answer.trim();
  return valid.includes(trimmed) ? trimmed : 'Medium';
}

// ── 4. Category classification ────────────────────────────
export async function classifyCategory(description) {
  const answer = await ollamaChat(
    `You are a civic issue classifier for Mandya, Karnataka.
Classify this complaint into exactly one category from this list:
Roads & Potholes, Water Supply, Electricity, Sewage & Drainage,
Garbage & Sanitation, Street Lighting, Public Health, Building & Zoning,
Encroachment, Parks & Recreation, Traffic, Other.
Respond with only the category name, nothing else.`,
    description
  );
  return answer?.trim() || 'Other';
}

// ── 5. RAG-powered citizen Q&A ────────────────────────────
// Pulls the top-5 semantically similar complaints from the DB
// and injects them as context before answering the citizen's query.
export async function answerCitizenQueryRAG(userQuery) {
  // Step 1: embed the question
  let context = '';
  try {
    const queryEmbedding = await embed(userQuery);
    const vectorLiteral  = toVectorLiteral(queryEmbedding);

    const { rows } = await query(`
      SELECT title, description, category, status, address, citizen_count,
             1 - (embedding <=> $1::vector) AS similarity
      FROM complaints
      WHERE embedding IS NOT NULL
        AND 1 - (embedding <=> $1::vector) > 0.60
      ORDER BY embedding <=> $1::vector
      LIMIT 5
    `, [vectorLiteral]);

    if (rows.length > 0) {
      context = rows.map((r, i) =>
        `[${i + 1}] "${r.title}" (${r.category}, ${r.status}, ${r.citizen_count} citizens affected)\n` +
        `    Location: ${r.address || 'Mandya'}\n` +
        `    Details: ${r.description.slice(0, 200)}`
      ).join('\n\n');
    }
  } catch (err) {
    console.warn('[RAG] Failed to fetch context:', err.message);
  }

  const systemPrompt = context
    ? `You are NagaraVaani, a helpful civic assistant for Mandya, Karnataka.
Use the following real complaint records from the city database to answer the citizen's question accurately.
If the records are relevant, reference them. If not, answer from your general knowledge.
Keep responses concise and actionable. Always suggest using the complaint portal for new issues.

--- RELEVANT COMPLAINTS FROM DATABASE ---
${context}
--- END OF CONTEXT ---`
    : `You are NagaraVaani, a helpful civic assistant for Mandya, Karnataka.
Answer citizen questions about civic issues, departments, and services concisely.
Always suggest using the complaint portal for new issues.`;

  return ollamaChat(systemPrompt, userQuery);
}

// ── 6. Non-RAG simple answer (original, kept for compat) ──
export async function answerCitizenQuery(userQuery) {
  return answerCitizenQueryRAG(userQuery);  // upgrade: always use RAG
}

// ── 7. Kannada translation ────────────────────────────────
export async function translateToKannada(text) {
  return ollamaChat(
    `You are a translator. Translate the following text accurately to Kannada script.
Respond with only the Kannada translation, no explanation.`,
    text
  );
}

// ── 8. Generate AI problem summary ───────────────────────────
// Takes an array of complaint reports and generates a single sentence summary
export async function generateProblemSummary(reports) {
  if (!reports || reports.length === 0) {
    return 'No reports available.';
  }

  if (reports.length === 1) {
    // Single complaint - use its description directly or enhance slightly
    return reports[0];
  }

  const reportsText = reports.map((r, i) => `${i + 1}. ${r}`).join('\n');

  const systemPrompt = `You are summarizing civic infrastructure problems reported by citizens for the city of Mandya, Karnataka, India.

Respond with a single sentence of no more than 25 words describing the civic problem, its location, and impact. No preamble, no intro, just the sentence.`;

  const userPrompt = `Based on these ${reports.length} citizen reports, summarize the problem in one sentence (max 25 words):

Reports:
${reportsText}`;

  try {
    let summary = await callLLM(
      [{ role: 'user', content: userPrompt }],
      systemPrompt
    );

    // Clean up the response - trim whitespace
    summary = summary.trim();

    // Remove common preamble patterns
    // Pattern 1: "Here is a summary:" or similar meta-sentences followed by colon/newline
    summary = summary.replace(/^(Here is (a |the )?summary[\s:]+|Summary[\s:]+|Based on (the |these )?reports?[\s:]+)/i, '');
    // Pattern 2: Remove any line that ends with a colon at the start
    summary = summary.replace(/^[^\n]{0,50}:[\s]*/i, '');

    // Remove surrounding quotes if present
    summary = summary.replace(/^["']|["']$/g, '');

    // Final trim
    summary = summary.trim();

    // Hard truncation safety net - max 150 characters
    if (summary.length > 150) {
      summary = summary.substring(0, 150).trim();
      // Ensure we don't end mid-word
      const lastSpace = summary.lastIndexOf(' ');
      if (lastSpace > 120) {
        summary = summary.substring(0, lastSpace);
      }
    }

    return summary || reports[0];
  } catch (err) {
    console.warn('[AI SUMMARY] Failed to generate summary:', err.message);
    // Fallback: return first report or concatenated reports
    return reports.length > 1
      ? `${reports.length} citizens report issues including: ${reports[0].slice(0, 100)}...`
      : reports[0];
  }
}
