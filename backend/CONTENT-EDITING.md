# Editing chapters and lessons

Sign in with an account that has the relevant Django staff permissions. Administrators see **Edit chapter** on chapter pages and **Edit this lesson** on lesson pages. These links open the corresponding Django admin form in a new tab.

## Chapter information

In `/admin/learning/chapter/`, choose a chapter. Edit its English/Tamil title, descriptions, formula badge, colour and reference URL in ordinary fields. The lesson table lets you reorder existing subchapters and change their draft/published state. Follow its change link to edit a subchapter's content. Stable chapter IDs cannot be changed on existing records.

## Subchapter content

In `/admin/learning/lesson/`, filter by chapter and choose a lesson. You can:

1. Edit English/Tamil titles and display order.
2. Add **Lesson blocks** with a stable key and position.
3. Choose Explanation, Worked example, Interactive activity or Quick check.
4. Enter bilingual plain text, an optional formula, and any check options/explanation.
5. Choose **Published** for the lesson, save, and refresh the app. A block's Published checkbox can hide an individual section. A Draft lesson exposes no lesson blocks to students.

For quick checks, enter one option per line in both languages, in matching order. The correct option number starts at **1**. Forms reject missing/mismatched options and out-of-range correct answers. These checks provide formative feedback only; they never award exam readiness or chapter mastery.

Supported activity types currently include unit conversion, repeated measurements, vernier reading and vector components. Administrators can select these existing activities. Creating a new simulation type still requires a React component. The projectile lab also honours lesson publication status and can display admin-authored sections above its simulation.

Text is rendered as plain text, not arbitrary HTML. Blank lines separate paragraphs. Editing course material does not require writing JSON or rebuilding React. Use the lesson's **Refresh content** button after an admin save; reload the app for changes to chapter titles, ordering or publication status.

To add a new lesson, use **Add lesson** in Django admin. Its ID must match `chapter ID/slug`, e.g. `01/new-topic`. Keep existing identifiers and slugs stable to preserve routes and bookmarks. Existing IDs and chapter relationships are protected in the editor.

## Measurement first edition

The six existing subchapters now contain 38 editable sections:

- Introduction to physics: measurement, models and fair investigations.
- Physical quantities and units: SI base quantities, derived units, prefixes and conversion.
- Dimensions: dimensional homogeneity and its limitations.
- Measurement uncertainty: precision, accuracy, systematic effects and uncertainty estimates.
- Measuring instruments: vernier, micrometer, zero correction and a spherometer relationship.
- Vectors: components, signs and resultants.

There are six interactive activities and 17 original formative checks. This is an initial learning edition, not a claim of complete syllabus coverage. Tamil terminology and curriculum mapping remain subject to educator review. No past-paper questions have been invented or presented as official questions here.

The grouping retains the app's existing outline. The reference course includes additional resources that can be mapped and expanded in later iterations: [e-thaksalawa Tamil A/L Physics](https://e-thaksalawa.moe.gov.lk/lcms/course/view.php?id=263).

## Seed and development workflow

`seed_content` also calls `seed_measurement`. It imports starter content only into untouched lessons, preserving existing sections and educator edits. Normal restarts do not overwrite edited course content.

The connected app reads live content from Django/MariaDB. The standalone mode uses `src/domain/measurement.json` as a fixed starter snapshot; admin changes do not automatically rewrite repository files. The identical initial import is stored in `backend/seed/measurement.json`. Keep these starter files aligned when deliberately revising the initial seed, but use admin/database migrations for content already in a running course.

API: `GET /api/lessons/<lesson-id>/` returns published sections, or an empty list for a draft. The curriculum API includes editor links only for accounts with the corresponding change permission. Authoring uses Django's authenticated, CSRF-protected admin forms.

See [source-led lesson workflow](LESSON-DEVELOPMENT.md) for reviewing supplied material and the PDF-based introduction update.
