# PA-DFI Project

Provenance-Aware Data Fidelity & Integrity Gateway — a prototype that scores external documents on **provenance, integrity, freshness, and fidelity** before they are passed into a downstream RAG / LLM pipeline, and exposes the decisions through a dashboard.

## Repository layout

```
PA-DFIProject/
├── frontend/             # Vite + React dashboard (see frontend/README.md)
├── backend/              # FastAPI contract + scoring service (see backend/README.md)
├── gate_keeper/          # Pluggable scoring functions (integrity / truthfulness)
│   └── scoreCalculator.py
├── SF-Bench-mini/        # Corpus of verified / poisoned example documents
│   ├── verified/
│   ├── poisoned/
│   └── questions.json
├── chroma_db/            # Local persisted Chroma vectorstore
├── mainPipeLine.py       # Standalone RAG loop (Ollama + Chroma) used for research
├── test.py
└── LICENSE
```

## Architecture

```
 ┌────────────┐        HTTP/JSON        ┌──────────────────────┐
 │  frontend  │ ───────────────────────▶│  backend (FastAPI)   │
 │  (Vite)    │◀─────── decisions ──────│  /sources /validate  │
 └────────────┘                         │  /metrics /ask       │
                                        └──────────┬───────────┘
                                                   │
                                                   ▼
                                        ┌──────────────────────┐
                                        │  gate_keeper         │  provenance / integrity /
                                        │  scoreCalculator.py  │  freshness / fidelity
                                        └──────────┬───────────┘
                                                   ▼
                                        ┌──────────────────────┐
                                        │  SF-Bench-mini /     │  corpus + ground truth
                                        │  chroma_db + Ollama  │
                                        └──────────────────────┘
```

- **frontend** renders the dashboard. It holds no business logic — just fetches JSON and draws it.
- **backend** is the Gateway: it reads the corpus, asks `gate_keeper` for scores, and makes the Approve / Review / Reject decision. The decision lives on the server so it can be audited and not bypassed via devtools.
- **gate_keeper** is intentionally small and independent so scoring functions can be unit-tested and swapped without touching the API.
- **SF-Bench-mini** is the initial ground-truth corpus: files under `verified/` are trustworthy, files under `poisoned/` deliberately contain false statements. This split lets us validate whether a scoring function distinguishes them.

## Quickstart

Two processes. Run each in its own terminal.

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Open <http://localhost:8000/docs> for the auto-generated OpenAPI UI.

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
Open <http://localhost:5173>. It reads `VITE_API_BASE_URL` from `frontend/.env` (defaults to `http://localhost:8000`).

**(Optional) RAG pipeline** — only needed for `/ask` and `mainPipeLine.py`:
```bash
# install Ollama separately, then
ollama pull nomic-embed-text
ollama pull llama3
```

## Development conventions

- **Field names are shared across the stack.** The Pydantic schemas in `backend/app/schemas.py` are the source of truth; the frontend consumes them verbatim (`provenanceScore`, `fidelityScore`, `riskLevel`, etc). Don't rename on either side without updating both.
- **Decisions live on the server.** Anything that gates whether a document can reach the LLM (Approve / Review / Reject thresholds) belongs in `backend/app/services/scoring.py`, not in the React layer.
- **Mock first, real second.** The backend started by mirroring the frontend's hard-coded mock data so the contract could stabilize before real scoring logic landed. Features should follow the same pattern: stub the JSON shape first, wire the UI, then swap in the real implementation.

## Branches

- `main` — stable
- `Lu` / `Tian` / `Wang` — per-contributor integration branches

## Current status

- [x] Frontend extracted from single-file prototype, renamed to `frontend/`
- [x] Backend contract layer: `/sources`, `/validate`, `/metrics/*`
- [x] `gate_keeper/scoreCalculator.py` implements `cal_provenance`, `cal_integrity`, `cal_truthfulness`, `cal_freshness`, `cal_fidelity`, `classify`
- [x] Registry derives sources from `SF-Bench-mini/verified` + `SF-Bench-mini/poisoned`
- [x] `/ask` endpoint wrapping the Chroma + Ollama RAG loop (lazy deps)
- [ ] Persistent review / audit trail
- [ ] Replace keyword-match truthfulness with a real fact-checker
