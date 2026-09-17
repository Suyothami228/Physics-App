import * as THREE from "three";
export function createTravellingMicroscope() {
  const root = new THREE.Group(),
    carriage = new THREE.Group(),
    scope = new THREE.Group();
  root.add(carriage);
  carriage.add(scope);
  const black = new THREE.MeshStandardMaterial({
      color: 0x1e2935,
      metalness: 0.4,
      roughness: 0.34,
    }),
    metal = new THREE.MeshStandardMaterial({
      color: 0xd2d9df,
      metalness: 0.65,
      roughness: 0.26,
    }),
    white = new THREE.MeshStandardMaterial({ color: 0xe4e9e6, roughness: 0.7 });
  function box(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    m: THREE.Material,
    parent: THREE.Object3D = root,
  ) {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  function cyl(
    r: number,
    h: number,
    x: number,
    y: number,
    z: number,
    m: THREE.Material,
    parent: THREE.Object3D = root,
  ) {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 40), m);
    o.position.set(x, y, z);
    o.castShadow = true;
    parent.add(o);
    return o;
  }
  box(87, 6, 62, 0, -7, 6, black);
  box(76, 0.6, 34, 0, -0.3, 18, white);
  for (const x of [-33, 33])
    for (const z of [-14, 30]) {
      cyl(4, 4, x, -12, z, black);
      cyl(3, 2, x, -9, z, metal);
    }
  // Horizontal rails and lead screw, with separate translating carriage.
  for (const z of [-18, -9]) {
    const rail = cyl(1.7, 76, 0, 0, z, metal);
    rail.rotation.z = Math.PI / 2;
  }
  box(76, 2, 6, 0, -2, -13, black);
  const horizontalKnob = cyl(4, 4, 41, 0, -13, metal);
  horizontalKnob.rotation.z = Math.PI / 2;
  const horizontalCarriage = box(18, 5, 18, 0, 3, -13, black, carriage);
  const column = box(9, 75, 7, 0, 42, -13, black, carriage);
  cyl(2, 71, 3.5, 42, -10, metal, carriage);
  cyl(4.5, 4, 0, 82, -13, metal, carriage);
  // Arm and vertical microscope: objective points down toward the specimen.
  const body = box(14, 13, 13, 0, 0, -13, black, scope);
  box(6, 5, 30, 0, 0, 3, black, scope);
  const tube = cyl(5, 22, 0, 4, 22, black, scope);
  cyl(4.6, 5, 0, 17, 22, metal, scope);
  cyl(4.5, 2, 0, 20.5, 22, black, scope);
  cyl(3.3, 4, 0, -9, 22, metal, scope);
  cyl(2.8, 4, 0, -13, 22, black, scope);
  const glass = new THREE.MeshStandardMaterial({
    color: 0x64bad7,
    metalness: 0.25,
    roughness: 0.1,
  });
  cyl(2.5, 0.3, 0, -15, 22, glass, scope);
  cyl(3.3, 0.25, 0, 21.6, 22, glass, scope);
  const fineKnob = cyl(3.5, 5, 10, 0, -13, metal, scope);
  fineKnob.rotation.z = Math.PI / 2;
  const focusKnob = cyl(3, 4, 7, 3, 22, metal, scope);
  focusKnob.rotation.z = Math.PI / 2;
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12;
    const ridge = box(
      5,
      0.22,
      0.22,
      10,
      Math.cos(a) * 3.5,
      -13 + Math.sin(a) * 3.5,
      black,
      scope,
    );
    ridge.rotation.x = a;
  }
  function scaleTexture(vertical: boolean) {
    const c = document.createElement("canvas");
    c.width = vertical ? 192 : 1536;
    c.height = vertical ? 1536 : 192;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#eee7ce";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#152432";
    ctx.fillStyle = "#152432";
    ctx.font = "32px sans-serif";
    for (let i = 0; i <= 150; i++) {
      const mm = i * 0.5;
      ctx.beginPath();
      if (vertical) {
        const y = 1536 - (mm / 75) * 1536;
        ctx.moveTo(190, y);
        ctx.lineTo(i % 10 === 0 ? 95 : 135, y);
        ctx.stroke();
        if (i % 10 === 0) ctx.fillText(String(mm), 10, y + 10);
      } else {
        const x = (mm / 75) * 1536;
        ctx.moveTo(x, 190);
        ctx.lineTo(x, i % 10 === 0 ? 80 : 130);
        ctx.stroke();
        if (i % 10 === 0) ctx.fillText(String(mm), x - 10, 50);
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide });
  }
  const vr = new THREE.Mesh(new THREE.PlaneGeometry(5, 75), scaleTexture(true));
  vr.position.set(-2.1, 37.5, -9.42);
  carriage.add(vr);
  const hr = new THREE.Mesh(
    new THREE.PlaneGeometry(75, 5),
    scaleTexture(false),
  );
  hr.rotation.x = -Math.PI / 2;
  hr.position.set(-2.5, 1, -5);
  root.add(hr);

  function vernierTexture(vertical: boolean) {
    const c = document.createElement("canvas");
    c.width = vertical ? 160 : 1024;
    c.height = vertical ? 1024 : 160;
    const v = c.getContext("2d")!;
    v.fillStyle = "#c5cfd4";
    v.fillRect(0, 0, c.width, c.height);
    v.strokeStyle = "#152432";
    v.fillStyle = "#152432";
    v.font = "32px sans-serif";
    for (let i = 0; i <= 50; i++) {
      v.beginPath();
      if (vertical) {
        const py = 1024 - (i / 50) * 1024;
        v.moveTo(0, py);
        v.lineTo(i % 10 === 0 ? 70 : 40, py);
        v.stroke();
        if (i % 10 === 0)
          v.fillText(String(i), 80, Math.max(30, Math.min(1000, py)));
      } else {
        const px = (i / 50) * 1024;
        v.moveTo(px, 0);
        v.lineTo(px, i % 10 === 0 ? 70 : 40);
        v.stroke();
        if (i % 10 === 0) v.fillText(String(i), Math.min(960, px), 110);
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide });
  }
  const vv = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 24.5),
    vernierTexture(true),
  );
  vv.position.set(2.9, 12.25, -6.42);
  scope.add(vv);
  const hv = new THREE.Mesh(
    new THREE.PlaneGeometry(24.5, 4),
    vernierTexture(false),
  );
  hv.rotation.x = -Math.PI / 2;
  hv.position.set(12.25, 2.6, -0.4);
  carriage.add(hv);
  const index = new THREE.MeshStandardMaterial({ color: 0xf3ad59 });
  box(2, 0.3, 1, -3.5, 0, -6, index, scope);
  box(0.3, 0.5, 4, 0, 2.6, -5, index, carriage);
  // Ring specimen sits under the objective; its dimensions match the optical view.
  const specimen = new THREE.Group();
  specimen.position.set(-7.4, 0, 22);
  root.add(specimen);
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 6.22, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 3.46, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const ring = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth: 1,
      bevelEnabled: false,
      curveSegments: 64,
    }),
    new THREE.MeshStandardMaterial({ color: 0x6885a0, roughness: 0.7 }),
  );
  ring.rotation.x = -Math.PI / 2;
  specimen.add(ring);
  const bubble = new THREE.Group();
  root.add(bubble);
  const film = new THREE.Mesh(
    new THREE.SphereGeometry(5, 48, 32),
    new THREE.MeshPhysicalMaterial({
      color: 0xb1e8ee,
      metalness: 0,
      roughness: 0.1,
      transparent: true,
      opacity: 0.35,
      iridescence: 1,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  film.position.set(-7.4, 5, 22);
  bubble.add(film);
  const capillary = new THREE.Group();
  root.add(capillary);
  const bore = new THREE.Shape();
  bore.absarc(0, 0, 2, 0, Math.PI * 2, false);
  const opening = new THREE.Path();
  opening.absarc(0, 0, 0.6, 0, Math.PI * 2, true);
  bore.holes.push(opening);
  const glassTube = new THREE.Mesh(
    new THREE.ExtrudeGeometry(bore, {
      depth: 2,
      bevelEnabled: false,
      curveSegments: 48,
    }),
    new THREE.MeshPhysicalMaterial({
      color: 0x93d4e5,
      roughness: 0.15,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    }),
  );
  glassTube.rotation.x = -Math.PI / 2;
  glassTube.position.set(-7.4, 0, 22);
  capillary.add(glassTube);
  const slab = new THREE.Group();
  root.add(slab);
  const slabMesh = box(
    23,
    15,
    23,
    0,
    7.5,
    22,
    new THREE.MeshPhysicalMaterial({
      color: 0x86ccde,
      transparent: true,
      opacity: 0.25,
      roughness: 0.05,
      metalness: 0,
      depthWrite: false,
    }),
    slab,
  );
  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(slabMesh.geometry),
    new THREE.LineBasicMaterial({ color: 0x80cfdf }),
  );
  outline.position.copy(slabMesh.position);
  slab.add(outline);
  const crossMaterial = new THREE.MeshBasicMaterial({ color: 0x172535 });
  box(7, 0.05, 0.3, 0, 0.04, 22, crossMaterial, slab);
  box(0.3, 0.05, 7, 0, 0.04, 22, crossMaterial, slab);
  const dust = box(
    0.5,
    0.05,
    0.5,
    0,
    15.04,
    22,
    new THREE.MeshBasicMaterial({ color: 0xedb766 }),
    slab,
  );
  return {
    root,
    carriage,
    scope,
    body,
    fineKnob,
    horizontalKnob,
    horizontalCarriage,
    column,
    tube,
    focusKnob,
    specimen,
    bubble,
    capillary,
    slab,
    slabMesh,
    outline,
    dust,
  };
}
