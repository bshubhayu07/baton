import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
from app.seed_data import seed_demo_data
from app.routers import (
    auth,
    projects,
    sources,
    claims,
    conflicts,
    gaps,
    graph,
    handover,
    ledger,
    admin,
    demo
)

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger("baton")

# Ensure tables are created
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Baton — Evidence-Linked Knowledge Continuity API",
    description="Backend API for Baton. Verbatim quote span verification, RBAC permissions, custody ledger, and role-filtered handover compilation.",
    version="1.0.0"
)

@app.on_event("startup")
def on_startup():
    logger.info("Initializing Baton database tables...")
    Base.metadata.create_all(bind=engine)
    if settings.AUTO_SEED_DEMO:
        logger.info("Auto-seeding demo Payments Migration project...")
        try:
            seed_demo_data()
            logger.info("Demo data successfully loaded.")
        except Exception as e:
            logger.warning(f"Auto-seed exception: {e}")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under /api
app.include_router(auth.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(sources.router, prefix="/api")
app.include_router(claims.router, prefix="/api")
app.include_router(conflicts.router, prefix="/api")
app.include_router(gaps.router, prefix="/api")
app.include_router(graph.router, prefix="/api")
app.include_router(handover.router, prefix="/api")
app.include_router(ledger.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(demo.router, prefix="/api")

@app.get("/api/health")
def healthcheck():
    return {
        "status": "healthy",
        "service": "baton-backend",
        "environment": settings.ENVIRONMENT,
        "llm_provider": settings.LLM_PROVIDER
    }

@app.get("/")
def root():
    return {
        "name": "Baton API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_url": "/api/health"
    }
