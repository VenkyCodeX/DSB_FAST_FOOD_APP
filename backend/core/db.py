from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING

from core.config import BRANCH_IDS, DB_NAME, MONGO_URL, SEED_COUPONS, SEED_MENU

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]


async def init_db() -> None:
    await db.otps.create_index([("expireAt", ASCENDING)], expireAfterSeconds=0)
    await db.otps.create_index([("phone", ASCENDING), ("createdAt", DESCENDING)])
    await db.orders.create_index([("orderId", ASCENDING)], unique=True)
    await db.orders.create_index([("phoneNumber", ASCENDING), ("createdAt", DESCENDING)])
    await db.orders.create_index([("status", ASCENDING), ("createdAt", DESCENDING)])
    await db.items.create_index([("branchId", ASCENDING), ("name", ASCENDING)], unique=True)
    await db.coupons.create_index([("code", ASCENDING)], unique=True)
    await db.users.create_index([("phone", ASCENDING)], unique=True)

    for branch_id in BRANCH_IDS:
        for name, price, category in SEED_MENU:
            await db.items.update_one(
                {"branchId": branch_id, "name": name},
                {"$setOnInsert": {"price": price, "category": category, "soldOut": False}},
                upsert=True,
            )
    for coupon in SEED_COUPONS:
        await db.coupons.update_one({"code": coupon["code"]}, {"$setOnInsert": coupon}, upsert=True)


def serialize(doc: dict | None) -> dict | None:
    if doc is None:
        return None
    doc = dict(doc)
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc
