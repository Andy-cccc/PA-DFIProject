from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services import rag

router = APIRouter(prefix="/ask", tags=["ask"])


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1)


class RetrievedChunkOut(BaseModel):
    content: str
    sourceType: str | None
    integrity: int


class AskResponse(BaseModel):
    answer: str
    chunks: list[RetrievedChunkOut]


@router.post("", response_model=AskResponse)
def ask(request: AskRequest) -> AskResponse:
    try:
        result = rag.ask(request.question)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return AskResponse(
        answer=result.answer,
        chunks=[
            RetrievedChunkOut(
                content=chunk.content,
                sourceType=chunk.source_type,
                integrity=chunk.integrity,
            )
            for chunk in result.chunks
        ],
    )
