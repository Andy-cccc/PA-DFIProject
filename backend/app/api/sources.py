from fastapi import APIRouter, HTTPException

from app.schemas import Source
from app.services import registry

router = APIRouter(prefix="/sources", tags=["sources"])


@router.get("", response_model=list[Source])
def get_sources() -> list[Source]:
    return registry.list_sources()


@router.get("/{source_id}", response_model=Source)
def get_source(source_id: str) -> Source:
    source = registry.get_source(source_id)
    if source is None:
        raise HTTPException(status_code=404, detail="Source not found")
    return source
