from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, events, offers, policies, reminders, upload, vehicles
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title=settings.app_name, openapi_url=f"{settings.api_v1_prefix}/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(vehicles.router, prefix=settings.api_v1_prefix)
app.include_router(policies.router, prefix=settings.api_v1_prefix)
app.include_router(events.router, prefix=settings.api_v1_prefix)
app.include_router(reminders.router, prefix=settings.api_v1_prefix)
app.include_router(offers.router, prefix=settings.api_v1_prefix)
app.include_router(upload.router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["health"])  # pragma: no cover - simple ping endpoint
async def health() -> dict[str, str]:
    return {"status": "ok"}
