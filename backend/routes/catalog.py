from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from pymongo import ReturnDocument

from core.auth import require_admin, now
from core.db import db, serialize

router = APIRouter()


def _oid(value: str, label: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid {label} id.")


@router.get("/items")
async def list_items(branchId: str = "nursi"):
    items = await db.items.find({"branchId": branchId}).sort("name", 1).to_list(500)
    return [serialize(item) for item in items]


class SoldOutRequest(BaseModel):
    soldOut: bool


@router.patch("/admin/items/{item_id}/sold-out", dependencies=[Depends(require_admin)])
async def set_sold_out(item_id: str, body: SoldOutRequest):
    result = await db.items.find_one_and_update({"_id": _oid(item_id, "item")}, {"$set": {"soldOut": body.soldOut, "updatedAt": now()}}, return_document=ReturnDocument.AFTER)
    if not result:
        raise HTTPException(status_code=404, detail="Item not found.")
    return serialize(result)


@router.get("/updates")
async def list_updates(branchId: str | None = None):
    query: dict = {"active": True}
    if branchId:
        query["$or"] = [{"branchId": branchId}, {"branchId": None}, {"branchId": ""}]
    docs = await db.updates.find(query).sort("createdAt", -1).to_list(50)
    return [_update_out(doc) for doc in docs]


@router.get("/admin/updates", dependencies=[Depends(require_admin)])
async def admin_list_updates():
    docs = await db.updates.find({}).sort("createdAt", -1).to_list(200)
    return [_update_out(doc) for doc in docs]


class UpdateCreate(BaseModel):
    title: str
    description: str
    image: str | None = None
    branchId: str | None = None
    expiresAt: str | None = None


@router.post("/admin/updates", dependencies=[Depends(require_admin)])
async def create_update(body: UpdateCreate):
    if not body.title.strip() or not body.description.strip():
        raise HTTPException(status_code=400, detail="Title and description are required.")
    doc = {**body.model_dump(), "title": body.title.strip(), "description": body.description.strip(), "active": True, "createdAt": now()}
    result = await db.updates.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _update_out(doc)


class UpdateToggle(BaseModel):
    active: bool


@router.patch("/admin/updates/{update_id}", dependencies=[Depends(require_admin)])
async def toggle_update(update_id: str, body: UpdateToggle):
    doc = await db.updates.find_one_and_update({"_id": _oid(update_id, "update")}, {"$set": {"active": body.active}}, return_document=ReturnDocument.AFTER)
    if not doc:
        raise HTTPException(status_code=404, detail="Update not found.")
    return _update_out(doc)


@router.delete("/admin/updates/{update_id}", dependencies=[Depends(require_admin)])
async def delete_update(update_id: str):
    result = await db.updates.delete_one({"_id": _oid(update_id, "update")})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Update not found.")
    return {"success": True}


def _update_out(doc: dict) -> dict:
    created = doc.get("createdAt")
    return {
        "id": str(doc["_id"]),
        "title": doc.get("title", ""),
        "description": doc.get("description", ""),
        "image": doc.get("image"),
        "date": created.isoformat() if created else None,
        "active": bool(doc.get("active", True)),
        "branchId": doc.get("branchId"),
        "expiresAt": doc.get("expiresAt"),
    }
