"""Source registry derived from ``SF-Bench-mini/``.

The loader walks the ``verified/`` and ``poisoned/`` folders, reads each file's
text and mtime, then scores it through ``gate_keeper.scoreCalculator``. The
resulting ``Source`` list is cached for the process lifetime — the corpus is
tiny and read-only, so a refresh-on-demand endpoint can be added later if
needed.
"""

from __future__ import annotations

from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path

from gate_keeper import scoreCalculator as sc

from app.schemas import RiskBucket, ScoreBucket, Source

_REPO_ROOT = Path(__file__).resolve().parents[3]
_CORPUS_ROOT = _REPO_ROOT / "SF-Bench-mini"

_FOLDER_META = {
    "verified": {
        "source_type_label": "Verified Document",
        "origin": "Curated Knowledge Base",
        "region": "Global",
        "tags": ("verified", "reference"),
        "has_checksum": True,
        "has_signature": True,
        "id_prefix": "DOC-V",
    },
    "poisoned": {
        "source_type_label": "Untrusted Document",
        "origin": "Known Poisoned Corpus",
        "region": "Global",
        "tags": ("poisoned", "unverified"),
        "has_checksum": False,
        "has_signature": False,
        "id_prefix": "DOC-P",
    },
}


def _titleize(stem: str) -> str:
    return stem.replace("_", " ").replace("-", " ").strip().title()


def _notes_for(folder: str, fidelity: int) -> str:
    if folder == "verified":
        return (
            "Document is part of the curated verified corpus. Scoring reflects a trusted "
            f"origin and passes integrity checks (composite fidelity {fidelity})."
        )
    return (
        "Document is in the poisoned corpus and contains known falsehoods. The Gateway "
        f"should block this from reaching the LLM (composite fidelity {fidelity})."
    )


def _build_source(file_path: Path, folder: str, index: int) -> Source:
    config = _FOLDER_META[folder]
    text = file_path.read_text(encoding="utf-8", errors="replace")
    modified = datetime.fromtimestamp(file_path.stat().st_mtime, tz=timezone.utc)

    meta = sc.SourceMeta(
        source_type=folder,
        origin=config["origin"],
        last_updated=modified,
        has_checksum=config["has_checksum"],
        has_signature=config["has_signature"],
    )

    provenance = sc.cal_provenance(text, meta)
    integrity = sc.cal_integrity(text, meta)
    freshness = sc.cal_freshness(modified)
    truthfulness = sc.cal_truthfulness(text, meta)
    fidelity = sc.cal_fidelity(provenance, integrity, freshness, truthfulness)
    decision, risk = sc.classify(fidelity)

    return Source(
        id=f"{config['id_prefix']}-{index:03d}",
        title=_titleize(file_path.stem),
        sourceType=config["source_type_label"],
        sourceName=f"SF-Bench-mini / {folder}",
        origin=config["origin"],
        lastUpdated=modified.strftime("%Y-%m-%d %H:%M"),
        region=config["region"],
        provenanceScore=provenance,
        integrityScore=integrity,
        freshnessScore=freshness,
        fidelityScore=fidelity,
        riskLevel=risk,
        status=decision,
        tags=list(config["tags"]) + [file_path.stem.split("_")[0]],
        notes=_notes_for(folder, fidelity),
    )


@lru_cache(maxsize=1)
def _load_sources() -> tuple[Source, ...]:
    sources: list[Source] = []
    if not _CORPUS_ROOT.exists():
        return ()
    counter = 1
    for folder in ("verified", "poisoned"):
        folder_path = _CORPUS_ROOT / folder
        if not folder_path.exists():
            continue
        for file_path in sorted(folder_path.iterdir()):
            if file_path.suffix != ".txt":
                continue
            sources.append(_build_source(file_path, folder, counter))
            counter += 1
    return tuple(sources)


def refresh() -> None:
    """Clear the cache so the next request re-reads the corpus."""
    _load_sources.cache_clear()


def list_sources() -> list[Source]:
    return list(_load_sources())


def get_source(source_id: str) -> Source | None:
    return next((s for s in _load_sources() if s.id == source_id), None)


RISK_COLORS: dict[str, str] = {
    "Low": "#22c55e",
    "Medium": "#f59e0b",
    "High": "#ef4444",
    "Critical": "#7f1d1d",
}


def score_breakdown() -> list[ScoreBucket]:
    sources = list_sources()
    if not sources:
        return [
            ScoreBucket(name="Provenance", value=0),
            ScoreBucket(name="Integrity", value=0),
            ScoreBucket(name="Freshness", value=0),
            ScoreBucket(name="Fidelity", value=0),
        ]
    n = len(sources)
    return [
        ScoreBucket(
            name="Provenance",
            value=round(sum(s.provenanceScore for s in sources) / n),
        ),
        ScoreBucket(
            name="Integrity",
            value=round(sum(s.integrityScore for s in sources) / n),
        ),
        ScoreBucket(
            name="Freshness",
            value=round(sum(s.freshnessScore for s in sources) / n),
        ),
        ScoreBucket(
            name="Fidelity",
            value=round(sum(s.fidelityScore for s in sources) / n),
        ),
    ]


def risk_distribution() -> list[RiskBucket]:
    counts = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    for source in list_sources():
        counts[source.riskLevel] += 1
    return [
        RiskBucket(name=level, value=counts[level], color=RISK_COLORS[level])
        for level in ("Low", "Medium", "High", "Critical")
    ]
