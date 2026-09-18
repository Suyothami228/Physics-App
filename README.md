# இயல் · Iyal Physics

Tamil-first Sri Lankan A/L physics prototype for students aged 17–19.

## What works

- Progress dashboard, chapter search, bookmarks and Tamil/English switching.
- 11 chapters and 72 subchapter workspaces, based on a draft grouping of the e-thaksalawa course.
- Measurement lessons with editable bilingual explanations, animated cards, activities and formative checks.
- Vernier caliper lab: direct jaw dragging, external/internal/depth exercises, mm/cm labels, magnified scales and contact feedback.
- Micrometer lab: direct barrel dragging, labelled parts, ratchet/lock controls, two screw types, signed zero-error correction and measurement practice.
- Spherometer: solid Three.js model, screw dragging, surface contact, thickness and curvature measurements. See [Spherometer notes](backend/SPHEROMETER.md).
- Travelling microscope: solid Three.js model with horizontal/vertical dragging, optical focusing, soap-bubble diameter, rubber inner/outer diameters, capillary bore and glass-slab measurements. See [Microscope notes](backend/TRAVELLING-MICROSCOPE.md).
- Projectile motion lab with adjustable parameters, animation and velocity vectors.
- Admin-managed chapter descriptions, lesson sections, draft/published controls and bilingual quick checks. See [Content editing guide](backend/CONTENT-EDITING.md).
- 64 distinct practice prompts across 18 styles and six skills, including an adapted 2024 Paper I Question 3.
- Worked solutions and provisional study recommendations based on independent answers.

Other chapters retain their lesson outlines. Tamil terminology, syllabus mapping and assessment thresholds need educator review. This is not a complete course or a validated exam predictor.

## Tech stack

| Layer | Technology |
| --- | --- |
| Interface | React 19 + TypeScript, responsive CSS |
| Build and development | Vite 8, Node.js 22.12+ |
| Navigation | Hash routes, parsed in TypeScript |
| State | React context/hooks; MariaDB account history in connected mode; localStorage in standalone mode |
| Physics | Three.js/WebGL, Canvas 2D, projected SVG instrument meshes, CSS animation, typed calculation functions |
| Curriculum and question engine | JavaScript ES modules with typed application interfaces |
| Backend | Python 3.12, Django 5.2, mysqlclient |
| Database | MariaDB (Compose 11.4; native verification on 12.1) |
| Testing | Vitest, React Testing Library, jsdom, Django tests |
| Deployment | React static build, Django/Gunicorn, MariaDB; Docker Compose for team development |

Django and MariaDB are implemented. Connected mode provides sign-in, curriculum loading, server grading and account-scoped practice history. The standalone browser-only mode is preserved. Questions are pre-authored templates; there is no live AI service. See [Django + MariaDB setup](backend/README.md) for Docker, native setup, APIs and deployment boundaries.

## Full-stack setup

Install Docker Desktop, copy `.env.example` to `.env`, and replace its three placeholder secrets. Then run:

```sh
docker compose up --build -d
docker compose exec api python manage.py createsuperuser
```

Open http://127.0.0.1:8080. Use `/admin/` to create student accounts. The complete instructions and native Python option are in [backend/README.md](backend/README.md).

## Standalone frontend setup

Install Node.js 22.12 or newer and Git, then:

```sh
git clone https://github.com/Suyothami228/Physics-App.git
cd Physics-App
npm ci
npm run dev
```

Open http://127.0.0.1:4174/#/home. Vite updates the page when source files change. Stop with Ctrl+C. If that port is occupied, stop the previous server or run `npm run dev -- --port 4176`.

```sh
npm run format  # format source and tests
npm test        # scoring, physics, routes and React interaction tests
npm run build   # TypeScript checks and production build
npm run preview # serves the built app at http://127.0.0.1:4175
```

Standalone mode needs no API key and retains progress on the same browser origin. Connected mode uses `VITE_API_ENABLED=true` and Django sessions; practice history follows the account. Browser-only history is not automatically imported into server evidence. Bookmarks and language remain browser-local.

## Structure

```text
backend/                Django application, migrations, API, tests and seed content
deploy/                 Web container and reverse proxy
compose.yaml            MariaDB + Django + React local stack
.github/workflows/      Frontend checks and MariaDB-backed CI tests
src/
  main.tsx               React entry point
  api.ts                 Same-origin Django client and course loading
  components/BackendGate.tsx  Account sign-in and connected startup
  App.tsx                Application shell and route rendering
  state.tsx              Shared state and storage compatibility
  model.ts               Typed interfaces and route parser
  physics.ts             Projectile calculations and Canvas drawing
  components/
    Pages.tsx            Dashboard, explorer, chapter, outline and progress screens
    Simulation.tsx       React simulation controls and animation lifecycle
    Practice.tsx         Question answering and adaptive study plan
    UI.tsx               Shared UI components
  domain/
    curriculum.js        Chapter and lesson metadata
    bank.js              Question templates, grading and evidence rules
  styles/
    shell.css            Responsive application design
    lesson.css           Lesson styles scoped to .lesson-ui
index.html               Vite HTML entry
package-lock.json        Reproducible dependency versions
vitest.config.ts         Test configuration
tests/                  Domain and React interaction tests
.openai/hosting.json      Existing Sites project association
dist/                   Generated output; do not edit or commit
```

All screens and lesson controls are React components; there is no iframe integration or legacy HTML renderer. The domain algorithms remain plain JavaScript modules, exposed through typed interfaces, to preserve the existing calculation and scoring behavior.

## Working on features

1. Pull current changes and create a feature branch: `git switch -c feature/your-change`.
2. Work in `src/`. Keep dependencies and `package-lock.json` synchronized.
3. Run tests and the build. Check the affected journey at desktop and mobile widths, with keyboard navigation and both languages.
4. Submit a pull request describing the student-facing change, validation and remaining limitations.
5. Deployment is separate from committing or pushing.

### New lessons

Edit metadata in `src/domain/curriculum.js`. IDs such as `02/projectile` are saved identifiers; changing them requires a storage migration. Use Django admin to add published content blocks to any lesson; the generic React lesson renderer displays them automatically. New simulation types still require React components. The built-in projectile lab follows the lesson publication status. Extend lesson-scoped questions and dashboard aggregation before assessing another topic. Opening or bookmarking a page must never award mastery.

### Questions and assessment

Extend `src/domain/bank.js` with bilingual prompts, units, tolerances, distractors and worked solutions. Keep past-paper adaptations labelled with source/year/paper/question. Verify permissions before importing larger paper collections. Numeric practice uses **g = 10 m/s²**; the simulator uses **g = 9.81 m/s²**.

Readiness requires 12 distinct independent question styles, 85% accuracy and two correct styles in each of six skills within 14 days. Exact repeats and solution-assisted answers cannot raise readiness. A fresh numerical variant can replace older evidence for its style without increasing coverage. A short review is due after two days. These are provisional prototype rules, not predicted grades.

Storage keys remain compatible with the original prototype:

- `iyal-practice-v1`: answer and solution-view history.
- `iyal-language`: Tamil/English preference.
- `iyal-saved`: bookmarked lesson IDs.
- `iyal-last-lesson`: last visited lesson.

Standalone storage is browser-local and user-editable. Connected mode records answers, correctness, timestamps and solution views on the server; client-supplied correctness is ignored. Local records are not uploaded as trusted evidence. Keep future AI keys on the server.

## Tests and deployment

Tests exercise numerical physics, grading, repeats, assisted answers, evidence expiry, adaptive selection, curriculum routes, saved lessons, language switching and solution exposure across React remounts. jsdom tests verify interactions, not real-browser visual layout. Perform browser and accessibility review before release.

For the standalone frontend, run `npm run build` and deploy the contents of `dist/` to a static host. Hash routes do not need server-side route rewrites. Do not deploy `src/` or use the Vite development server for production. `.openai/hosting.json` retains the existing Sites project association and points to `dist/`. No automatic deployment is configured. Full-stack hosting requires a Python/container host and MariaDB; the Sites manifest does not start the backend. See the backend guide.

### Vercel educator preview

Import this repository with Root Directory `./` (the directory containing `package.json` and `vercel.json`). The committed Vercel configuration selects Vite, installs with `npm ci`, builds with `npm run build`, and serves `dist/`. Do not select Django or use `backend/` as the root for this frontend preview.

Set `VITE_API_ENABLED=false` in Vercel's Preview environment before deploying. Also set it for Production if using the standalone frontend there. Keep `main` as the production branch and create a Preview deployment from `staging`. Later pushes to `staging` update the preview. Changes to environment variables require a new deployment.

This preview includes bundled lessons and simulations with browser-local progress. Django admin, server-edited lessons, accounts, and shared progress require a separately hosted backend and API routing; the local Vite proxy is not part of a static deployment.

If the build runs `uv sync` and fails building `mysqlclient`, check that Root Directory is `./`, Framework Preset is Vite, and the deployed commit includes `vercel.json`. That error comes from attempting a Python backend build rather than the intended frontend preview. Redeploy the corrected branch commit.

## Pushing to GitHub

Authenticate Git with your GitHub account, then review and push:

```sh
git status
git diff
git add src tests backend deploy compose.yaml .dockerignore .github scripts .env.example index.html package.json package-lock.json tsconfig.json vite.config.ts vitest.config.ts README.md .gitignore
git add -u
git commit -m "Add React, Django and MariaDB application stack"
git push -u origin HEAD
```

Never commit `.env`, `LOCAL-ACCESS.md`, credentials, `.venv/`, `node_modules/` or generated `dist/`. If the remote has new commits, fetch and reconcile them before pushing; do not force-push shared branches.

## References

- [Tamil e-thaksalawa A/L physics course](https://e-thaksalawa.moe.gov.lk/lcms/course/view.php?id=263): chapter/resource reference. Subchapter grouping is a draft.
- [2024 A/L Physics paper and answers](https://e-thaksalawa.moe.gov.lk/lcms/pluginfile.php/51563/mod_resource/content/1/eal_phy_pp_p12_ans_2024.pdf#page=1): source of adapted Paper I Question 3.

Select a software licence before inviting public reuse. Third-party resources retain their own terms.

See [source-led lesson workflow](backend/LESSON-DEVELOPMENT.md) for reviewing supplied material and the PDF-based introduction update.

## Updating an existing installation

After pulling this version, run `npm ci`, apply Django migrations, then run `python manage.py upgrade_spherometer` and `python manage.py upgrade_travelling` from the backend directory. These commands add missing instrument content while preserving educator edits. Restart the Django service and rebuild the frontend with the appropriate API mode. New installations can use the normal content seeding workflow.

### Exam Prep question bank

Exam Prep (`#/practice`) has 11 chapter cards, then MCQ, structured and essay libraries. The existing adaptive projectile practice is at `#/practice/adaptive`. Past-paper libraries start empty; sample or generated questions are not labelled as authentic papers.

Run `python manage.py migrate` after updating. In Django admin, open **Exam questions → Add**. Select a chapter and question type; enter the original year, paper and question number, Tamil/English titles, marks and estimated minutes. Enter the actual question text in Tamil (English translation optional). PDFs are optional reference attachments, not substitutes for typed questions. For MCQs, enter matching options on separate lines and the correct option number (starting at 1). Add bilingual solutions or a marking-scheme PDF. Save as a draft while preparing content; tick **I checked the typed question, all choices and the answer key**, then enable **Published** after review. Staff can filter and search the bank and update or unpublish any question. Learners can refresh the library to see updates without a frontend rebuild in connected mode.

Use the official source URL for attribution. Check permission to republish each uploaded paper. Uploading a PDF attaches it to a question; it does not automatically extract or split a full paper into questions. Browser MCQ checking uses the entered options and answer key. Structured/essay answers have session-only working notes and a marking-scheme reveal for self-review; they are not automatically graded or added to mastery scores.

PDFs are stored in `backend/media/` locally and the `exam-media` Docker volume in Compose. Back up the database and uploaded files together. Files are served through Django with publication/permission checks, including storage links in admin; do not expose the media directory directly through a public file server. The Nginx upload limit allows two 20 MB PDFs per form. Standalone/static preview mode cannot load this database-managed bank.

The supplied Chapter 1 collection can be loaded with `python manage.py import_measurement_mcq` after migrating. It creates 81 records under MCQ → Measurements and Dimensions: 79 typed Tamil questions and 2 unpublished drafts (Q11 and Q68 need clearer answer-choice exponents), with the supplied answer key including both accepted options for Q8. The command preserves educator edits on repeat runs. Admin **Exam sections** manages subchapter titles; each exam question now supports a section, display order, PNG/JPEG upload, and optional accepted-option list. Tamil question text is used when an English translation is unavailable. To upgrade an earlier scan import, run `python manage.py import_measurement_mcq --upgrade-scans`; it replaces only known scan placeholders, preserving educator-written text.

### Photo extraction for question editors

The Exam Question add/edit form includes **Photo → editable question**. Select a cropped PNG/JPEG containing one question and its numbered choices, choose Tamil or English, then extract. Review the text alongside the photo, correct equations and OCR errors, and click **Fill question and choices**. Numbered `(1)` through `(5)` choices are separated only when their order is unambiguous; otherwise enter them manually. Enter the correct answer from the answer key. Transferring text clears any previous answer selection and disables publication. Saving a published question requires review confirmation on every save. Blank questions and numbered placeholder options cannot be published.

OCR runs locally in the browser using Tesseract.js 6.0.1 (Apache-2.0). Its loader and worker are vendored under `backend/learning/static/learning/vendor/`; the first extraction downloads versioned core files from jsDelivr and Tamil/English language models from tessdata.projectnaptha.com. An internet connection is required for uncached OCR assets. Photos are not sent to an external OCR service. Run `node scripts/check-ocr.cjs` for an optional Tamil-image extraction smoke check after `npm ci`. Keep the vendored files and license in sync with the pinned npm dependency when upgrading. Production must serve Django collected static files.

Uploaded source photos are private admin references. The learner API does not expose them or internal paper/author metadata; cards show typed questions, actual answer choices and a small year reference. Keep backups of source files and database content. OCR does not reliably recover mathematical layout or determine correct answers, and does not automatically publish questions.
