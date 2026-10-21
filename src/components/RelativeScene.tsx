import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { useApp } from "../state";
import type { Velocity } from "../domain/relative";
type Props = {
  boat: boolean;
  a: Velocity;
  b: Velocity;
  observer: Velocity;
  p: number;
  angle: number;
  width: number;
  current: number;
  time: number;
  drift: number;
};
function vessel(color: number, small = false) {
  const group = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(0, -3);
  shape.lineTo(1.1, -1.4);
  shape.lineTo(1.1, 2.4);
  shape.quadraticCurveTo(0, 3, -1.1, 2.4);
  shape.lineTo(-1.1, -1.4);
  shape.closePath();
  const hull = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth: 0.65,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.18,
      bevelThickness: 0.15,
    }),
    new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.25 }),
  );
  hull.rotation.x = Math.PI / 2;
  hull.position.y = 0.9;
  group.add(hull);
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    c: number,
  ) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color: c }),
    );
    m.position.set(x, y, z);
    m.castShadow = true;
    group.add(m);
  };
  box(0, 1.05, 1, 1.6, 0.8, 1.5, 0xe7edf4);
  box(0, 1.65, 1, 1.2, 0.5, 1, 0x263c54);
  box(0, 2.1, 1.3, 0.25, 0.65, 0.3, 0xfc8c8c);
  if (!small) {
    box(0, 1, -0.7, 1.5, 0.5, 1.8, color);
    box(0, 2.7, 1.2, 0.07, 1.2, 0.07, 0xffffff);
  }
  group.scale.setScalar(2.2);
  return group;
}
export default function RelativeScene(props: Props) {
  const { T } = useApp(),
    host = useRef<HTMLDivElement>(null),
    live = useRef(props),
    sync = useRef<() => void>(() => {}),
    view = useRef<(top: boolean) => void>(() => {}),
    zoom = useRef<(factor: number) => void>(() => {});
  live.current = props;
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
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500);
    camera.position.set(40, 55, 60);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 25;
    controls.maxDistance = 170;
    controls.maxPolarAngle = Math.PI * 0.47;
    scene.add(new THREE.HemisphereLight(0xd3edff, 0x254e46, 2.7));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(-30, 60, 20);
    scene.add(light);
    const world = new THREE.Group();
    scene.add(world);
    const surface = new THREE.Mesh(
      new THREE.BoxGeometry(140, 0.3, 120),
      new THREE.MeshStandardMaterial({
        color: 0x14566b,
        roughness: 0.3,
        metalness: 0.35,
      }),
    );
    surface.position.y = -0.5;
    world.add(surface);
    const grid = new THREE.GridHelper(140, 28, 0x44869a, 0x24697d);
    grid.position.y = -0.3;
    world.add(grid);
    const banks = [-1, 1].map(() => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(140, 1.1, 12),
        new THREE.MeshStandardMaterial({ color: 0x48835c, roughness: 1 }),
      );
      world.add(mesh);
      return mesh;
    });
    const shipA = vessel(0x58c4dd, props.boat),
      shipB = vessel(0xfc8c8c);
    world.add(shipA, shipB);
    [shipA, shipB].forEach((ship, i) => {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#10222e";
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = i ? "#fc8c8c" : "#58c4dd";
      ctx.font = "bold 90px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(props.boat ? "B" : i ? "B" : "A", 64, 97);
      const tag = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas) }),
      );
      tag.position.set(0, 5, 0);
      tag.scale.set(1.8, 1.8, 1);
      ship.add(tag);
    });
    const path = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineDashedMaterial({
        color: 0xffff00,
        dashSize: 1.5,
        gapSize: 0.8,
      }),
    );
    world.add(path);
    const arrows = [0, 1, 2].map((i) => {
      const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(),
        5,
        [0x58c4dd, 0xfc8c8c, 0xffff00][i],
        1,
        0.6,
      );
      world.add(arrow);
      return arrow;
    });
    const draw = () => renderer.render(scene, camera);
    const update = () => {
      const s = live.current;
      const t = s.p * 5;
      world.position.set(-s.observer[0] * t * 0.1, 0, s.observer[1] * t * 0.1);
      surface.scale.z = 1;
      shipB.visible = !s.boat;
      grid.visible = !s.boat;
      banks.forEach((bank) => (bank.visible = s.boat));
      path.visible = s.boat;
      if (s.boat) {
        world.position.set(0, 0, 0);
        const scale = 45 / Math.max(s.width, Math.abs(s.drift), 1),
          depth = s.width * scale,
          start = (-s.drift * scale) / 2;
        surface.scale.z = depth / 120;
        banks.forEach((bank, i) =>
          bank.position.set(0, 0, (i === 0 ? -1 : 1) * (depth / 2 + 6)),
        );
        shipA.position.set(
          start + s.drift * scale * s.p,
          0.1,
          depth / 2 - depth * s.p,
        );
        shipA.rotation.y = (s.angle * Math.PI) / 180;
        path.geometry.dispose();
        path.geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(start, 0.2, depth / 2),
          new THREE.Vector3(-start, 0.2, -depth / 2),
        ]);
        path.computeLineDistances();
        const across = s.width / s.time;
        const vx = s.drift / s.time;
        const vectors = [
          new THREE.Vector3(vx - s.current, 0, -across),
          new THREE.Vector3(s.current, 0, 0),
          new THREE.Vector3(vx, 0, -across),
        ];
        vectors.forEach((v, i) => {
          arrows[i].position
            .copy(shipA.position)
            .add(new THREE.Vector3(0, 8.5, 0));
          arrows[i].visible = v.length() > 1e-6;
          if (v.length() > 1e-6) {
            arrows[i].setDirection(v.clone().normalize());
            arrows[i].setLength(Math.min(13, v.length() * 1.2), 1, 0.5);
          }
        });
      } else {
        [shipA, shipB].forEach((ship, i) => {
          const v = i ? s.b : s.a;
          ship.position.set(
            (i ? 12 : -12) + v[0] * t * 0.1,
            0.1,
            -v[1] * t * 0.1,
          );
          if (Math.hypot(...v) > 0) ship.rotation.y = Math.atan2(-v[0], v[1]);
          const arrow = arrows[i];
          const relative = new THREE.Vector3(
            v[0] - s.observer[0],
            0,
            -v[1] + s.observer[1],
          );
          arrow.position.copy(ship.position).add(new THREE.Vector3(0, 8.5, 0));
          arrow.visible = relative.length() > 1e-6;
          if (arrow.visible) {
            arrow.setDirection(relative.clone().normalize());
            arrow.setLength(Math.min(16, relative.length() * 0.3), 1, 0.5);
          }
        });
        arrows[2].visible = false;
      }
      draw();
    };
    sync.current = update;
    controls.addEventListener("change", draw);
    view.current = (top) => {
      camera.position.set(top ? 0 : 40, top ? 90 : 55, top ? 0.01 : 60);
      controls.target.set(0, 0, 0);
      controls.update();
      draw();
    };
    zoom.current = (factor) => {
      camera.position.multiplyScalar(factor);
      camera.position.setLength(
        THREE.MathUtils.clamp(camera.position.length(), 25, 170),
      );
      controls.update();
      draw();
    };
    const resize = new ResizeObserver(() => {
      const w = el.clientWidth,
        h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      draw();
    });
    resize.observe(el);
    update();
    const lost = (event: Event) => {
      event.preventDefault();
      setFailed(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      sync.current = () => {};
      view.current = () => {};
      zoom.current = () => {};
      resize.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material)
          (Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material]
          ).forEach((m) => {
            (m as THREE.MeshStandardMaterial).map?.dispose();
            m.dispose();
          });
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [props.boat]);
  useEffect(() => {
    sync.current();
  }, [props]);
  return (
    <div className="relative-3d">
      <div
        ref={host}
        className="relative-3d-canvas"
        role="img"
        aria-label={T(
          "Interactive 3D boats: drag to orbit; use view buttons or zoom controls",
          "ஊடாடும் முப்பரிமாணக் கப்பல்கள்: இழுத்துச் சுழற்றுக; தோற்றப் பொத்தான்களைப் பயன்படுத்துக",
        )}
      />
      {failed && (
        <p role="alert">
          {T(
            "3D is unavailable in this browser. Enable hardware acceleration or use the 2D diagram below.",
            "இவ்வுலாவியில் முப்பரிமாணத் தோற்றம் கிடைக்கவில்லை. வன்பொருள் முடுக்கத்தை இயக்குக அல்லது கீழுள்ள இருபரிமாண வரைபைப் பயன்படுத்துக.",
          )}
        </p>
      )}
      <div className="math-preset-row">
        <button onClick={() => view.current(false)}>
          {T("3D view / reset camera", "3D தோற்றம் / மீட்டமை")}
        </button>
        <button onClick={() => view.current(true)}>
          {T("Top view", "மேலிருந்து தோற்றம்")}
        </button>
        <button onClick={() => zoom.current(0.8)}>
          {T("Zoom in +", "பெரிதாக்கு +")}
        </button>
        <button onClick={() => zoom.current(1.25)}>
          {T("Zoom out −", "சிறிதாக்கு −")}
        </button>
      </div>
      <p>
        {T(
          "Drag to rotate · Pinch or scroll to zoom. Models are enlarged for visibility; read the numerical values for measurements.",
          "இழுத்துச் சுழற்றுக · விரல்களால் அல்லது சக்கரத்தால் பெரிதாக்குக. மாதிரிகள் தெளிவுக்காகப் பெரிதாக்கப்பட்டுள்ளன; அளவீடுகளுக்கு எண் பெறுமதிகளை வாசிக்கவும்.",
        )}
        {props.boat
          ? T(
              " Cyan: boat relative to water; coral: current; yellow: boat relative to Earth.",
              " நீலம்: நீர் சார்பான வள்ளம்; பவளம்: நீரோட்டம்; மஞ்சள்: பூமி சார்பான வள்ளம்.",
            )
          : T(
              " Cyan ship A; coral ship B. Arrows show velocities in the selected observer frame.",
              " நீலக் கப்பல் A; பவளக் கப்பல் B. அம்புகள் தெரிவுசெய்த நோக்குநர் சார்பான வேகங்களைக் காட்டும்.",
            )}
      </p>
    </div>
  );
}
