# Travelling microscope

Route: /#/chapter/01/instruments/travelling. Tamil instrument name from the user-provided two-page `6 travelling microscope.pdf`: நகரும் நுணுக்குக்காட்டி. The document provides the vernier principle, non-contact diameter applications, capillary mass/length relation, and cathetometer comparison. Additional part labels and glass-slab terminology require the same educator review as other lessons.

Visual references inspected: https://www.youtube.com/watch?v=1S7ckIvKwRw (MeitY OLabs) and https://www.youtube.com/watch?v=wgc5g_EMcbg (Parivartan Physics). Original procedural Three.js model approximates their base, rails, translating column, vertical microscope and adjustment knobs; it is not a dimensionally exact manufacturer CAD model. Textures generated locally; no video assets copied.

Run `python manage.py migrate` and `python manage.py upgrade_travelling`; restart Django. Ten bilingual LessonBlocks are inserted without overwriting educator edits. Activity choice: travelling-3d. Both frontend and backend seeds are synchronized.

Model assumptions: 0.5 mm MSD, 50 VSD=49 MSD, LC=0.01 mm. Ring OD=12.44 mm, ID=6.92 mm. Horizontal readings are model x+40; vertical readings are carriage height. A schematic upright optical view uses blur to guide focus, not a lens-ray solver. Near-normal glass exercise uses r0=40, r1=45, r2=55 mm, giving 15/10=1.5. Fixed specimens, no aberrations or backlash, no mastery credit; notebook state clears on leaving activity. Refractive-index results require all three focused readings. Source capillary formula is theoretical only; no mercury handling exercise is provided.

3D renders on demand, with pointer raycasting on knobs/carriage and background orbit; keyboard and range/fine controls offer alternatives. WebGL unavailable fallback retains the optical exercise. Resources are disposed on unmount. Tests cover scale rollover, bounds, endpoint gating, reading invalidation, lock, and glass calculation.

Working distance is 25 mm from the focal plane; objectives stay above the slab via a 31 mm minimum vertical carriage reading in glass mode. Worked examples may use a different common reading offset; differences are unchanged.

Horizontal interaction fix: the column, base carriage, and end knob accept horizontal drags. The microscope tube/body selects horizontal or vertical motion from the initial drag direction. Pointer displacement is projected onto the visible world axis, accounting for zoom and camera orientation. Background dragging still rotates the view; lock prevents travel. Verified by browser drag: x changed from 22.00 to 44.65 mm while y remained 30.00 mm.

Measurement choices now include a 10.00 mm ideal stationary soap bubble, rubber OD 12.44 mm / ID 6.92 mm, and a 1.20 mm capillary bore (4 mm OD). Each has matching 3D and schematic eyepiece geometry; the capillary eyepiece uses increased magnification. Selecting a specimen resets recorded endpoints and lock state. Focus readings use the selected specimen's edge plane. Seven microscope tests cover all diameter choices and glass measurement.
