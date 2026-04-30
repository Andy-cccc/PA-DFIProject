from datetime import datetime, timezone

from fastapi import APIRouter

from app.schemas import MetricsSummary, RiskBucket, ScoreBucket
from app.services import registry

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/summary", response_model=MetricsSummary)
def get_summary() -> MetricsSummary:
    sources = registry.list_sources()
    approved = sum(1 for s in sources if s.status == "Approved")
    flagged = sum(1 for s in sources if s.status == "Review")
    rejected = sum(1 for s in sources if s.status == "Rejected")
    avg_fidelity = (
        round(sum(s.fidelityScore for s in sources) / len(sources)) if sources else 0
    )
    integrity_alerts = sum(1 for s in sources if s.integrityScore < 70)
    return MetricsSummary(
        sourcesScanned=len(sources),
        approved=approved,
        flagged=flagged,
        rejected=rejected,
        averageFidelity=avg_fidelity,
        integrityAlerts=integrity_alerts,
        activeDataSources=len({s.sourceName for s in sources}),
        lastRefresh=datetime.now(timezone.utc).isoformat(timespec="seconds"),
    )


@router.get("/score-breakdown", response_model=list[ScoreBucket])
def get_score_breakdown() -> list[ScoreBucket]:
    return registry.score_breakdown()


@router.get("/risk", response_model=list[RiskBucket])
def get_risk() -> list[RiskBucket]:
    return registry.risk_distribution()
