---
tags: [ai, ollama, embeddings, rag, translation, nlp]
---

# AI Features

## Architecture

All AI features run via **Ollama** (local LLM server) on port 11434. Ngrok exposes it for remote access.

| Model | Purpose | Dimensions |
|-------|---------|------------|
| `nomic-embed-text` | Text embeddings for search & dedup | 768 |
| `llama3.2:3b` | Chat completion, summarization, classification | — |

See [[Ollama_Deployment]] for setup.

## Embedding Service (`backend/embeddings.js`)

- `embed(text)` → Generates 768-dim vector via Ollama
- `toVectorLiteral(embedding)` → Formats as pgvector literal `[0.1,0.2,...]`
- `cosineSimilarity(a, b)` → In-process similarity (used for department routing)
- `isOllamaAvailable()` → Health check with 3s timeout
- All functions return null on failure (graceful fallback)

## Duplicate Detection

See [[Complaint_System_Architecture#Duplicate Detection]].

## RAG Chatbot (`POST /api/ai/ask`)

1. User submits a question
2. Question is embedded and used for vector similarity search against problems
3. Top 5 similar problems (with similarity > 0.60) are retrieved as context
4. Context + question sent to Ollama `llama3.2:3b` for answer generation
5. If `lang=kn`, answer is translated to Kannada

Implemented in `backend/ai.js:answerCitizenQueryRAG()`.

## Semantic Department Routing

Two methods:

1. **Vector-based** (primary): Compare complaint embedding against `department_embeddings` table → closest department
2. **LLM-based** (fallback): Use `llama3.2:3b` to classify complaint text into department

Implemented in `backend/ai.js:dispatchDepartmentSemantic()`.

## Severity Assessment

- **Quick (keyword)**: Regex-based for `backend/routes/complaints.js:42-50`
  - Critical: accident, injury, death, collapse, fire, flood, emergency, fatal
  - High: dangerous, broken, blocked, burst, leak, unsafe, overflow
  - Medium: damage, pothole, missing, dirty, smell, not working
  - Low: everything else
- **LLM-based** (fallback): `backend/ai.js:assessSeverity()` uses Ollama

## Category Classification

`backend/ai.js:classifyCategory()` uses Ollama to categorize free-text complaints when category is not provided.

## AI Summary Generation

After merging complaints into a problem, all descriptions are sent to Ollama with a prompt to generate a single-sentence summary. See `backend/routes/complaints.js:194-226`.

## Translation (`POST /api/ai/translate`)

English → Kannada translation via Ollama. Used by the chatbot and available as a standalone API. Implemented in `backend/ai.js:translateToKannada()`.

## FAQ (`GET /api/ai/faq`)

Returns a hardcoded list of common questions and answers about the complaint system.

## Similar Complaints (`GET /api/ai/similar`)

Semantic similarity search across the problems table. Accepts `q` (query text), `threshold` (default 0.60), `limit` (default 5). Returns similar problems with similarity scores and suggested department routing.

## Related

- [[Nagravani]]
- [[Complaint_System_Architecture]]
- [[Ollama_Deployment]]
