import secrets
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from pymongo import ReturnDocument

from core.auth import current_identity, now, require_admin
from core.config import ACTIVE_BRANCHES, BRANCH_HOURS, BRANCH_TZ, CANCELLED, CUSTOMER_CANCEL_WINDOW_SECONDS, DEFAULT_PREP_TIME, ORDER_STATUSES
from core.db import db, serialize

router = APIRouter()


def _branch_open(branch_id: str) -> bool:
    hours = BRANCH_HOURS.get(branch_id)
    if not hours:
        return False
    local = datetime.now(ZoneInfo(BRANCH_TZ))
    minutes = local.hour * 60 + local.minute
    open_h, open_m = map(int, hours[0].split(":"))
    close_h, close_m = map(int, hours[1].split(":"))
    opening, closing = open_h * 60 + open_m, close_h * 60 + close_m
    return opening <= minutes < closing if opening <= closing else minutes >= opening or minutes < closing


class OrderItemIn(BaseModel):
    name: str
    price: float = Field(ge=0)
    quantity: int = Field(ge=1)


class OrderCreate(BaseModel):
    customerName: str = Field(min_length=1)
    phoneNumber: str = Field(pattern=r"^\d{10}$")
    address: str = Field(min_length=1)
    itemsOrdered: list[OrderItemIn] = Field(min_length=1)
    notes: str = Field(default="", max_length=200)
    deliveryTime: str = Field(default="ASAP", pattern=r"^(ASAP|([01]\d|2[0-3]):[0-5]\d)$")
    totalAmount: float = Field(ge=0)
    couponCode: str | None = ""
    discount: float = 0
    deliveryCharge: float = 0
    paymentMethod: str = "cod"
    transactionId: str | None = ""
    branchId: str = "nursi"
    branchName: str | None = None
    branchAddress: str | None = None


class CouponRequest(BaseModel):
    code: str


class RatingRequest(BaseModel):
    rating: int = Field(ge=1, le=5)
    review: str = ""


class StatusRequest(BaseModel):
    status: str


class RejectRequest(BaseModel):
    reason: str = Field(min_length=2, max_length=200)


def _order_out(doc: dict) -> dict:
    out = serialize(doc)
    for key in ("createdAt", "updatedAt", "deliveredAt", "ratedAt", "cancelledAt"):
        if out.get(key) is not None and hasattr(out[key], "isoformat"):
            out[key] = out[key].isoformat()
    created = doc.get("createdAt")
    if created is not None and doc.get("status") == "Order Received":
        created_aware = created if created.tzinfo else created.replace(tzinfo=timezone.utc)
        remaining = CUSTOMER_CANCEL_WINDOW_SECONDS - (now() - created_aware).total_seconds()
        out["cancelWindowSeconds"] = max(0, int(remaining))
    else:
        out["cancelWindowSeconds"] = 0
    return out


async def _new_order_id() -> str:
    while True:
        candidate = f"DSB-{secrets.randbelow(900000) + 100000}"
        if not await db.orders.find_one({"orderId": candidate}):
            return candidate


@router.post("/orders/coupon/validate")
async def validate_coupon(body: CouponRequest):
    coupon = await db.coupons.find_one({"code": body.code.strip().upper(), "active": True})
    if not coupon:
        return {"valid": False, "discount": 0, "message": "This coupon is not valid."}
    return {"valid": True, "discount": coupon["discount"], "message": coupon.get("description", "Coupon applied")}


@router.post("/orders")
async def create_order(body: OrderCreate, identity: dict = Depends(current_identity)):
    if identity["role"] == "user" and identity["sub"] != body.phoneNumber:
        raise HTTPException(status_code=403, detail="Phone number does not match your signed-in account.")
    if body.branchId not in ACTIVE_BRANCHES:
        raise HTTPException(status_code=400, detail="This branch is not accepting orders yet.")
    if not _branch_open(body.branchId):
        raise HTTPException(status_code=400, detail=f"This branch is closed right now. We open at {BRANCH_HOURS[body.branchId][0]}.")
    order_id = await _new_order_id()
    created = now()
    doc = {
        **body.model_dump(),
        "itemsOrdered": [item.model_dump() for item in body.itemsOrdered],
        "notes": body.notes.strip(),
        "deliveryTime": body.deliveryTime,
        "orderId": order_id,
        "status": "Order Received",
        "prepTime": DEFAULT_PREP_TIME,
        "deliveryConfirmed": False,
        "rating": None,
        "review": "",
        "createdAt": created,
        "updatedAt": created,
    }
    await db.orders.insert_one(doc)
    await db.users.update_one({"phone": body.phoneNumber}, {"$set": {"name": body.customerName, "address": body.address}})
    return {"success": True, "orderId": order_id, "prepTime": DEFAULT_PREP_TIME}


@router.get("/orders/by-phone/{phone}")
async def orders_by_phone(phone: str, identity: dict = Depends(current_identity)):
    if identity["role"] == "user" and identity["sub"] != phone:
        raise HTTPException(status_code=403, detail="You can only view your own orders.")
    docs = await db.orders.find({"phoneNumber": phone}).sort("createdAt", -1).to_list(200)
    return [_order_out(doc) for doc in docs]


@router.get("/orders/{order_id}")
async def order_by_id(order_id: str):
    doc = await db.orders.find_one({"orderId": order_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found.")
    return _order_out(doc)


@router.patch("/orders/{order_id}/delivery-confirm")
async def confirm_delivery(order_id: str, identity: dict = Depends(current_identity)):
    doc = await db.orders.find_one({"orderId": order_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found.")
    if identity["role"] == "user" and identity["sub"] != doc["phoneNumber"]:
        raise HTTPException(status_code=403, detail="This is not your order.")
    if doc["status"] != "Ready":
        raise HTTPException(status_code=400, detail="Delivery can be confirmed once the order is Ready.")
    updated = await db.orders.find_one_and_update(
        {"orderId": order_id},
        {"$set": {"status": "Completed", "deliveryConfirmed": True, "deliveredAt": now(), "updatedAt": now()}},
        return_document=ReturnDocument.AFTER,
    )
    return {"success": True, "order": _order_out(updated)}


@router.patch("/orders/{order_id}/rating")
async def rate_order(order_id: str, body: RatingRequest, identity: dict = Depends(current_identity)):
    doc = await db.orders.find_one({"orderId": order_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found.")
    if identity["role"] == "user" and identity["sub"] != doc["phoneNumber"]:
        raise HTTPException(status_code=403, detail="This is not your order.")
    if doc["status"] != "Completed":
        raise HTTPException(status_code=400, detail="You can rate an order after it is completed.")
    updated = await db.orders.find_one_and_update(
        {"orderId": order_id},
        {"$set": {"rating": body.rating, "review": body.review.strip(), "ratedAt": now(), "updatedAt": now()}},
        return_document=ReturnDocument.AFTER,
    )
    return {"success": True, "order": _order_out(updated)}


@router.patch("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, identity: dict = Depends(current_identity)):
    doc = await db.orders.find_one({"orderId": order_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found.")
    if identity["role"] == "user" and identity["sub"] != doc["phoneNumber"]:
        raise HTTPException(status_code=403, detail="This is not your order.")
    if doc["status"] == CANCELLED:
        return {"success": True, "order": _order_out(doc)}
    if doc["status"] != "Order Received":
        raise HTTPException(status_code=400, detail="The kitchen has already started this order, so it can't be cancelled. Please call the branch.")
    created = doc["createdAt"] if doc["createdAt"].tzinfo else doc["createdAt"].replace(tzinfo=timezone.utc)
    if (now() - created).total_seconds() > CUSTOMER_CANCEL_WINDOW_SECONDS:
        raise HTTPException(status_code=400, detail="The 2-minute cancellation window has passed. Please call the branch.")
    updated = await db.orders.find_one_and_update(
        {"orderId": order_id, "status": "Order Received"},
        {"$set": {"status": CANCELLED, "cancelledBy": "customer", "cancelReason": "Cancelled by customer", "cancelledAt": now(), "updatedAt": now()}},
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        raise HTTPException(status_code=400, detail="The order could not be cancelled anymore.")
    return {"success": True, "order": _order_out(updated)}

@router.get("/admin/orders", dependencies=[Depends(require_admin)])
async def admin_orders(status: str | None = None, branchId: str | None = None, limit: int = 100):
    query: dict = {}
    if status == "active":
        query["status"] = {"$nin": ["Completed", CANCELLED]}
    elif status in ORDER_STATUSES or status == CANCELLED:
        query["status"] = status
    if branchId:
        query["branchId"] = branchId
    docs = await db.orders.find(query).sort("createdAt", -1).to_list(min(max(limit, 1), 500))
    return [_order_out(doc) for doc in docs]


@router.get("/admin/orders/summary", dependencies=[Depends(require_admin)])
async def admin_summary():
    pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    counts = {row["_id"]: row["count"] for row in await db.orders.aggregate(pipeline).to_list(10)}
    local_now = datetime.now(ZoneInfo(BRANCH_TZ))
    start_of_day = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_rows = await db.orders.aggregate([
        {"$match": {"createdAt": {"$gte": start_of_day}}},
        {"$group": {"_id": None, "count": {"$sum": {"$cond": [{"$eq": ["$status", CANCELLED]}, 0, 1]}}, "cancelled": {"$sum": {"$cond": [{"$eq": ["$status", CANCELLED]}, 1, 0]}}, "revenue": {"$sum": {"$cond": [{"$eq": ["$status", CANCELLED]}, 0, "$totalAmount"]}}, "completed": {"$sum": {"$cond": [{"$eq": ["$status", "Completed"]}, 1, 0]}}}},
    ]).to_list(1)
    today = today_rows[0] if today_rows else {"count": 0, "revenue": 0, "completed": 0, "cancelled": 0}
    return {
        **{status: counts.get(status, 0) for status in ORDER_STATUSES},
        CANCELLED: counts.get(CANCELLED, 0),
        "today": {"count": today["count"], "revenue": round(float(today["revenue"] or 0), 2), "completed": today["completed"], "cancelled": today["cancelled"], "date": start_of_day.date().isoformat()},
    }


@router.get("/admin/orders/weekly", dependencies=[Depends(require_admin)])
async def admin_weekly():
    tz = ZoneInfo(BRANCH_TZ)
    today = datetime.now(tz).replace(hour=0, minute=0, second=0, microsecond=0)
    start = today - timedelta(days=6)
    rows = await db.orders.aggregate([
        {"$match": {"createdAt": {"$gte": start}, "status": {"$ne": CANCELLED}}},
        {"$group": {"_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt", "timezone": BRANCH_TZ}}, "count": {"$sum": 1}, "revenue": {"$sum": "$totalAmount"}}},
    ]).to_list(10)
    by_day = {row["_id"]: row for row in rows}
    days = []
    for offset in range(7):
        day = start + timedelta(days=offset)
        key = day.date().isoformat()
        row = by_day.get(key, {"count": 0, "revenue": 0})
        days.append({"date": key, "label": day.strftime("%a"), "count": row["count"], "revenue": round(float(row["revenue"] or 0), 2)})
    return {"days": days, "totalOrders": sum(d["count"] for d in days), "totalRevenue": round(sum(d["revenue"] for d in days), 2)}


@router.get("/admin/orders/top-items", dependencies=[Depends(require_admin)])
async def admin_top_items(days: int = 7, limit: int = 8):
    start = datetime.now(ZoneInfo(BRANCH_TZ)).replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=max(0, days - 1))
    rows = await db.orders.aggregate([
        {"$match": {"createdAt": {"$gte": start}, "status": {"$ne": CANCELLED}}},
        {"$unwind": "$itemsOrdered"},
        {"$group": {"_id": "$itemsOrdered.name", "quantity": {"$sum": "$itemsOrdered.quantity"}, "revenue": {"$sum": {"$multiply": ["$itemsOrdered.price", "$itemsOrdered.quantity"]}}, "orders": {"$sum": 1}}},
        {"$sort": {"quantity": -1, "revenue": -1}},
        {"$limit": min(max(limit, 1), 20)},
    ]).to_list(20)
    return {"days": days, "items": [{"name": row["_id"], "quantity": row["quantity"], "orders": row["orders"], "revenue": round(float(row["revenue"] or 0), 2)} for row in rows]}


@router.patch("/admin/orders/{order_id}/reject", dependencies=[Depends(require_admin)])
async def admin_reject(order_id: str, body: RejectRequest):
    doc = await db.orders.find_one({"orderId": order_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found.")
    if doc["status"] == "Completed":
        raise HTTPException(status_code=400, detail="Completed orders can't be rejected.")
    updated = await db.orders.find_one_and_update(
        {"orderId": order_id},
        {"$set": {"status": CANCELLED, "cancelledBy": "admin", "cancelReason": body.reason.strip(), "cancelledAt": now(), "updatedAt": now()}},
        return_document=ReturnDocument.AFTER,
    )
    return _order_out(updated)


@router.patch("/admin/orders/{order_id}/status", dependencies=[Depends(require_admin)])
async def admin_set_status(order_id: str, body: StatusRequest):
    if body.status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status must be one of {', '.join(ORDER_STATUSES)}.")
    existing = await db.orders.find_one({"orderId": order_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Order not found.")
    if existing["status"] == CANCELLED:
        raise HTTPException(status_code=400, detail="This order was cancelled and can't be moved.")
    update: dict = {"status": body.status, "updatedAt": now()}
    if body.status == "Completed":
        update["deliveredAt"] = now()
    updated = await db.orders.find_one_and_update({"orderId": order_id}, {"$set": update}, return_document=ReturnDocument.AFTER)
    if not updated:
        raise HTTPException(status_code=404, detail="Order not found.")
    return _order_out(updated)
