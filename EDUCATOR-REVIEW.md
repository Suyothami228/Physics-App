# Educator review deployment

The Vercel review project builds the `staging` branch with `VITE_API_ENABLED=false`.
It contains a read-only published question-bank snapshot as well as the lessons
and simulations. The question pages retain year filters, pagination, selectable
answers, and correct/incorrect feedback. Django-backed deployments continue to
use the live database.

After publishing or editing questions in Django admin, regenerate the snapshot
from the intended database before committing and pushing to staging:

```sh
python backend/manage.py export_exam_review
npm test -- tests/exam-review.test.ts tests/exam.test.tsx
npm run build
```

Run the export from the repository root with the same database environment as
the Django app. It writes `public/review/exam-bank.json`. Commit this file with
the changes. It exports only published student-facing text and answers, not
drafts, uploaded source images, user accounts, credentials, or student progress.
It refuses PDF attachments rather than publishing broken local backend URLs.
The current snapshot includes 79 published questions; the two incomplete drafts
remain excluded. Admin edits appear on Vercel only after export and redeployment.

Keep Vercel Authentication enabled for **All Deployments**. Use the deployment's
Share menu to create an **Anyone with the link** review URL. That URL grants
access without a Vercel account and can be forwarded, so share it only with
reviewers and revoke it when review ends. Do not disable all deployment protection.
The Vercel response also carries `X-Robots-Tag: noindex, nofollow, noarchive`;
this discourages search indexing but is not a substitute for access protection.

This snapshot is for practice and review: its answers are downloadable with the
site. It is not a secure scored-exam service. Login, admin, uploads, and shared
student progress still require the Django backend.
