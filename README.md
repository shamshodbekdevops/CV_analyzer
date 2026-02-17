# CV Analyzer SaaS (MVP)

Tech stack:
- Next.js (frontend)
- Django REST Framework (backend)
- PostgreSQL
- Redis
- Celery
- Gemini API wrapper

## What This Project Does
CV Analyzer is a SaaS-style platform that helps users improve their resumes with AI-powered feedback.
Users can upload a CV, get ATS-style analysis, rewrite suggestions, and keyword gap detection, then save and share improved versions.

## Core Product Flows
- Analyze-only flow: Upload CV -> async analysis job -> polling result (not permanently stored by default).
- Save flow: User explicitly saves the analyzed CV to PostgreSQL with version history.
- Share flow: User generates a view-only share token and sends a public link.

## Key Capabilities
- Analyze source choice: `CV file` or `GitHub profile/repository URL`.
- AI output includes ATS score, strengths, weaknesses, missing keywords, rewritten summary, improved bullets, and next actions.
- Premium dashboard UI with dark/light mode.
- Resume builder with structured fields and one-click PDF export.

## Product Roadmap
### Phase 1 (Now)
- CV/GitHub source analysis with async processing.
- Resume save/share and one-click PDF export.
- Premium dashboard with dark/light mode.

### Phase 2 (Next)
- Multiple PDF templates and style presets.
- Better CV parser for PDF/DOCX structured extraction.
- Usage analytics panel for users.

### Phase 3 (Scale)
- Stripe billing + plan upgrades.
- Team workspace and shared resume libraries.
- Queue prioritization and AI usage cost controls.

## How To Present This In Your CV
- Built an AI-powered CV optimization SaaS using Next.js, Django REST Framework, PostgreSQL, Redis, and Celery.
- Designed asynchronous processing for resume analysis to avoid API timeouts and improve responsiveness.
- Implemented secure auth, resume CRUD/versioning, share links, and environment-based secret management.
- Containerized full stack with Docker and documented reproducible local setup for team onboarding.

## Security note
- Keep all secrets in local `.env` only.
- `.env` is ignored by git and must not be pushed to GitHub.

## Contributing
- See `CONTRIBUTING.md` for branch, commit, and PR standards.

## Zero-to-Run (From Scratch, Windows CMD)

1. Open Docker Desktop first (wait until engine is running).

2. Open `cmd` and move to project folder:

```cmd
cd /d D:\SaaS\CV_analyzer
```

3. Verify Docker engine:

```cmd
docker version
docker context use desktop-linux
```

4. Create `.env` from template (first time only):

```cmd
copy .env.example .env
```

5. Fill required values in `.env`:
- `DJANGO_SECRET_KEY`
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `GEMINI_API_KEY`

6. Build and start all services:

```cmd
docker compose up -d --build
```

7. Run migrations:

```cmd
docker compose exec web python manage.py migrate
```

8. Check status:

```cmd
docker compose ps
```

9. Open:
- Frontend: `http://localhost:3000`
- API health: `http://localhost:8000/api/health`

10. Stop when needed:

```cmd
docker compose down
```

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
- `GET /api/health`
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
- `GET /api/resumes/{id}/export`
- `GET /api/admin/metrics`
