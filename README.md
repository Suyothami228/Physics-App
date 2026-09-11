# இயல் · Iyal Physics

A Tamil-first learning app prototype for Sri Lankan A/L physics students, initially designed for ages 17–19. Explore chapters, experiment with projectile motion, practise questions, and track evidence of understanding.

## Current scope

- Home dashboard with browser-local practice activity and accuracy.
- Chapter explorer with search, filters and saved subchapters.
- 11 chapter pages and 72 subchapter workspaces.
- Tamil/English navigation and lesson content.
- One functioning lesson: projectile motion, with animated trajectories, velocity vectors and adjustable launch conditions.
- Practice bank: 64 distinct prompts across 18 styles and six skills, including an adapted, sourced 2024 A/L Paper I Question 3.
- Worked feedback and provisional recommendations about where to focus study time.

**This is a prototype, not a finished course.** The other subchapters are clearly labelled outlines. Their theory, simulations, questions and assessments still need development. Subchapter grouping and Tamil terminology need educator review.

## Tech stack

| Layer | Technology |
| --- | --- |
| Interface | HTML5, CSS3, vanilla JavaScript; no frontend framework |
| Navigation | Client-side hash routes |
| Simulation | Canvas 2D and `requestAnimationFrame` |
| Diagrams | Inline SVG |
| State | Browser `localStorage` |
| Lesson integration | Same-origin iframe with validated `postMessage` resizing |
| Development server | Node.js built-in HTTP/file modules |
| Tests | Node.js test runner, assertions and VM-based rendering checks |
| Typography | Google Fonts, with local fallback fonts |
| Hosting | Static files; existing optional Sites metadata |

There is no database, student authentication, backend API or live AI integration. Questions were AI-authored during development; runtime variants and answers are calculated from templates. No AI API key is required.

## Run locally

Install Node.js 20 or later. No third-party npm dependencies are required.

```sh
git clone https://github.com/Suyothami228/Physics-App.git
cd Physics-App
npm start
```

Open **http://127.0.0.1:4174/#/home**. `npm run dev` runs the same server. Refresh the browser after source edits; this server does not provide hot reload. Stop it with Ctrl+C.

If port 4174 is occupied, choose another port:

```powershell
# PowerShell
$env:PORT = '4175'
npm start
```

```sh
# macOS / Linux
PORT=4175 npm start
```

Keep the same origin and port to retain your existing browser-local progress. Progress does not automatically transfer between local previews, hosted sites, browsers or devices. Use HTTP instead of opening `index.html` directly so storage and iframe messaging behave consistently.

## Repository structure

```text
dist/                 Authored static application source (not disposable build output)
  index.html          Main app entry point
  shell.js            Routing, dashboard, explorer, bookmarks and progress views
  shell.css           Main design system and responsive layouts
  curriculum.js       Chapters, subchapters, stable IDs and availability metadata
  lab.html            Working projectile lesson entry point
  app.js              Projectile simulation and initial conceptual check
  style.css           Original lesson and practice styles
  lab-theme.css       Lesson styling inside the new app
  lab-bridge.js       Language initialization and iframe sizing
  bank.js             Question templates, grading and recommendation logic
  practice.js         Practice interface and persistence
scripts/serve.cjs      Local static server
tests/                Portable calculation, scoring and app-structure tests
.openai/hosting.json   Existing Sites project association; no credentials
```

**Do not delete or git-ignore `dist/`: it contains the source.** There is currently no compilation or bundling step.

## Routes

| Route | View |
| --- | --- |
| `#/home` | Dashboard |
| `#/chapters` | Searchable chapter explorer |
| `#/chapter/02` | Example chapter: mechanics |
| `#/chapter/02/projectile` | Working projectile lesson |
| `#/chapter/{chapterId}/{lessonSlug}` | Subchapter workspace |
| `#/practice` | Question bank and self-evaluation |
| `#/progress` | Skill evidence and curriculum coverage |

The 11 chapters are Measurement; Mechanics; Oscillations and waves; Thermal physics; Gravitational field; Electric field; Magnetic field; Current electricity; Electronics; Mechanical properties of matter; Matter and radiation.

## Team development workflow

1. Create a feature branch from `main` and keep each change focused.
2. Update both Tamil and English text. Preserve UTF-8 and have Tamil scientific terminology reviewed by a local physics educator.
3. Run `npm test` and manually exercise the changed student journey on desktop and mobile widths, including keyboard navigation.
4. Submit a pull request explaining the student-facing change, checks performed and remaining limitations.
5. Treat deployment as a separate step from committing or pushing code.

### Add or develop a subchapter

- Locate its metadata in `dist/curriculum.js`. IDs such as `02/projectile` and lesson slugs are persistent identifiers: avoid renaming them without migrating saved state.
- Each chapter currently lists a draft learning outline; the source course mixes PDFs, videos and simulations. Confirm syllabus mapping before writing full lessons.
- The shell's `outline()` and `stageContent()` functions provide the planned Understand, Experiment, Practise and Evaluate sections.
- **Adding `available: true` alone is not sufficient.** `lesson()` currently embeds the projectile lesson for any available lesson. Before releasing another lesson, introduce an explicit lesson renderer/entry-point mapping and route each lesson to its own content.
- Likewise, the dashboard and chapter-assessment counts currently map practice evidence only to projectile motion. Extend the data model with lesson-scoped question IDs and aggregation before enabling assessment elsewhere.
- Keep unfinished material labelled as an outline. Opening or bookmarking a page must never count as completing or mastering it.

### Extend the question bank

- `bank.js` separates bilingual prompts, question families, numerical solutions, grading and readiness evaluation. It can also be required directly from Node.js tests.
- Add original question styles with clear assumptions, units, tolerances, distractors and worked explanations in both languages.
- Keep sourced past-paper adaptations distinct from original practice. Record year, paper, question number and a source link. Verify reproduction/licensing rights before importing larger collections.
- All practice templates use **g = 10 m/s²**, while the simulator uses **g = 9.81 m/s²**. The UI states this distinction; do not silently mix them.
- The current template ID pattern, family splitting, variant range, coverage totals and the displayed bank counts are implementation assumptions. Update the evaluator, selection logic, copy and tests together if you change them.
- Adding live AI requires a server-side integration, secret management, output validation, cost limits and educator review. Never put API keys in browser JavaScript or Git.

### Progress and recommendation rules

Browser keys currently used:

- `iyal-practice-v1`: answer history and solution-view events.
- `iyal-language`: language preference.
- `iyal-saved`: saved subchapter IDs.
- `iyal-last-lesson`: last explored subchapter.

Readiness currently requires at least **12 distinct question styles**, **85% independent accuracy**, and **two correct styles in each of six skills**. Exact repeats and revealed solutions cannot raise readiness. A fresh numerical variant can replace older evidence for its style but does not increase style coverage. Evidence expires after 14 days; a short review is suggested after two days.

These thresholds are **provisional and not educationally validated**. They are not a predicted A/L grade. Other lessons remain unassessed. Local storage can be changed by the user, so these records must not be used as secure exam results.

## Testing

```sh
npm test
```

Tests cover physics examples and parameter combinations, grading edge cases, assisted/repeat-attempt exclusion, readiness breadth and expiry, adaptive selection, all chapter/subchapter routes, language switching, bookmarks and source assets.

The shell tests use a lightweight VM harness. They check rendering logic and state, **not real-browser visual layout or end-to-end interaction**. Review responsive layouts, focus behaviour, iframe resizing, reload persistence and both languages manually before releases.

## Hosting and deployment

Serve the contents of `dist/` with a static web server. Hash routing does not require server-side route rewrites. Serve `lab.html` and all scripts/styles from the same origin; retain correct MIME types and do not block the lesson iframe.

`.openai/hosting.json` associates this checkout with the existing privately hosted Sites project. Its project ID is not a credential. Coordinate with the project owner before changing it. For other hosting, deploy `dist/`; do not use the development server as a production service. This repository does not configure automatic deployments.

## References and content status

- [Tamil e-thaksalawa A/L physics course](https://e-thaksalawa.moe.gov.lk/lcms/course/view.php?id=263): reference for chapter order and learning resources. This app's subtopic grouping is a draft, not a verbatim official syllabus.
- [2024 A/L Physics paper](https://e-thaksalawa.moe.gov.lk/lcms/pluginfile.php/51563/mod_resource/content/1/eal_phy_pp_p12_ans_2024.pdf#page=1): source of the adapted Paper I Question 3; the worked explanation is our own.

The owner should select an explicit software licence before encouraging public reuse. Third-party resources retain their own terms. A repository upload does not grant redistribution rights to linked papers or simulation libraries.
