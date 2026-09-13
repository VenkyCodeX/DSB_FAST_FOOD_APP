import logging
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware

from core.db import client, init_db
from routes import auth, catalog, orders

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("dsb")


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    logger.info("DSB backend ready")
    yield
    client.close()


app = FastAPI(title="DSB Fast Food API", lifespan=lifespan)

api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"service": "DSB Fast Food API", "ok": True}


@api_router.get("/health")
async def health():
    return {"ok": True}


api_router.include_router(auth.router)
api_router.include_router(catalog.router)
api_router.include_router(orders.router)
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
