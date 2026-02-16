# CV Analyzer SaaS (MVP)

Tech stack:
- Next.js (frontend)
- Django REST Framework (backend)
- PostgreSQL
- Redis
- Celery
- Gemini API wrapper

## Quick start

1. Create `.env` in repo root:

```
DJANGO_SECRET_KEY=change-me
DJANGO_DEBUG=true
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://postgres:postgres@db:5432/cv_analyzer
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2
GEMINI_API_KEY=
ANALYZE_RESULT_TTL_SECONDS=1800
MAX_UPLOAD_SIZE_MB=10
```

2. Run services:

```
docker compose up -d --build
```

3. Backend migrations:

```
docker compose exec web python manage.py migrate
```

4. Frontend:

Open http://localhost:3000

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
