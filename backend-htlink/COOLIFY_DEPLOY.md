# Coolify Backend Deploy Notes

This repo can be deployed to Coolify without changing application logic if you use the backend image with the production environment variables.

## Coolify form values

For a backend-only Coolify service, use:

- `Build Pack`: `Dockerfile`
- `Base Directory`: `/`
- `Dockerfile Location`: `/backend/Dockerfile`
- `Ports Exposes`: `8000`
- `Port Mappings`: leave empty unless you specifically need one

Use the backend domain in Coolify, for example:

- `https://api.your-domain.com`

Then set:

- `FRONTEND_HOST=https://your-frontend-domain.com`
- `BACKEND_CORS_ORIGINS=["https://your-frontend-domain.com","https://api.your-domain.com"]`

## Backend startup flow

The backend container now starts with:

1. `scripts/prestart.sh`
2. database connectivity check
3. optional Alembic migration when `RUN_ALEMBIC_MIGRATIONS=true`
4. `uvicorn app.main:app`

By default, production startup skips Alembic migrations to avoid accidentally replaying migrations against an existing live database.

## Healthcheck

The backend now exposes a container healthcheck against:

- `/health`

App-level endpoint:

- `GET /health`

## Recommended Coolify environment variables

- `ENVIRONMENT=production`
- `FRONTEND_HOST=<your frontend URL>`
- `BACKEND_CORS_ORIGINS=[...]`
- `MYSQL_SERVER=<your mysql host>`
- `MYSQL_PORT=3306`
- `MYSQL_DATABASE=<your db name>`
- `MYSQL_USER=<your db user>`
- `MYSQL_PASSWORD=<your db password>`
- `SECRET_KEY=<strong secret>`
- `FIRST_SUPERUSER=<admin email>`
- `FIRST_SUPERUSER_PASSWORD=<admin password>`
- `RUN_ALEMBIC_MIGRATIONS=false`
- `PORT=8000`

## When to enable migrations

Set `RUN_ALEMBIC_MIGRATIONS=true` only when:

- deploying to a fresh database, or
- you have reviewed the pending Alembic chain for the target database.

For an already-populated production database, keep it `false` unless you intentionally want Alembic to run.

## Important note

The current project has legacy SQL scripts and Alembic history from older schema phases. The runtime path is now safe for Coolify startup, but migration execution should still be enabled deliberately rather than by default.
