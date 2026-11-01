import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { useApp } from "../state";
import { radians, tensions } from "../domain/statics";

export default function StaticsScene({
  left,
  right,
  weight,
  phase,
}: {
  left: number;
  right: number;
  weight: number;
  phase: number;
}) {
  const { T } = useApp();
  const host = useRef<HTMLDivElement>(null),
    live = useRef({ left, right, weight, phase }),
    update = useRef(() => {}),
    cameraView = useRef((front: boolean) => {});
  live.current = { left, right, weight, phase };
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x101923);
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(5, 3, 8);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.4, 0);
    controls.enablePan = false;
    controls.minDistance = 5;
    controls.maxDistance = 18;
    scene.add(new THREE.HemisphereLight(0xf0fbff, 0x38425c, 3));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(3, 6, 5);
    scene.add(light);
    const material = (color: number, metalness = 0.2) =>
      new THREE.MeshStandardMaterial({ color, metalness, roughness: 0.36 });
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(7, 0.15, 3.5),
      material(0x26394c),
    );
    base.position.y = -2.1;
    scene.add(base);
    const grid = new THREE.GridHelper(7, 14, 0x406776, 0x263e50);
    grid.position.y = -2;
    scene.add(grid);
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(7, 0.2, 0.3),
      material(0x71859a, 0.7),
    );
    frame.position.y = 3.3;
    scene.add(frame);
    [-3.4, 3.4].forEach((x) => {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 5.4, 16),
        material(0x71859a, 0.7),
      );
      post.position.set(x, 0.6, 0);
      scene.add(post);
    });
    const joint = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.035, 12, 32),
      material(0xf7e292, 0.7),
    );
    scene.add(joint);
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.65, 12),
      material(0xe2e8ec, 0.8),
    );
    stem.position.y = -0.4;
    scene.add(stem);
    const load = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.55, 0.5, 40),
      material(0xfacb56, 0.5),
    );
    load.position.y = -0.98;
    scene.add(load);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 24, 16),
      new THREE.MeshStandardMaterial({
        color: 0xffedb0,
        emissive: 0xffd06a,
        emissiveIntensity: 0.5,
      }),
    );
    bulb.position.y = -1.25;
    scene.add(bulb);
    const ropes = [0x58c4dd, 0xfc8c8c].map(
      (c) =>
        new THREE.Mesh(
          new THREE.CylinderGeometry(0.035, 0.035, 1, 12),
          material(c),
        ),
    );
    const pins = ropes.map(
      () =>
        new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 16, 12),
          material(0xe0e8ee, 0.7),
        ),
    );
    const supports = ropes.map(
      () =>
        new THREE.Mesh(
          new THREE.CylinderGeometry(0.025, 0.025, 1, 12),
          material(0x71859a),
        ),
    );
    ropes.forEach((r) => scene.add(r));
    pins.forEach((r) => scene.add(r));
    supports.forEach((r) => scene.add(r));
    const arrows = [0x58c4dd, 0xfc8c8c, 0xffff66].map(
      (c) =>
        new THREE.ArrowHelper(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(0, 0, 0.15),
          1,
          c,
          0.15,
          0.08,
        ),
    );
    arrows.forEach((a) => scene.add(a));
    const dots = ropes.map(
      (_, i) =>
        new THREE.Mesh(
          new THREE.SphereGeometry(0.06, 12, 8),
          new THREE.MeshBasicMaterial({ color: i ? 0xfc8c8c : 0x58c4dd }),
        ),
    );
    dots.forEach((d) => scene.add(d));
    const draw = () => renderer.render(scene, camera);
    const connect = (mesh: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3) => {
      const d = b.clone().sub(a);
      mesh.position.copy(a.clone().add(b).multiplyScalar(0.5));
      mesh.scale.y = d.length();
      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        d.normalize(),
      );
    };
    update.current = () => {
      const p = live.current,
        a = radians(p.left),
        b = radians(p.right),
        ts = tensions(p.weight, p.left, p.right)!;
      const ends = [
        new THREE.Vector3(-3 * Math.cos(a), 3 * Math.sin(a), 0),
        new THREE.Vector3(3 * Math.cos(b), 3 * Math.sin(b), 0),
      ];
      ends.forEach((end, i) => {
        connect(ropes[i], new THREE.Vector3(), end);
        pins[i].position.copy(end);
        connect(supports[i], end, new THREE.Vector3(end.x, 3.3, 0));
        dots[i].position.copy(end.clone().multiplyScalar(p.phase));
      });
      const forces = [ts.left, ts.right, p.weight],
        max = Math.max(...forces);
      [
        ends[0].clone().normalize(),
        ends[1].clone().normalize(),
        new THREE.Vector3(0, -1, 0),
      ].forEach((d, i) => {
        arrows[i].setDirection(d);
        arrows[i].setLength((1.65 * forces[i]) / max, 0.16, 0.09);
      });
      draw();
    };
    cameraView.current = (front) => {
      camera.position.set(front ? 0 : 5, front ? 0.4 : 3, front ? 10 : 8);
      controls.update();
      draw();
    };
    controls.addEventListener("change", draw);
    const resize = new ResizeObserver(() => {
      const w = el.clientWidth,
        h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      draw();
    });
    resize.observe(el);
    controls.update();
    update.current();
    const lost = (e: Event) => {
      e.preventDefault();
      setFailed(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      resize.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        if (m.material)
          (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) =>
            x.dispose(),
          );
      });
      renderer.dispose();
      renderer.domElement.remove();
      update.current = () => {};
      cameraView.current = () => {};
    };
  }, []);
  useEffect(() => update.current(), [left, right, weight, phase]);
  return (
    <div className="statics-three">
      <div
        ref={host}
        role="img"
        aria-label={T(
          "3D hanging lamp with two supporting ropes. Drag to rotate.",
          "இரு கயிறுகளில் தொங்கும் விளக்கின் 3D மாதிரி. இழுத்துச் சுழற்றுக.",
        )}
      />
      {failed && (
        <p role="alert">
          {T(
            "3D is unavailable. Use the force diagram and values below.",
            "3D கிடைக்கவில்லை. கீழுள்ள விசை வரைபையும் பெறுமானங்களையும் பயன்படுத்துக.",
          )}
        </p>
      )}
      <div className="math-preset-row">
        <button onClick={() => cameraView.current(false)}>
          {T("3D view", "3D தோற்றம்")}
        </button>
        <button onClick={() => cameraView.current(true)}>
          {T("Front view", "முன்தோற்றம்")}
        </button>
      </div>
      <p>
        {T(
          "Drag to orbit · Scroll/pinch to zoom · Cyan: left tension · Coral: right tension · Yellow: weight",
          "இழுத்துச் சுழற்றுக · பெரிதாக்க சக்கரம்/விரல்கள் · நீலம்: இடது இழுவிசை · பவளம்: வலது இழுவிசை · மஞ்சள்: நிறை",
        )}
      </p>
    </div>
  );
}
