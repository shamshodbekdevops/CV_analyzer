# CV Analyzer SaaS (MVP)

Tech stack:
- Next.js (frontend)
- Django REST Framework (backend)
- PostgreSQL
- Redis
- Celery
- Gemini API wrapper

## Security note
- Keep all secrets in local `.env` only.
- `.env` is ignored by git and must not be pushed to GitHub.

## Quick start (Docker)

1. Create `.env` from template:

```bash
cp .env.example .env
```

2. Edit `.env` values (required):

```env
DJANGO_SECRET_KEY=your-long-random-secret
POSTGRES_DB=cv_analyzer
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@db:5432/cv_analyzer
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

3. Start services:

```bash
docker compose up -d --build
```

4. Run migrations:

```bash
docker compose exec web python manage.py makemigrations
docker compose exec web python manage.py migrate
```

5. Open app:
- Frontend: http://localhost:3000
- Backend admin: http://localhost:8000/admin

## API
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/analyze`
- `GET /api/analyze/{job_id}`
- `POST /api/resumes`
- `GET /api/resumes`
- `GET /api/resumes/{id}`
- `PATCH /api/resumes/{id}`
- `POST /api/resumes/{id}/share`
- `GET /api/admin/metrics`
