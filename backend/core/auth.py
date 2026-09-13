from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError

from core.config import JWT_ALGORITHM, JWT_SECRET, JWT_TTL_DAYS

bearer = HTTPBearer(auto_error=False)


def now() -> datetime:
    return datetime.now(timezone.utc)


def issue_jwt(subject: str, role: str) -> str:
    issued = now()
    payload = {"sub": subject, "role": role, "iat": issued, "exp": issued + timedelta(days=JWT_TTL_DAYS)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_jwt(token: str) -> dict:
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    if not payload.get("sub") or not payload.get("role"):
        raise InvalidTokenError("missing claims")
    return payload


async def current_identity(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> dict:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Please sign in to continue.")
    try:
        return decode_jwt(credentials.credentials)
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Your session has expired. Please sign in again.")


async def optional_identity(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> dict | None:
    if credentials is None:
        return None
    try:
        return decode_jwt(credentials.credentials)
    except InvalidTokenError:
        return None


async def require_admin(identity: dict = Depends(current_identity)) -> dict:
    if identity.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")
    return identity
