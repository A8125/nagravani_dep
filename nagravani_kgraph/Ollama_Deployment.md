---
tags: [deployment, ollama, ngrok, server, embedding]
---

# Ollama Deployment

## Why Ngrok?

Ollama runs locally for generating embeddings. Ngrok exposes it to the internet so the backend (running on a server) can call it remotely.

## Startup Commands

### Start Ngrok

```bash
ngrok http 11434
```

This exposes port 11434 (Ollama's default port) to a public URL like `https://abc123.ngrok.io`.

### Start Ollama

```bash
sudo pkill ollama && \
OLLAMA_HOST=0.0.0.0 \
OLLAMA_ORIGINS=* \
OLLAMA_MODELS=/var/lib/ollama/.ollama/models \
ollama serve
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `OLLAMA_HOST=0.0.0.0` | Bind to all interfaces (not just localhost) |
| `OLLAMA_ORIGINS=*` | Allow CORS from any origin |
| `OLLAMA_MODELS` | Path to models directory |

## Backend Configuration

The backend connects to Ollama via the ngrok URL. Set in `backend/.env`:

```
OLLAMA_BASE_URL=https://abc123.ngrok.io
```

## Model Used

`nomic-embed-text` - generates 768-dimension embeddings for complaint duplicate detection.

## Related
- [[Nagravani]]
- [[Complaint_System_Architecture]]
