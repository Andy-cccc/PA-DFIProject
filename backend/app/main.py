from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import ask, metrics, sources, validate

app = FastAPI(title="PA-DFI Gateway API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sources.router)
app.include_router(validate.router)
app.include_router(metrics.router)
app.include_router(ask.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
