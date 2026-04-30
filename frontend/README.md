# Frontend

Vite + React dashboard for the PA-DFI Gateway. Renders the registry of known sources, the scoring breakdown, and the live validation form. All data is fetched from the backend — there is no business logic in this layer.

## Stack

- Vite 8 + React 19
- Tailwind CSS 3 + shadcn/ui primitives (`src/components/ui/*`)
- framer-motion, recharts, lucide-react

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run preview
npm run lint
```

## Configuration

The API base URL is read from `VITE_API_BASE_URL`. The `.env` at the frontend root already sets:

```
VITE_API_BASE_URL=http://localhost:8000
```

## Structure

```
frontend/
├── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx              # single-page dashboard
│   ├── lib/
│   │   ├── api.js           # fetch wrapper — one function per endpoint
│   │   └── utils.js
│   └── components/ui/       # shadcn primitives (button, card, table, ...)
├── public/
├── tailwind.config.js
├── vite.config.js
└── package.json
```

## Data flow

1. `App.jsx` mounts → `useEffect` fires four parallel calls via `api.listSources / summary / scoreBreakdown / risk`.
2. Running a validation calls `api.validate(mode, input)` — the backend returns the decision and the UI renders it.
3. On any network failure a red banner appears at the top with the failing URL.

No caching, no global state library. If the dashboard grows past this page, introduce React Query rather than rolling your own cache.

## Conventions

- Field names mirror `backend/app/schemas.py` exactly — don't normalise or rename them client-side.
- Decisions (Approve / Review / Reject) are **display-only** here. The backend decides; the UI just styles.
- Keep presentational helpers (`scoreColor`, `badgeClasses`, `statusClasses`) local to `App.jsx` until a second file needs them.
