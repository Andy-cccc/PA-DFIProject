"""Validation service used by ``POST /validate``.

Wraps the pure scoring primitives from ``gate_keeper.scoreCalculator`` so the
API layer stays thin.
"""

from __future__ import annotations

from datetime import datetime, timezone

from gate_keeper import scoreCalculator as sc

from app.schemas import ValidationMode, ValidationResult

_SUMMARIES = {
    "Approved": "The source appears suitable for downstream AI usage with low validation risk.",
    "Review": (
        "The source can be used only after manual review because some provenance evidence "
        "is incomplete."
    ),
    "Rejected": (
        "The source should be blocked from the AI pipeline because provenance and integrity "
        "signals are too weak."
    ),
}


def _infer_source_type(mode: ValidationMode, raw_input: str) -> str:
    lower = raw_input.lower()
    if any(marker in lower for marker in ("forum", "rumour", "rumor", "anonymous")):
        return "forum"
    if "unverified" in lower:
        return "poisoned"
    if mode == "file":
        return "upload"
    if lower.startswith(("https://", "http://")):
        return "external"
    return "external"


def run_validation(mode: ValidationMode, raw_input: str) -> ValidationResult:
    source_type = _infer_source_type(mode, raw_input)
    meta = sc.SourceMeta(
        source_type=source_type,
        origin=raw_input,
        last_updated=datetime.now(timezone.utc),
        has_checksum=mode == "url",
        has_signature=False,
    )

    provenance = sc.cal_provenance(raw_input, meta)
    integrity = sc.cal_integrity(raw_input, meta)
    freshness = sc.cal_freshness(meta.last_updated)
    truthfulness = sc.cal_truthfulness(raw_input, meta)
    fidelity = sc.cal_fidelity(provenance, integrity, freshness, truthfulness)
    decision, risk = sc.classify(fidelity)

    return ValidationResult(
        sourceLabel=raw_input or "Demo Input",
        mode=mode,
        provenance=provenance,
        integrity=integrity,
        freshness=freshness,
        fidelity=fidelity,
        decision=decision,
        risk=risk,
        summary=_SUMMARIES[decision],
    )
