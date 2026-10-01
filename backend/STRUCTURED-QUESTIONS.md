# Measurement structured questions

Run `python backend/manage.py migrate`, then `python backend/manage.py import_measurement_structured`
from the repository root with the database environment configured. The importer
adds four questions and 34 individually revealable parts, preserving subsequent
admin edits. The nine diagram crops are original PDF illustrations in
`public/review/structured/`. The typed source is `backend/seed/measurement-structured.json`.
Only the first question has a visible year (2024); the other years remain null.
The sheet's density exponent is corrected to 2000 kg/m³. The plate question's
instrument choice is explained because its handwritten answer conflicts with
the later 0.01 mm measurements. No invented official marks are displayed for
these structured cards. English translations are in `backend/seed/measurement-structured-en.json`;
MCQ translations are in `backend/learning/data/measurement_mcq/english.tsv`.
The importers fill both languages. For an existing database, run
`python backend/manage.py translate_measurement_questions`, then export and build.
This command only fills missing or Tamil-placeholder English fields whose Tamil
source still matches; it preserves educator translations and changed Tamil text.
For new admin questions, enter both languages, including each structured part's
prompt and answer. Equations and option order must stay equivalent across languages.

Admin: edit an Exam Question's `structured_parts` list. Each item has unique `id`,
`prompt` and `answer` dictionaries with `en`/`ta` text, and an optional local
`image` path and `image_alt` dictionary. Student question responses omit answers;
the solution endpoint supplies them only when requested. Static snapshots contain
answers for self-study and are not secure exams.

After changes, run `python backend/manage.py export_exam_review`, build, and
redeploy staging. The local static preview and Vercel do not update directly from
the database.

## Photo feedback setup

Set `OPENAI_API_KEY` and `OPENAI_VISION_MODEL` in the **Django server environment**,
using a vision-capable model available to your API project. Do not use VITE_
variables or commit keys. Restart Django. Connect the frontend with
`VITE_API_ENABLED=true`, and sign in using the app account. Vercel's static-only
review supports photo preview and revealable answers but cannot call this backend.

The user selects a subquestion, previews a JPG/PNG (up to 5 MB), and explicitly
consents before sending it to OpenAI. The endpoint is authenticated and CSRF
protected, passes the server-side answer reference, uses `store:false`, and does
not save the uploaded photo in application storage. OpenAI's API data handling
still applies. Feedback is provisional, not an exam grade or mastery score.
Students should avoid names/personal details in their photos.

The app throttles submissions per account to one per 30 seconds. For a multi-worker
deployment configure Django with a shared cache (e.g. Redis), set OpenAI project
spend limits, and use edge request/body limits. Do not expose this paid endpoint
as an unauthenticated proxy. Tests mock the API; real handwriting quality and
Tamil recognition require testing after the key/model are configured.

API reference: https://developers.openai.com/api/docs/guides/images-vision
