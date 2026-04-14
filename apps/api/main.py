import logging
import os
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from config import settings

logger = logging.getLogger(__name__)

from database import get_pool, close_pool
from routes.auth import router as auth_router
from routes.patients import router as patients_router
from routes.mri import router as mri_router
from routes.feedback import router as feedback_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.HEATMAP_DIR, exist_ok=True)
    await get_pool()
    yield
    # Shutdown
    await close_pool()


app = FastAPI(
    title="NeuroAssist AI API",
    description="Clinical MRI decision-support backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url}: {exc}")
    logger.error(traceback.format_exc())
    return JSONResponse(status_code=500, content={"detail": str(exc)})

# Ensure static directories exist before mounting
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.HEATMAP_DIR, exist_ok=True)

# Serve uploaded images and heatmaps as static files
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/heatmaps", StaticFiles(directory=settings.HEATMAP_DIR), name="heatmaps")

# Register routers
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(patients_router, prefix="/api/patients", tags=["Patients"])
app.include_router(mri_router, prefix="/api/mri", tags=["MRI Scans"])
app.include_router(feedback_router, prefix="/api/feedback", tags=["Feedback"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
