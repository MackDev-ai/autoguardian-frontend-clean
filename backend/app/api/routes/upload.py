from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.policy import Policy
from app.schemas.policy import PolicyCreate, PolicyRead
from app.services.ocr import extract_policy_metadata

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("", status_code=status.HTTP_200_OK)
def upload_document(file: UploadFile = File(...)) -> dict:
    contents = file.file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")
    return extract_policy_metadata(contents, file.filename)


@router.post("/policies/from-extraction", response_model=PolicyRead, status_code=status.HTTP_201_CREATED)
def create_policy_from_extraction(
    payload: PolicyCreate,
    db: Session = Depends(deps.get_db_session),
    current_user=Depends(deps.get_current_user),
) -> PolicyRead:
    policy = Policy(**payload.dict(), user_id=current_user.id)
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return PolicyRead.from_orm(policy)
