# Spherometer

Ten bilingual admin-editable lesson blocks, including four quick checks. To install: run `python manage.py migrate`, then `python manage.py upgrade_spherometer`. Existing educator edits are preserved. Restart Django after updating code.

Three.js WebGL model with solid tripod legs, a three-arm frame, helical screw, textured 100-division disc, shadows, free orbit, and front/top camera views. Loaded on demand; resources are disposed on unmount. Keyboard and measurement buttons remain available if WebGL is unavailable. Fixed equilateral leg spacing a=40 mm, pitch=1 mm, LC=0.01 mm. Reading=probe height+5 mm; subtract the flat reference. Spherical caps use the radius derived from their sagitta. No force, backlash or uncertainty model. Observation notes reset on leaving Explore.

References: user-provided 5 spherometer.pdf for Tamil terminology and scope; NCERT Class XI Physics Laboratory Manual, Experiment 3: https://www.ncert.nic.in/pdf/publication/sciencelaboratorymanuals/classXI/physics/kelm102.pdf . Video construction references inspected: https://www.youtube.com/watch?v=YIpIJjPQJhA and https://www.youtube.com/watch?v=kUCQfv7Vvo4 . The model and scale textures are generated locally; no video assets or code were copied.

Source corrections: +2.66 minus +0.02 gives 2.64 mm; 2.68 would require a -0.02 reference. Also distinguish d (centre-to-foot) from a (foot-to-foot): d=a/sqrt(3); R=(d²+h²)/(2h)=a²/(6h)+h/2. Preserve these distinctions in edits.
