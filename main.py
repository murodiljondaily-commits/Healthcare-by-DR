"""MediSelf FastAPI application entrypoint.

- Mounts all API routers under /api
- Serves the built React SPA from FRONTEND_DIST (with history fallback)
- Creates tables and seeds demo data on startup
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import ai, appointments, auth, doctor, health, medicines
from app.core.config import settings
from app.db.seed import seed
from app.db.session import Base, SessionLocal, engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("mediself")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Import models so they register on Base before create_all.
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    if settings.SEED_DEMO_DATA:
        db = SessionLocal()
        try:
            seed(db)
            logger.info("Demo data seeded (or already present).")
        except Exception as exc:  # pragma: no cover
            logger.error("Seeding failed: %s", exc)
        finally:
            db.close()
    logger.info("MediSelf started | env=%s | ai=%s | smtp=%s | verify=%s",
                settings.ENV, settings.ai_enabled, settings.smtp_enabled,
                settings.REQUIRE_EMAIL_VERIFICATION)
    yield


app = FastAPI(title=f"{settings.APP_NAME} API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- API routers ----
api_routers = [auth.router, medicines.router, appointments.router, health.router, doctor.router, ai.router]
for r in api_routers:
    app.include_router(r, prefix="/api")


@app.get("/api/health")
def health_check() -> dict:
    return {
        "ok": True,
        "service": "mediself-api",
        "ai": settings.ai_enabled,
        "smtp": settings.smtp_enabled,
        "verification": settings.REQUIRE_EMAIL_VERIFICATION,
    }


# ---- Static SPA serving ----
dist_dir = Path(settings.FRONTEND_DIST)
assets_dir = dist_dir / "assets"

if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")


@app.get("/{full_path:path}")
def spa_fallback(full_path: str):
    """Serve static files if they exist, otherwise index.html for SPA routes."""
    if full_path.startswith("api/"):
        return JSONResponse({"detail": "Not Found"}, status_code=404)

    if dist_dir.exists():
        candidate = dist_dir / full_path
        if full_path and candidate.is_file():
            return FileResponse(str(candidate))
        index = dist_dir / "index.html"
        if index.exists():
            return FileResponse(str(index))

    return JSONResponse(
        {
            "detail": "Frontend build not found. Run the frontend build, or set FRONTEND_DIST.",
            "expected_dist": str(dist_dir),
        },
        status_code=503,
    )
