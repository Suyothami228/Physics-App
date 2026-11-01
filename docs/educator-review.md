# Educator publishing and technical feedback

## Permissions

Run migrations, then `python manage.py setup_review_roles` once per environment. A superuser opens `/admin/auth/user/`, creates or selects an account and assigns **Educators**. Educators do not need staff or superuser status. They can publish wording on all lessons and exam questions, read revision history, and create/reply to technical requests. **Technical admins** can additionally change feedback status. Only a superuser can manage accounts/groups or restore earlier wording. Never share one administrator account with all reviewers.

## Review workflow

Sign into the API-enabled app. Each lesson block and exam question has **Correct wording / comment**. Edit English/Tamil titles, explanations, choices, solutions, structured subparts and hosted/built-in video captions. Keep option order and card separators intact. Add a reason and publish: the Django content record changes immediately. Students with an open connected app refresh content approximately every five seconds, or when returning to the browser tab. Existing answers and simulation controls are preserved. Offline or static builds cannot receive changes.

The editor only permits wording fields. It does not grant access to correct-option numbers, formulas, publication status, files, animation code or user permissions. Terminology inside rendered video frames, diagrams or hard-coded simulation labels requires a technical comment; editable video captions are separate from the image itself. A correction applies to the selected content, not a global find-and-replace across the course.

Use Comments to request **Correct**, **Add**, **Remove** or **Technical issue**. Include an optional animation timestamp in seconds and identify the object/arrow/behaviour. The header **Educator inbox** collects requests. Admins reply and set Open, In progress, Needs clarification or Resolved. Educators can reply to verify a fix. No email or external notification is sent.

Every publication records author, time, reason and before/after wording. Concurrent edits (including Django-admin changes) reject stale saves instead of overwriting. Reopen the editor and reapply the correction. Restoring an older version is itself audited; it restores the wording before that revision and publishes it immediately. The editor shows the latest 50 revisions; the read-only Django revision archive retains all records.

## Staging and production

This feature needs Django and persistent MariaDB. The existing static Vercel educator preview alone cannot store shared edits. Deploy the backend/database before enabling `VITE_API_ENABLED=true`. Route `/api/`, `/admin/`, `/media/` and `/static/` to Django through the same origin, using the existing proxy approach. Configure allowed hosts, trusted CSRF origins and secure session cookies for HTTPS. Rebuild the frontend after setting the Vite variable. Do not embed database passwords or service credentials in Vite variables.

Use separate staging and production databases. Publishing in staging changes staging students' views; it must not silently edit production. Educators can use the same workflow on production when assigned there. Git pushes and static content exports do not transfer live review history. Use reviewed database/content migration procedures when promoting staging corrections; back up the database regularly. Run seed commands with preservation semantics so reviewed content is not overwritten.

## Development verification

`python manage.py test learning.test_review` covers authorization, CSRF, validation, history/rollback, concurrent writes, structured answer text and caption editing. Frontend review tests cover publishing/conflict feedback and the live update signal. Use two signed-in browser sessions to verify educator-to-student updates against the same backend. The local development proxy expects Django on port 8000.
