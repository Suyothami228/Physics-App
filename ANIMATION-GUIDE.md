# Learning animation direction

Use a mathematical-explainer visual language inspired by the clarity of 3Blue1Brown: dark uncluttered stages, visible axes, deliberate sequential reveals, and consistent colour meaning. Create original diagrams and code; do not use channel branding or copy video assets.

- Cyan: the primary relationship. Yellow: the selected point or quantity. Green: positive contribution. Coral: negative contribution or a comparison. Always supplement colour with labels, signs, line patterns or numbers.
- Keep Tamil and English labels complete, using the user's chapter PDFs for local terminology. Review equations and source diagram errors before adapting them.
- Every new learning animation needs meaningful user control: editable parameters or direct manipulation, play/pause where time progresses, reset, and a keyboard-operable alternative. Never rely on animation alone to communicate an answer.
- Do not autoplay simulations. Use real elapsed time, capped after tab inactivity. Unmounting must cancel animation frames/timers. Provide a scrubber for inspecting a still frame.
- Label axes with quantities and units, show actual numerical scales, and distinguish changes of coordinates from changes of physical state. Only connect points across a continuous domain. Log plots need positive inputs.
- Explain slope from coordinate differences, not an angle measured on a stretched screen. State constant-acceleration assumptions and distinguish signed displacement from distance.
- Keep realistic measuring-instrument shapes and materials. Apply the shared colours to explanatory overlays, feedback and surrounding controls rather than repainting the instruments.

`src/styles/animation-theme.css` supplies the shared direction for existing compatible learning stages. `GraphPlot.tsx` is the reusable Cartesian plot; `GraphLab.tsx` demonstrates parameter controls, playback, signed areas and bilingual explanations. Existing instrument-specific interactions remain intact. Continue applying these conventions as those lessons are revised.
