from fastapi import APIRouter
from config import settings

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "groq_model": settings.GROQ_MODEL,
        "database": "configured"
    }

