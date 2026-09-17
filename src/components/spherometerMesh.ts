import * as THREE from "three";

// All dimensions are millimetres. Feet form an equilateral triangle of side 40 mm.
export function createSpherometer() {
  const instrument = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({
    color: 0xc2cbd0,
    metalness: 0.72,
    roughness: 0.28,
  });
  const black = new THREE.MeshStandardMaterial({
    color: 0x26313b,
    metalness: 0.35,
    roughness: 0.36,
  });
  const brass = new THREE.MeshStandardMaterial({
    color: 0xc9ac71,
    metalness: 0.65,
    roughness: 0.34,
  });
  const screw = new THREE.Group();
  instrument.add(screw);
  function mesh(
    g: THREE.BufferGeometry,
    m: THREE.Material,
    parent: THREE.Object3D = instrument,
    x = 0,
    y = 0,
    z = 0,
  ) {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  function cylinder(
    rt: number,
    rb: number,
    h: number,
    m: THREE.Material,
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
  ) {
    return mesh(new THREE.CylinderGeometry(rt, rb, h, 48), m, parent, x, y, z);
  }
  const feet: THREE.Vector3[] = [];
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const x = (Math.cos(a) * 40) / Math.sqrt(3),
      z = (Math.sin(a) * 40) / Math.sqrt(3);
    feet.push(new THREE.Vector3(x, 0, z));
    // Sharp contact tips, cylindrical legs, collars and substantial cast arms.
    cylinder(1.45, 0, 3, steel, instrument, x, 1.5, z);
    cylinder(1.45, 1.45, 22, steel, instrument, x, 14, z);
    cylinder(2.35, 2.35, 3, steel, instrument, x, 24.5, z);
    const arm = mesh(
      new THREE.BoxGeometry(25, 4.2, 5.6),
      black,
      instrument,
      x / 2,
      27,
      z / 2,
    );
    arm.rotation.y = -a;
    cylinder(2.2, 2.2, 1.2, steel, instrument, x, 29.5, z);
  }
  cylinder(5, 5, 8, black, instrument, 0, 27, 0);
  cylinder(3.4, 3.4, 1, brass, instrument, 0, 31.5, 0);
  cylinder(1.85, 0, 3, steel, screw, 0, 1.5, 0);
  cylinder(1.85, 1.85, 37, steel, screw, 0, 21.5, 0);
  class Helix extends THREE.Curve<THREE.Vector3> {
    constructor() {
      super();
    }
    getPoint(t: number, target = new THREE.Vector3()) {
      const a = t * 37 * Math.PI * 2;
      return target.set(2.05 * Math.cos(a), 3 + t * 37, 2.05 * Math.sin(a));
    }
  }
  mesh(new THREE.TubeGeometry(new Helix(), 1480, 0.23, 6, false), steel, screw);
  const disc = cylinder(19, 19, 1.2, brass, screw, 0, 40, 0);
  // Engraved dial, generated locally; graduation numbers rotate with the screw.
  const dialCanvas = document.createElement("canvas");
  dialCanvas.width = dialCanvas.height = 1024;
  const ctx = dialCanvas.getContext("2d")!;
  ctx.fillStyle = "#d7c79c";
  ctx.fillRect(0, 0, 1024, 1024);
  ctx.translate(512, 512);
  ctx.strokeStyle = "#273341";
  ctx.fillStyle = "#273341";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "28px sans-serif";
  for (let i = 0; i < 100; i++) {
    const a = (i * Math.PI) / 50;
    ctx.save();
    ctx.rotate(a);
    ctx.lineWidth = i % 10 === 0 ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(0, -475);
    ctx.lineTo(0, i % 10 === 0 ? -403 : -438);
    ctx.stroke();
    if (i % 10 === 0) ctx.fillText(String(i), 0, -355);
    ctx.restore();
  }
  const dialTexture = new THREE.CanvasTexture(dialCanvas);
  dialTexture.colorSpace = THREE.SRGBColorSpace;
  const face = mesh(
    new THREE.CircleGeometry(18.9, 100),
    new THREE.MeshBasicMaterial({ map: dialTexture }),
    screw,
    0,
    40.61,
    0,
  );
  face.rotation.x = -Math.PI / 2;
  cylinder(4.8, 4.8, 1.2, steel, screw, 0, 41.3, 0);
  const knob = cylinder(3.5, 3.5, 7.5, steel, screw, 0, 45.5, 0);
  for (let i = 0; i < 40; i++) {
    const a = (i * Math.PI) / 20;
    cylinder(
      0.13,
      0.13,
      6.8,
      brass,
      screw,
      3.52 * Math.cos(a),
      45.5,
      3.52 * Math.sin(a),
    );
  }
  cylinder(3.5, 3.5, 0.5, brass, screw, 0, 49.5, 0);
  // Vertical ruler on the left/back arm, at the same physical height as the disc.
  const ruler = mesh(
    new THREE.BoxGeometry(6.5, 32, 1),
    brass,
    instrument,
    -11.547,
    43,
    20,
  );
  const rc = document.createElement("canvas");
  rc.width = 256;
  rc.height = 1024;
  const r = rc.getContext("2d")!;
  r.fillStyle = "#e0c894";
  r.fillRect(0, 0, 256, 1024);
  r.strokeStyle = "#24313b";
  r.fillStyle = "#24313b";
  r.font = "36px sans-serif";
  // Scale origin y=35; the moving disc centre is y=40+h, giving reading=5+h.
  for (let i = -5; i <= 20; i++) {
    const y = ((59 - (35 + i)) / 32) * 1024;
    r.beginPath();
    r.moveTo(256, y);
    r.lineTo(i % 5 === 0 ? 130 : 175, y);
    r.stroke();
    if (i % 5 === 0) r.fillText(String(i), 30, y + 12);
  }
  const rt = new THREE.CanvasTexture(rc);
  rt.colorSpace = THREE.SRGBColorSpace;
  mesh(
    new THREE.PlaneGeometry(6.4, 32),
    new THREE.MeshBasicMaterial({ map: rt, side: THREE.DoubleSide }),
    instrument,
    -11.547,
    43,
    20.52,
  );
  // A fixed angular index reaches the disc edge without hiding the engraved face.
  const index = mesh(
    new THREE.BoxGeometry(6, 0.35, 0.7),
    new THREE.MeshStandardMaterial({ color: 0xe75738 }),
    instrument,
    -9.5,
    40.8,
    16.45,
  );
  const contact = new THREE.MeshStandardMaterial({
    color: 0x32e8a1,
    emissive: 0x0a8f55,
    emissiveIntensity: 0.6,
  });
  const marker = mesh(
    new THREE.SphereGeometry(0.65, 16, 12),
    contact,
    screw,
    0,
    0.1,
    0,
  );
  marker.visible = false;
  return { instrument, screw, disc, knob, ruler, index, feet, marker };
}

export function createSample(height: number, sheet: boolean, contact: boolean) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: contact ? 0x4ad8a1 : 0x78a7bd,
    metalness: 0.15,
    roughness: 0.32,
    side: THREE.DoubleSide,
  });
  const radius = 38,
    segments = 80,
    rings = 16;
  const vertices: number[] = [],
    indices: number[] = [];
  const d = 40 / Math.sqrt(3),
    R = height === 0 ? 0 : (d * d + height * height) / (2 * Math.abs(height));
  for (let j = 0; j <= rings; j++)
    for (let i = 0; i <= segments; i++) {
      const rr = (radius * j) / rings,
        a = (i * Math.PI * 2) / segments;
      const y =
        sheet || height === 0
          ? 0
          : Math.sign(height) *
            (Math.sqrt(R * R - rr * rr) - (R - Math.abs(height)));
      vertices.push(rr * Math.cos(a), y, rr * Math.sin(a));
    }
  for (let j = 0; j < rings; j++)
    for (let i = 0; i < segments; i++) {
      const k = j * (segments + 1) + i;
      indices.push(
        k,
        k + 1,
        k + segments + 1,
        k + 1,
        k + segments + 2,
        k + segments + 1,
      );
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const cap = new THREE.Mesh(geo, mat);
  cap.receiveShadow = true;
  group.add(cap);
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(38, 38, 2, 80),
    new THREE.MeshStandardMaterial({
      color: 0x3c657e,
      metalness: 0.25,
      roughness: 0.35,
    }),
  );
  base.position.y = -4;
  group.add(base);
  if (sheet) {
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(15, height, 15),
      new THREE.MeshStandardMaterial({
        color: contact ? 0x42e4a4 : 0xe1ad55,
        metalness: 0.45,
        roughness: 0.3,
      }),
    );
    plate.position.y = height / 2;
    plate.receiveShadow = true;
    group.add(plate);
  }
  return group;
}
export function disposeObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(),
    materials = new Set<THREE.Material>(),
    textures = new Set<THREE.Texture>();
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      geometries.add(o.geometry);
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        materials.add(m);
        for (const value of Object.values(m))
          if (value instanceof THREE.Texture) textures.add(value);
      }
    }
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  textures.forEach((t) => t.dispose());
}
