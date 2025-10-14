# AutoGuardian Backend

FastAPI backend implementing the MVP for the AutoGuardian vehicle insurance assistant. The service exposes REST APIs for authentication, vehicles, policies, events, reminders, OCR uploads and mocked offer comparisons.

## Local development

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export SECRET_KEY="dev"
export DATABASE_URL="sqlite:///./dev.db"
uvicorn app.main:app --reload
```

OpenAPI docs available at `http://localhost:8000/api/v1/docs`.

## Testing

```bash
pytest
```
