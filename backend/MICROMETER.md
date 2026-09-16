# Micrometer lesson

Route: `#/chapter/01/instruments/micrometer`.

Reference reviewed: user-provided `4 micro screw guage.pdf`, all four pages. The instrument name and part terminology follow the PDF: நுண்மானித் திருகுக் கணிச்சி, பட்டை, கதிர்க்கோல், காப்புறை, பிரதான அளவிடை, வட்ட அளவிடை, பற்சுழற்றி, புரியிடைத் தூரம், இழிவெண்ணிக்கை. See `src/domain/micrometer.ts` for shared labels and arithmetic.

Both metric screw configurations (0.5 mm / 50, 1 mm / 100) have 0.01 mm least count. Arithmetic uses integer hundredths, including negative zero errors and circular-scale wraparound. The two worked examples reproduce the PDF's 5.97 mm and 7.69 mm corrected results. The reference photograph is an imperial instrument; the new mesh is an original simplified metric reconstruction, not a scan.

`MicrometerLab` projects and depth-sorts a 3D mesh. Thimble knurling rotates with screw travel; drag the handle vertically or use arrow keys (Shift = one revolution). The enlarged reader exposes only sleeve graduations before the moving thimble edge. Object collision, lock, zero-error selection, ratchet contact feedback, and answer checking are functional. The ratchet is a simplified contact action, not a pressure/deformation simulation. The lab handles external measurements only. Session notes do not award mastery and are not persistent. Revealing an answer marks the current object's notebook entry as assisted.

Editable theory, worked examples, activity selection and quick checks are `LessonBlock` records tagged `micrometer`. Apply migration 0010, then run `manage.py upgrade_micrometer`. The command adds missing stable keys, preserves educator edits/publication status, and normalizes the former Tamil instrument name without replacing surrounding content. Source defaults are mirrored in frontend/backend `measurement.json`.

Validation: `tests/micrometer.test.tsx` checks both PDF examples, signed zero correction, resolution and bounds, object contact gating, lock and pitch switching. Educators should review translations and practical technique before classroom publication.
