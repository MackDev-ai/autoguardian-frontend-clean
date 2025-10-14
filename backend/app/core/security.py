from datetime import datetime, timedelta
from typing import Any, Dict

from jose import jwt
from passlib.context import CryptContext

from app.core.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
settings = get_settings()


def create_token(subject: str, expires_delta: timedelta) -> str:
    to_encode: Dict[str, Any] = {"sub": subject, "exp": datetime.utcnow() + expires_delta}
    return jwt.encode(to_encode, settings.secret_key, algorithm="HS256")


def create_access_token(subject: str) -> str:
    expires = timedelta(minutes=settings.access_token_expire_minutes)
    return create_token(subject, expires)


def create_refresh_token(subject: str) -> str:
    expires = timedelta(minutes=settings.refresh_token_expire_minutes)
    return create_token(subject, expires)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
