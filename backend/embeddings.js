// ─────────────────────────────────────────────────────────
//  embeddings.js  —  Text Embeddings via Ollama (local)
//  Model: nomic-embed-text (768-dimensional vectors)
// ─────────────────────────────────────────────────────────

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

// ── Check if Ollama is available ───────────────────────
export async function isOllamaAvailable() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

// ── Generate a single embedding vector ───────────────────
// Returns null if Ollama is unavailable instead of throwing
export async function embed(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        input: text
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[EMBED] Ollama returned ${response.status}, skipping embeddings`);
      return null;
    }

    const data = await response.json();
    const embedding = data.embeddings?.[0] ?? data.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      console.warn('[EMBED] Invalid embedding response, skipping');
      return null;
    }

    return embedding; // float[] length 768
  } catch (err) {
    console.warn('[EMBED] Ollama unavailable:', err.message);
    return null;
  }
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
