from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.core.security import create_access_token, create_refresh_token, get_password_hash
from app.models.user import User
from app.schemas import auth as schemas_auth
from app.schemas.user import UserCreate, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(deps.get_db_session)) -> UserRead:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=payload.email, password_hash=get_password_hash(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserRead.from_orm(user)


@router.post("/login", response_model=schemas_auth.Token)
def login(payload: schemas_auth.LoginRequest, db: Session = Depends(deps.get_db_session)) -> schemas_auth.Token:
    user = deps.authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    return schemas_auth.Token(
        access_token=create_access_token(user.email),
        refresh_token=create_refresh_token(user.email),
    )


@router.post("/refresh", response_model=schemas_auth.Token)
def refresh(payload: schemas_auth.RefreshRequest) -> schemas_auth.Token:
    from jose import JWTError, jwt

    try:
        decoded = jwt.decode(payload.refresh_token, deps.settings.secret_key, algorithms=["HS256"])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from exc
    subject = decoded.get("sub")
    if not subject:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    return schemas_auth.Token(
        access_token=create_access_token(subject),
        refresh_token=create_refresh_token(subject),
    )


@router.get("/me", response_model=schemas_auth.MeResponse)
def read_me(current_user: User = Depends(deps.get_current_user)) -> schemas_auth.MeResponse:
    upcoming = [
        {
            "type": "policy",
            "policy_id": policy.id,
            "end_date": policy.end_date,
        }
        for policy in sorted(current_user.policies, key=lambda p: p.end_date)
    ]
    return schemas_auth.MeResponse(
        id=current_user.id,
        email=current_user.email,
        created_at=current_user.created_at,
        vehicles_count=len(current_user.vehicles),
        policies_count=len(current_user.policies),
        upcoming_deadlines=upcoming[:5],
    )
