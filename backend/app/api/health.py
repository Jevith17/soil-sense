from fastapi import APIRouter
from app.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "pump_hardware_enabled": settings.PUMP_HARDWARE_ENABLED,
        "environment": settings.ENVIRONMENT
    }

