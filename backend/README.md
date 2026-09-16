# Django + MariaDB team setup

The application now has two modes:

- **Standalone prototype:** `npm run dev`, without `VITE_API_ENABLED=true`. The existing localStorage progress remains untouched.
- **Connected application:** React calls Django through `/api/`; Django uses MariaDB. Students sign in with administrator-created accounts. Practice answers are graded on the server and saved per account. Bookmarks, last lesson and language remain browser-local.

## Recommended: Docker Desktop

Install Docker Desktop with Linux containers. From the repository root:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and replace the three placeholder secrets with distinct random values. A secret generator, if Python is installed, is `python -c "import secrets; print(secrets.token_urlsafe(48))"`. Do not commit `.env`.

```sh
docker compose up --build -d
docker compose exec api python manage.py createsuperuser
```

Open http://127.0.0.1:8080 for the React app and http://127.0.0.1:8080/admin/ for Django administration. Sign in with the account you created. Use **Users → Add** in Django admin to create student accounts; students do not need staff privileges. Public registration/password recovery is not implemented.

Startup waits for MariaDB, applies migrations, imports missing course content, and collects admin assets. The importer preserves existing educator edits. There are 11 chapters, 72 lessons and 90 generated variants representing 64 unique prompts across 18 question styles. The database uses utf8mb4 for Tamil. Only the web and API ports are bound to localhost; the database is internal to the Compose network.

```sh
docker compose logs -f api
docker compose stop
docker compose start
```

Data survives container restarts in the `mariadb-data` volume. `docker compose down` retains named volumes; adding `-v` deletes them. Rebuilding application images does not update existing seeded rows.

## React development with Django

Start the Compose backend above, set `VITE_API_ENABLED=true` in `.env`, and restart `npm run dev`. Vite proxies `/api/`, `/admin/` and `/static/` to port 8000. Open http://127.0.0.1:4174. Build-time flags are compiled into the frontend: changing `.env` after a build requires rebuilding. Docker's web build enables connected mode automatically.

For the standalone mode, set the flag to false or remove it and restart Vite. Local history is deliberately not uploaded or merged into account history because its grades and timestamps are not trusted server evidence.

## Native Python setup (optional)

Use Python 3.12, a MariaDB 11.4 server, and the mysqlclient build prerequisites for your OS. Create an `iyal` database using utf8mb4 and a dedicated `iyal` database user. Set `DJANGO_SECRET_KEY`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT` in the process environment. Django does not load `.env` automatically; Compose does.

```powershell
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
.venv/Scripts/python.exe backend/manage.py migrate
.venv/Scripts/python.exe backend/manage.py seed_content
.venv/Scripts/python.exe backend/manage.py createsuperuser
$env:DJANGO_DEBUG = '1'
.venv/Scripts/python.exe backend/manage.py runserver 127.0.0.1:8000
```

Gunicorn is used inside Linux containers. On Windows, use Django's development server locally. Neither development server should be exposed as a production service.

## Backend layout

- `config/settings.py`: MariaDB configuration and Django middleware. MariaDB uses Django's `django.db.backends.mysql` driver.
- `learning/models.py` and `migrations/`: bilingual chapters, lessons, question variants and account-scoped attempts.
- `learning/admin.py`: educator administration and read-only attempt inspection.
- `learning/views.py`: session authentication, curriculum, question listing, grading and solution-view recording.
- `learning/management/commands/seed_content.py`: imports missing rows transactionally without overwriting edits.
- `seed/content.json`: versioned seed exported from the original JavaScript templates using `npm run export:content`.
- `src/api.ts`, `components/BackendGate.tsx`: React API client, course loading and sign-in.

## API contract

All paths end in a slash. Same-origin cookies and Django CSRF protection apply. GET `/api/session/` first to obtain a CSRF cookie; send it as `X-CSRFToken` on writes. The token rotates after login.

| Endpoint | Methods | Behavior |
| --- | --- | --- |
| `/api/health/` | GET | Checks database connectivity |
| `/api/session/` | GET, POST, DELETE | Inspect session; sign in with username/password; sign out |
| `/api/curriculum/` | GET | Bilingual chapter/lesson tree |
| `/api/questions/` | GET | Up to 100 active projectile variants; optional `lesson` query parameter; excludes answers/explanations |
| `/api/attempts/` | GET, POST, DELETE | Current user's latest 600 events; submit an answer; clear own history |
| `/api/solutions/` | POST | Record solution exposure before returning an explanation |

Submission body: `{"question":"energy-1:0","answer":"60"}`. Solution body: `{"question":"energy-1:0"}`. The server ignores client-supplied correctness, user IDs and timestamps. Duplicate prompts do not create extra answered evidence. Solution-assisted answers remain assisted across sessions. Invalid answers return 400; unauthenticated history access returns 401. Question selection and provisional readiness calculations remain in React, based on server-recorded history. This is a practice platform, not a secure examination engine; the standalone question templates remain in the distributed frontend bundle.

## Content development

Use the [Content editing guide](CONTENT-EDITING.md) for chapter descriptions, bilingual lesson blocks, draft/published controls and the Measurement starter lessons.

Keep existing lesson, style and variant identifiers stable. The current frontend understands the original 18 styles and six skill families; adding styles requires coordinated frontend, seed, validation and scoring changes. Published lesson blocks use a generic React renderer. Creating a new simulation type still requires code; admins can choose existing activity types.

Question `content` is structured JSON; preserve its schema. Changes to an assessed question should use a deliberate content/version migration. Attempts retain a prompt snapshot so old exposure evidence does not silently become independent evidence for a changed prompt. Exporting seeds does not overwrite the database; review and apply content updates through admin or a migration.

## Verification

```sh
npm test
npm run build
```

For isolated Python tests without MariaDB:

```powershell
.venv/Scripts/python.exe -m pip install -r backend/requirements-test.txt
.venv/Scripts/python.exe backend/manage.py test learning --settings=config.test_settings
.venv/Scripts/python.exe backend/manage.py makemigrations --check --dry-run --settings=config.test_settings
```

`config.test_settings` uses in-memory SQLite **only for local tests**. It is never selected by the Docker application. The GitHub Actions workflow runs the same backend tests against a real MariaDB 11.4 service, including migrations and seed import. The CI database uses an ephemeral root account so Django can create/drop its test database; the running application uses a dedicated user.

Before release, run `docker compose up --build`, check account creation, sign-in, answering, solution views, reload persistence and isolation between two users. Local SQLite tests do not validate the MariaDB driver, locking behavior or the Docker image build.

## Hosting boundary

The existing Sites manifest still deploys only the static frontend. It cannot start this Django/MariaDB Compose application. A full-stack deployment needs a Python/container host and a persistent MariaDB service, plus same-origin routing for `/api/` and `/admin/`. Configure HTTPS, trusted hosts/origins, secure cookies (`DJANGO_SECURE_COOKIES=1`), login rate limits, database backups and secret management before exposing accounts publicly. The included Compose configuration is for local team development, not a production deployment.
