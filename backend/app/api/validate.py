from fastapi import APIRouter

from app.schemas import ValidationRequest, ValidationResult
from app.services import scoring

router = APIRouter(prefix="/validate", tags=["validate"])


@router.post("", response_model=ValidationResult)
def run_validation(request: ValidationRequest) -> ValidationResult:
    return scoring.run_validation(request.mode, request.input)
