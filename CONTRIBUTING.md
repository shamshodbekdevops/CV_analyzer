# Contributing Guide

## Branching
- Create a feature branch from `main`.
- Use short, focused branch names like `feat/analyze-ui` or `fix/pdf-export`.

## Commit Style
- Prefer clear Conventional Commit prefixes:
  - `feat:` new features
  - `fix:` bug fixes
  - `docs:` documentation updates
  - `test:` tests
  - `ci:` pipeline/workflow updates
  - `chore:` maintenance

## Pull Requests
- Keep PR scope small and reviewable.
- Describe:
  - what changed
  - why it changed
  - how it was tested
- Add screenshots for frontend UI changes.

## Local Checks Before Push
- Backend:
  - `docker compose exec web python manage.py check`
  - `docker compose exec web python manage.py test apps.analysis.tests -v 2`
- Frontend:
  - `cd frontend && npm run build`

## Security
- Never commit `.env` or secrets.
- Keep API keys only in local environment files.
