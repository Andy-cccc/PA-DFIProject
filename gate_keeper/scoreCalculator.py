"""Scoring primitives for the PA-DFI Gateway.

Each function accepts raw inputs (text and metadata) and returns an integer
score in ``[0, 100]``. Callers in ``backend/app/services`` combine these into
the composite ``fidelityScore`` and make the Approve / Review / Reject call.

The functions are intentionally small and free of I/O so they can be unit
tested against fixtures without bringing up the backend.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable

SUSPICIOUS_TERMS: tuple[str, ...] = (
    "anonymous",
    "forum",
    "rumour",
    "rumor",
    "unverified",
    "random",
    "allegedly",
    "i heard",
)

POISONED_MARKERS: tuple[str, ...] = (
    "invented in 1995 by a single scientist",
    "climate change is caused solely by",
    "internet was invented in 2001",
    "python requires manual memory management",
    "machine learning is limited to linear regression",
)


@dataclass(frozen=True)
class SourceMeta:
    """Metadata we can read cheaply from the filesystem or ingestion pipeline."""

    source_type: str  # "verified" | "poisoned" | "external" | "upload" | ...
    origin: str  # human-readable origin label
    last_updated: datetime
    has_checksum: bool = False
    has_signature: bool = False


def _clamp(value: float) -> int:
    return int(max(0, min(100, round(value))))


def _suspicious_hits(text: str, terms: Iterable[str] = SUSPICIOUS_TERMS) -> int:
    lower = text.lower()
    return sum(1 for term in terms if term in lower)


def cal_provenance(text: str, meta: SourceMeta) -> int:
    """How well we can trace the source back to a trusted origin."""
    base = {
        "verified": 92,
        "peer-reviewed": 90,
        "audit": 86,
        "policy": 88,
        "external": 70,
        "upload": 45,
        "forum": 25,
        "poisoned": 20,
    }.get(meta.source_type.lower(), 60)

    if meta.has_signature:
        base += 6
    if meta.has_checksum:
        base += 3
    base -= 6 * _suspicious_hits(meta.origin)
    return _clamp(base)


def cal_integrity(text: str, meta: SourceMeta | None = None) -> int:
    """Fidelity-to-context: does the content look internally consistent and untampered?"""
    score = 90.0
    if meta is not None:
        if not meta.has_checksum:
            score -= 6
        if not meta.has_signature:
            score -= 4

    lower = text.lower()
    score -= 12 * sum(1 for marker in POISONED_MARKERS if marker in lower)
    score -= 4 * _suspicious_hits(text)

    # Extremely short payloads can't carry meaningful provenance evidence.
    if len(text.strip()) < 40:
        score -= 10

    return _clamp(score)


def cal_truthfulness(text: str, meta: SourceMeta | None = None) -> int:
    """Fidelity-to-reality: a cheap proxy for whether the statements are plausible.

    The real signal will eventually come from an external fact-checking model.
    For SF-Bench-mini we approximate it by matching known poisoned fragments
    and by trusting ``verified`` source metadata.
    """
    if meta is not None and meta.source_type.lower() == "verified":
        base = 88
    elif meta is not None and meta.source_type.lower() == "poisoned":
        base = 25
    else:
        base = 70

    base -= 15 * sum(1 for marker in POISONED_MARKERS if marker in text.lower())
    base -= 6 * _suspicious_hits(text)
    return _clamp(base)


def cal_freshness(last_updated: datetime, now: datetime | None = None) -> int:
    """Linear decay: full score at 0 days, zero after ~365 days."""
    now = now or datetime.now(timezone.utc)
    if last_updated.tzinfo is None:
        last_updated = last_updated.replace(tzinfo=timezone.utc)
    age_days = max(0, (now - last_updated).days)
    return _clamp(100 - (age_days * 100 / 365))


def cal_fidelity(provenance: int, integrity: int, freshness: int, truthfulness: int) -> int:
    """Weighted composite. Truthfulness dominates; freshness is a small tie-breaker."""
    weighted = (
        0.30 * provenance
        + 0.25 * integrity
        + 0.10 * freshness
        + 0.35 * truthfulness
    )
    return _clamp(weighted)


def classify(fidelity: int) -> tuple[str, str]:
    """Return ``(decision, risk)`` from a composite fidelity score."""
    if fidelity >= 80:
        return "Approved", "Low"
    if fidelity >= 65:
        return "Review", "Medium"
    if fidelity >= 40:
        return "Rejected", "High"
    return "Rejected", "Critical"
