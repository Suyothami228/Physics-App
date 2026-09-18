# Measurements and Dimensions MCQ import

Source: user-supplied `MCQ questions.pdf` (7 scanned pages) and `MCQ answer.pdf` (1 scanned page), imported 2026-09-17. The question pages identify S. R. Jeyakumar. Original numbering 1–81 and Tamil text/equations are preserved in cropped PNGs. Scans retain the resolution and occasional blur of the supplied source; they are not OCR translations.

`questions.json` maps each original question number to its image, source PDF page, printed year and accepted answer option(s). Only the answer table under bold section **1.** was used, ending at question 81; later bold sections are unrelated. Question 8 has accepted options [3, 5], exactly as printed. Other entries have one accepted option. Answer keys are transcribed from the supplied sheet, not independently corrected or presented as worked solutions.

Run `python manage.py migrate`, then `python manage.py import_measurement_mcq`. The import creates Chapter 01 → MCQ → Measurements and Dimensions. Re-running it preserves existing questions and educator edits using stable import keys. Question images are copied into managed media storage; back up that storage with the database. Adjust questions, sections and accepted options through Django admin.


## Typed transcription (2026-09-18)

`typed.tsv` contains question number, Tamil prompt and pipe-separated answer choices. Literal \n denotes paragraph breaks. Wording is lightly regularized for typed display; Unicode powers and fractions retain the mathematical meaning. Original scans remain private editor references; the student API does not expose them. Supplied answer-key order is preserved, including repeated printed distractors. English falls back to Tamil until an educator adds a translation.

Q11 and Q68 have unreadable distractor exponents in the supplied scan. Their prompts and answer keys are retained as drafts, with choices deliberately left empty; obtain a clearer source and type all five choices before publishing. No missing distractors have been invented. Run `import_measurement_mcq --upgrade-scans` to replace old generic scan instructions and numbered options; already typed educator edits are preserved.
