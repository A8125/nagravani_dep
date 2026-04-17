// ─────────────────────────────────────────────────────────
//  embeddings.js  —  Text Embeddings via Ollama (local)
//  Model: nomic-embed-text (768-dimensional vectors)
// ─────────────────────────────────────────────────────────

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

// ── Generate a single embedding vector ───────────────────
export async function embed(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('embed() requires a non-empty string');
  }

  const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: text
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.embedding || !Array.isArray(data.embedding)) {
    throw new Error('Unexpected Ollama embed response shape');
  }

  return data.embedding; // float[] length 768
}

// ── Batch embed (sequential to avoid rate limits) ──
export async function embedBatch(texts) {
  const results = [];
  for (const t of texts) {
    results.push(await embed(t));
  }
  return results;
}

// ── Format a JS float[] as a pgvector literal ─────────────
// pgvector expects '[0.1,0.2,...]' string for parameterised queries
export function toVectorLiteral(embedding) {
  return `[${embedding.join(',')}]`;
}

// ── Cosine similarity between two JS arrays ───────────────
// (used for in-process checks; DB-side comparison is faster for bulk)
export function cosineSimilarity(a, b) {
  if (a.length !== b.length) throw new Error('Vector length mismatch');
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ── Build a complaint text blob for embedding ─────────────
// Combines title + description so the vector captures full semantics
// Matches nagravani exactly: "${title} ${description}"
export function buildComplaintText({ title, description }) {
  return `${title} ${description}`;
}
