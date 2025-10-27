from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, events, offers, policies, reminders, upload, vehicles
from app.core.config import get_settings

settings = get_settings()

# ✅ Domyślne dozwolone originy (można nadpisać w .env)
default_allowed_origins = [
    "https://app.autoguardian.pl",
    "https://autoguardian.pl",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Jeśli .env nie definiuje allowed_origins, ustaw domyślne
allowed_origins = getattr(settings, "allowed_origins", default_allowed_origins) or default_allowed_origins

app = FastAPI(title=settings.app_name, openapi_url=f"{settings.api_v1_prefix}/openapi.json")

# ✅ Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Routery z prefixem /api/v1
app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(vehicles.router, prefix=settings.api_v1_prefix)
app.include_router(policies.router, prefix=settings.api_v1_prefix)
app.include_router(events.router, prefix=settings.api_v1_prefix)
app.include_router(reminders.router, prefix=settings.api_v1_prefix)
app.include_router(offers.router, prefix=settings.api_v1_prefix)
app.include_router(upload.router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    """Prosty endpoint testowy"""
    return {"status": "ok"}
