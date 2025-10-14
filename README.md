# AutoGuardian Platform

AutoGuardian to mobilny asystent do zarządzania polisami ubezpieczeniowymi i przeglądami pojazdów. Repozytorium zawiera:

- **mobile/** – aplikację Flutter (Riverpod + Material 3) z ekranami onboarding, dashboard, pojazdy, polisy oraz osią czasu zdarzeń.
- **backend/** – usługę FastAPI z bazą PostgreSQL (SQLAlchemy) oraz API do obsługi użytkowników, pojazdów, polis, zdarzeń, przypomnień, ofert i uploadu dokumentów.
- **src/** – dotychczasową aplikację Next.js (zostawiona do dalszego wykorzystania jako panel WWW).

## Uruchamianie backendu (MVP)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export SECRET_KEY="dev"
export DATABASE_URL="sqlite:///./dev.db"
uvicorn app.main:app --reload
```

Swagger dostępny pod `http://localhost:8000/api/v1/docs`.

## Uruchamianie aplikacji mobilnej

```bash
cd mobile
flutter pub get
flutter test
flutter run
```

## Struktura API (wybrane endpointy)

- `POST /api/v1/auth/register` – rejestracja użytkownika.
- `POST /api/v1/auth/login` – logowanie, zwraca access/refresh tokeny.
- `GET /api/v1/vehicles` – lista pojazdów użytkownika.
- `POST /api/v1/policies` – dodanie polisy (ręcznie lub z danych OCR).
- `POST /api/v1/upload` – wstępna ekstrakcja danych z pliku PDF/JPG.
- `POST /api/v1/offers/quote` – zwraca 3 przykładowe oferty wraz z wynikiem scoringu.

Szczegóły modeli znajdują się w katalogu `backend/app/schemas`.

## Testy

- Backend: `cd backend && pytest`
- Mobile: `cd mobile && flutter test`
