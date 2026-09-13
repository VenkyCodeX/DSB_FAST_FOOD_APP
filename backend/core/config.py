import os
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
ADMIN_PIN = os.environ["ADMIN_PIN"]
DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"
OTP_TTL_SECONDS = int(os.getenv("OTP_TTL_SECONDS", "300"))
JWT_TTL_DAYS = int(os.getenv("JWT_TTL_DAYS", "30"))
JWT_ALGORITHM = "HS256"

DEFAULT_PREP_TIME = 15
ORDER_STATUSES = ["Order Received", "Preparing", "Ready", "Completed"]
BRANCH_IDS = ["nursi", "deglur"]
ACTIVE_BRANCHES = ["nursi"]
BRANCH_TZ = "Asia/Kolkata"
BRANCH_HOURS = {"nursi": ("11:00", "23:00")}  # mirrors frontend/src/data/branches.ts

# Seed data — mirrors frontend/src/data/menu.ts (name/price/category).
SEED_MENU = [
    ("Chicken Noodles", 80, "Noodles"),
    ("Egg Noodles", 70, "Noodles"),
    ("Veg Noodles", 60, "Noodles"),
    ("Chicken Fried Rice", 90, "Rice"),
    ("Egg Fried Rice", 75, "Rice"),
    ("Veg Fried Rice", 65, "Rice"),
    ("Chicken 65", 120, "Starters"),
    ("Chilli Chicken", 130, "Starters"),
    ("Veg Manchurian", 90, "Starters"),
    ("Cool Drinks", 30, "Drinks"),
]

SEED_COUPONS = [
    {"code": "DSB10", "discount": 10, "active": True, "description": "₹10 off any order"},
    {"code": "WELCOME20", "discount": 20, "active": True, "description": "₹20 off your first order"},
]
