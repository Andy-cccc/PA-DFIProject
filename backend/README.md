# Backend

FastAPI service that acts as the PA-DFI Gateway between the React dashboard and the scoring / RAG pipeline.

## Responsibilities

1. Expose the corpus (`SF-Bench-mini/`) and per-document scores as JSON.
2. Run the Gateway decision (**Approve / Review / Reject**) when the UI submits a source. Threshold logic lives here, not in the browser.
3. Aggregate metrics for the dashboard (counts, score distribution, risk buckets).
4. (Planned) Proxy `/ask` to the Chroma + Ollama RAG loop.

## Layout

```
backend/
├── app/
│   ├── main.py            # FastAPI app + CORS + router wiring
│   ├── schemas.py         # Pydantic models — the cross-stack contract
│   ├── api/
│   │   ├── sources.py     # GET /sources, GET /sources/{id}
│   │   ├── validate.py    # POST /validate
│   │   └── metrics.py     # GET /metrics/summary | /score-breakdown | /risk
│   └── services/
│       ├── registry.py    # Source catalogue (will be derived from SF-Bench-mini)
│       └── scoring.py     # Validation heuristic + decision rules
├── requirements.txt
└── README.md
```

## Run

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- Docs: <http://localhost:8000/docs>
- Health: <http://localhost:8000/health>

CORS is open to `http://localhost:5173` and `http://127.0.0.1:5173` (Vite dev server).

## Endpoints

| Method | Path | Body / Query | Returns |
|---|---|---|---|
| GET | `/sources` | — | `Source[]` |
| GET | `/sources/{id}` | — | `Source` (404 if missing) |
| POST | `/validate` | `{mode: "url" \| "file", input: string}` | `ValidationResult` |
| GET | `/metrics/summary` | — | `MetricsSummary` |
| GET | `/metrics/score-breakdown` | — | `ScoreBucket[]` |
| GET | `/metrics/risk` | — | `RiskBucket[]` |
| POST | `/ask` | `{question: string}` | `{answer, chunks[]}` — 503 if RAG deps missing |
| GET | `/health` | — | `{status: "ok"}` |

## Contract

All field names are mirrored verbatim by the frontend (`frontend/src/App.jsx`). If you rename a field here, update the React code in the same commit.

### `Source`
```ts
{
  id: string;                // "DOC-1001"
  title: string;
  sourceType: string;        // "Policy Document", "External Feed", ...
  sourceName: string;
  origin: string;            // human-readable provenance label
  lastUpdated: string;       // "2026-03-08 10:24"
  region: string;
  provenanceScore: number;   // 0-100
  integrityScore: number;
  freshnessScore: number;
  fidelityScore: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  status: "Approved" | "Review" | "Rejected";
  tags: string[];
  notes: string;
}
```

### `ValidationResult`
```ts
{
  sourceLabel: string;
  mode: "url" | "file";
  provenance: number;
  integrity: number;
  freshness: number;
  fidelity: number;
  decision: "Approved" | "Review" | "Rejected";
  risk: "Low" | "Medium" | "High" | "Critical";
  summary: string;           // human explanation shown in the UI
}
```

## Scoring rules

Implemented by `gate_keeper/scoreCalculator.py`. Every call flows through the same primitives whether it comes from the registry loader (for `/sources` and `/metrics/*`) or from a live `/validate` request.

| Signal | Where it comes from |
|---|---|
| `cal_provenance(text, meta)` | Base score lookup on `meta.source_type` (verified / peer-reviewed / audit / policy / external / upload / forum / poisoned), plus bonuses for checksum / signature, minus suspicious-origin penalties. |
| `cal_integrity(text, meta)` | Starts at 90, deducts for missing checksum / signature, known poisoned markers, suspicious terms in body, and payloads under 40 characters. |
| `cal_truthfulness(text, meta)` | Trusts `meta.source_type="verified"` (88 base) or distrusts `"poisoned"` (25 base); penalised by poisoned-marker matches. Placeholder for a real fact-checker. |
| `cal_freshness(last_updated)` | Linear decay: 100 at `now`, 0 at 365 days old. |
| `cal_fidelity(p, i, f, t)` | Weighted composite: `0.30·p + 0.25·i + 0.10·f + 0.35·t`. |
| `classify(fidelity)` | `≥80 → Approved/Low`, `≥65 → Review/Medium`, `≥40 → Rejected/High`, else `Rejected/Critical`. |

The functions are pure and free of I/O so they can be unit-tested against fixtures. Anything that gates "can this reach the LLM?" lives here — the React layer only renders decisions.

## Registry data source

`app/services/registry.py` walks `../SF-Bench-mini/verified` and `../SF-Bench-mini/poisoned`, reads each `.txt` file plus its mtime, runs the scoring primitives above, and caches the result with `lru_cache`. Call `registry.refresh()` to invalidate. No database — the corpus is tiny and read-only.

## `/ask` (RAG)

`POST /ask` wraps the Chroma + Ollama loop from `../mainPipeLine.py`:
- Corpus: `SF-Bench-mini/{verified,poisoned}/*.txt`
- Embeddings: `OllamaEmbeddings(model=nomic-embed-text)`
- Vector store: `Chroma(persist_directory=../chroma_db)`
- LLM: `Ollama(model=llama3)`

Dependencies are imported lazily, so the rest of the API works without `langchain` / `ollama` installed. If they are missing, `/ask` returns 503 with a clear message. To enable it:

```bash
pip install langchain-community langchain-chroma langchain-text-splitters
ollama pull nomic-embed-text
ollama pull llama3
```

Override the models via `OLLAMA_EMBED_MODEL` / `OLLAMA_LLM_MODEL`.

## Adding an endpoint

1. Add the Pydantic model to `app/schemas.py`.
2. Implement the logic as a pure function in `app/services/<area>.py`.
3. Add a thin route in `app/api/<area>.py` and include the router in `app/main.py`.
4. Consume it from `frontend/src/lib/api.js`.

Keep routes thin — parsing, validation, error mapping only. Business logic stays in `services/`.
