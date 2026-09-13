import secrets
from datetime import datetime, timedelta, timezone
from hmac import compare_digest

import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from pymongo import ReturnDocument

from core.auth import issue_jwt, now, require_admin
from core.config import ADMIN_PIN, DEV_MODE, OTP_TTL_SECONDS
from core.db import db

router = APIRouter()

PHONE_PATTERN = r"^\d{10}$"


def _aware(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


class PhoneRequest(BaseModel):
    phone: str = Field(pattern=PHONE_PATTERN)


class VerifyRequest(PhoneRequest):
    otp: str = Field(pattern=r"^\d{6}$")


class AdminLoginRequest(BaseModel):
    pin: str = Field(min_length=4, max_length=64)


class ChangePinRequest(BaseModel):
    newPin: str = Field(min_length=4, max_length=32, pattern=r"^\S+$")


async def _verify_admin_pin(pin: str) -> bool:
    stored = await db.settings.find_one({"key": "adminPinHash"})
    if stored:
        return bcrypt.checkpw(pin.encode(), stored["value"].encode())
    return compare_digest(pin, ADMIN_PIN)


@router.post("/otp/send")
async def send_otp(body: PhoneRequest):
    # Simple resend cooldown: one OTP per phone every 30 seconds.
    latest = await db.otps.find_one({"phone": body.phone}, sort=[("createdAt", -1)])
    if latest and (now() - _aware(latest["createdAt"])).total_seconds() < 30:
        raise HTTPException(status_code=429, detail="Please wait a few seconds before requesting another OTP.")

    otp = f"{secrets.randbelow(1_000_000):06d}"
    created = now()
    await db.otps.insert_one({
        "phone": body.phone,
        "otpHash": bcrypt.hashpw(otp.encode(), bcrypt.gensalt()).decode(),
        "createdAt": created,
        "expireAt": created + timedelta(seconds=OTP_TTL_SECONDS),
        "used": False,
        "attempts": 0,
    })
    # PRODUCTION: send `otp` through an SMS provider here and drop devOtp.
    result: dict = {"success": True, "message": "OTP sent"}
    if DEV_MODE:
        result["devOtp"] = otp
    return result


@router.post("/otp/verify")
async def verify_otp(body: VerifyRequest):
    record = await db.otps.find_one_and_update(
        {"phone": body.phone, "used": False, "expireAt": {"$gt": now()}, "attempts": {"$lt": 5}},
        {"$inc": {"attempts": 1}},
        sort=[("createdAt", -1)],
        return_document=ReturnDocument.AFTER,
    )
    if not record or not bcrypt.checkpw(body.otp.encode(), record["otpHash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid or expired OTP. Please try again.")
    await db.otps.update_one({"_id": record["_id"]}, {"$set": {"used": True}})

    user = await db.users.find_one_and_update(
        {"phone": body.phone},
        {"$setOnInsert": {"name": "", "address": "", "createdAt": now()}, "$set": {"lastLoginAt": now()}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return {"token": issue_jwt(body.phone, "user"), "user": {"name": user.get("name", ""), "phone": body.phone, "address": user.get("address", "")}}


@router.post("/admin/login")
async def admin_login(body: AdminLoginRequest):
    if not await _verify_admin_pin(body.pin):
        raise HTTPException(status_code=401, detail="Incorrect admin PIN.")
    return {"token": issue_jwt("admin", "admin"), "role": "admin"}


@router.post("/admin/change-pin", dependencies=[Depends(require_admin)])
async def change_admin_pin(body: ChangePinRequest):
    await db.settings.update_one(
        {"key": "adminPinHash"},
        {"$set": {"value": bcrypt.hashpw(body.newPin.encode(), bcrypt.gensalt()).decode(), "updatedAt": now()}},
        upsert=True,
    )
    return {"success": True, "message": "Admin PIN updated."}
