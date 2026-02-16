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

## Step-by-step run guide (Docker, Windows CMD)

1. Open `cmd` and go to the project folder:

```cmd
cd /d D:\SaaS\CV_analyzer
```

2. Create `.env` from `.env.example` (first time only):

```cmd
copy .env.example .env
```

3. Edit `.env` values (required):

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
GEMINI_API_KEY=your-gemini-api-key
```

4. Start all services:

```cmd
docker compose up -d --build
```

5. Run database migrations:

```cmd
docker compose exec web python manage.py makemigrations
docker compose exec web python manage.py migrate
```

6. Verify containers are running:

```cmd
docker compose ps
```

7. Open the app:
- Frontend: http://localhost:3000
- Backend admin: http://localhost:8000/admin

## Daily usage commands (CMD)

Start existing containers:
```cmd
docker compose up -d
```

Stop containers:
```cmd
docker compose down
```

Restart one service:
```cmd
docker compose restart web
docker compose restart worker
```

Watch logs:
```cmd
docker compose logs --tail=200 web
docker compose logs --tail=200 worker
docker compose logs --tail=200 frontend
```

Rebuild after code/dependency changes:
```cmd
docker compose up -d --build
```

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
