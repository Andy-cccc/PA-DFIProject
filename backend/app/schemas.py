from typing import List, Literal, Optional
from pydantic import BaseModel, Field

RiskLevel = Literal["Low", "Medium", "High", "Critical"]
Status = Literal["Approved", "Review", "Rejected"]
ValidationMode = Literal["url", "file"]


class Source(BaseModel):
    id: str
    title: str
    sourceType: str
    sourceName: str
    origin: str
    lastUpdated: str
    region: str
    provenanceScore: int
    integrityScore: int
    freshnessScore: int
    fidelityScore: int
    riskLevel: RiskLevel
    status: Status
    tags: List[str]
    notes: str


class ScoreBucket(BaseModel):
    name: str
    value: int


class RiskBucket(BaseModel):
    name: RiskLevel
    value: int
    color: str


class MetricsSummary(BaseModel):
    sourcesScanned: int
    approved: int
    flagged: int
    rejected: int
    averageFidelity: int
    integrityAlerts: int
    activeDataSources: int
    lastRefresh: str


class ValidationRequest(BaseModel):
    mode: ValidationMode
    input: str = Field(..., min_length=1)


class ValidationResult(BaseModel):
    sourceLabel: str
    mode: ValidationMode
    provenance: int
    integrity: int
    freshness: int
    fidelity: int
    decision: Status
    risk: RiskLevel
    summary: str
