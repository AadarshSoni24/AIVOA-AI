from routes.health import router as health_router
from routes.copilot import router as copilot_router
from routes.investigations import router as investigations_router

__all__ = ["health_router", "copilot_router", "investigations_router"]

