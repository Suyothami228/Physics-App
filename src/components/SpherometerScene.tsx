import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  createSpherometer,
  createSample,
  disposeObject,
} from "./spherometerMesh";
import { surfaces, type Surface } from "../domain/spherometer";
import { useApp } from "../state";

type Props = {
  height: number;
  surface: Surface;
  contact: boolean;
  locked: boolean;
  anatomy: boolean;
  angle: number;
  onMove: (n: number) => void;
};
export function SpherometerScene(props: Props) {
  const { T } = useApp();
  const host = useRef<HTMLDivElement>(null);
  const live = useRef(props);
  live.current = props;
  const sync = useRef<(() => void) | null>(null);
  const labelLine = useRef<SVGLineElement>(null);
  const labelDot = useRef<SVGCircleElement>(null);
  const [failed, setFailed] = useState(false);
  const [part, setPart] = useState("legs");
  const selected = useRef(part);
  selected.current = part;
  const [view, setView] = useState("perspective");
  const setViewRef = useRef<((name: string) => void) | null>(null);
  const labels = [
    ["legs", "Three fixed legs", "மூன்று கால்கள்"],
    ["frame", "Supporting frame", "தாங்கும் சட்டம்"],
    ["screw", "Central screw", "திருகாணி"],
    ["disc", "Circular scale", "வட்ட அளவிடை"],
    ["ruler", "Main scale", "பிரதான அளவிடை"],
  ];
  useEffect(() => {
    const node = host.current!;
    if (!window.WebGLRenderingContext) {
      setFailed(true);
      return;
    }
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.touchAction = "none";
    node.prepend(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 600);
    scene.add(new THREE.HemisphereLight(0xe3f4ff, 0x4c5361, 3));
    const key = new THREE.DirectionalLight(0xffe4bb, 4);
    key.position.set(-50, 100, 70);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, {
      left: -70,
      right: 70,
      top: 70,
      bottom: -70,
      near: 1,
      far: 250,
    });
    key.shadow.bias = -0.0005;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x8dcaff, 3);
    rim.position.set(60, 55, -65);
    scene.add(rim);
    const model = createSpherometer();
    scene.add(model.instrument);
    let sample = createSample(
      live.current.surface === "flat" ? 0 : surfaces[live.current.surface].h,
      live.current.surface === "sheet",
      live.current.contact,
    );
    scene.add(sample);
    let sampleKey = "";
    let yaw = 0.75,
      pitch = 0.43,
      distance = 145,
      previousAngle = live.current.angle;
    const ray = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    const points: Record<string, THREE.Vector3> = {
      legs: model.feet[0].clone().setY(12),
      frame: new THREE.Vector3(12, 27, 0),
      screw: new THREE.Vector3(0, 15, 0),
      disc: new THREE.Vector3(13, 41, 0),
      ruler: new THREE.Vector3(-11.547, 49, 20.52),
    };
    const render = () => {
      const fittedDistance = distance / Math.min(1, camera.aspect);
      camera.position.set(
        Math.sin(yaw) * Math.cos(pitch) * fittedDistance,
        24 + Math.sin(pitch) * fittedDistance,
        Math.cos(yaw) * Math.cos(pitch) * fittedDistance,
      );
      camera.lookAt(0, 24, 0);
      camera.updateMatrixWorld();
      renderer.render(scene, camera);
      const p = points[selected.current].clone();
      if (selected.current === "disc" || selected.current === "screw")
        p.y += live.current.height;
      p.project(camera);
      const x = (p.x + 1) * 50,
        y = (1 - p.y) * 50;
      labelLine.current?.setAttribute("x2", String(x));
      labelLine.current?.setAttribute("y2", String(y));
      labelDot.current?.setAttribute("cx", String(x));
      labelDot.current?.setAttribute("cy", String(y));
    };
    const update = () => {
      const p = live.current;
      model.screw.position.y = p.height;
      model.screw.rotation.y = (5 * Math.PI) / 6 + p.height * Math.PI * 2;
      model.marker.visible = p.contact;
      // The red index is a fixed vertical edge spanning the moving disc's range.
      model.index.position.y = 41;
      model.index.scale.y = 24;
      const nextKey = p.surface + String(p.contact);
      if (nextKey !== sampleKey) {
        scene.remove(sample);
        disposeObject(sample);
        sample = createSample(
          surfaces[p.surface].h,
          p.surface === "sheet",
          p.contact,
        );
        scene.add(sample);
        sampleKey = nextKey;
      }
      yaw += ((p.angle - previousAngle) * Math.PI) / 180;
      previousAngle = p.angle;
      render();
    };
    sync.current = update;
    const resize = () => {
      const w = node.clientWidth,
        h = node.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    let drag: null | {
      kind: "screw" | "orbit";
      x: number;
      y: number;
      h: number;
      yaw: number;
      pitch: number;
    } = null;
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const b = canvas.getBoundingClientRect();
      pointer.set(
        ((e.clientX - b.left) / b.width) * 2 - 1,
        (-(e.clientY - b.top) / b.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      const hit =
        ray.intersectObjects([model.knob, model.disc], false).length > 0;
      drag = {
        kind: hit && !live.current.anatomy ? "screw" : "orbit",
        x: e.clientX,
        y: e.clientY,
        h: live.current.height,
        yaw,
        pitch,
      };
      node.focus({ preventScroll: true });
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = drag.kind === "screw" ? "ns-resize" : "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      if (drag.kind === "screw") {
        if (!live.current.locked)
          live.current.onMove(drag.h + (drag.y - e.clientY) * 0.01);
      } else {
        yaw = drag.yaw - (e.clientX - drag.x) * 0.008;
        pitch = Math.max(
          0.08,
          Math.min(1.48, drag.pitch + (e.clientY - drag.y) * 0.006),
        );
        render();
      }
    };
    const up = (e: PointerEvent) => {
      drag = null;
      if (canvas.hasPointerCapture(e.pointerId))
        canvas.releasePointerCapture(e.pointerId);
      canvas.style.cursor = "grab";
    };
    const lost = () => {
      setFailed(true);
    };
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    setViewRef.current = (name) => {
      if (name === "in") distance = Math.max(95, distance - 20);
      else if (name === "out") distance = Math.min(210, distance + 20);
      else {
        yaw = name === "front" ? 0 : 0.75;
        pitch = name === "top" ? 1.46 : name === "front" ? 0.08 : 0.43;
        distance = 145;
      }
      render();
    };
    resize();
    update();
    return () => {
      sync.current = null;
      setViewRef.current = null;
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      disposeObject(scene);
      renderer.dispose();
      canvas.remove();
    };
  }, []);
  useEffect(() => {
    sync.current?.();
  }, [props.height, props.contact, props.surface, props.angle, part]);
  return (
    <div className="sphere-webgl-wrap">
      <div className="sphere-view-controls">
        {[
          ["perspective", "3D view", "முப்பரிமாணம்"],
          ["front", "Front", "முன்பக்கம்"],
          ["top", "Top", "மேற்பக்கம்"],
          ["in", "Zoom +", "பெரிதாக்கு +"],
          ["out", "Zoom −", "சிறிதாக்கு −"],
        ].map(([id, en, ta]) => (
          <button
            key={id}
            aria-pressed={id === view}
            onClick={() => {
              setView(id);
              setViewRef.current?.(id);
            }}
          >
            {T(en, ta)}
          </button>
        ))}
      </div>
      <div
        ref={host}
        className="sphere-webgl"
        role={props.anatomy ? "img" : "slider"}
        aria-label={T(
          props.anatomy
            ? "3D spherometer with three solid legs"
            : "Central screw height",
          props.anatomy
            ? "மூன்று கால்களுடன் முப்பரிமாண கோளமானி"
            : "திருகாணியின் உயரம்",
        )}
        tabIndex={props.anatomy ? -1 : 0}
        aria-valuemin={props.anatomy ? undefined : surfaces[props.surface].h}
        aria-valuemax={props.anatomy ? undefined : 4}
        aria-valuenow={props.anatomy ? undefined : props.height}
        aria-disabled={props.anatomy ? undefined : props.locked}
        onKeyDown={(e) => {
          if (props.anatomy || props.locked) return;
          if (["ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) {
            e.preventDefault();
            props.onMove(
              e.key === "Home"
                ? surfaces[props.surface].h
                : e.key === "End"
                  ? 4
                  : props.height +
                    (e.key === "ArrowUp" ? 1 : -1) * (e.shiftKey ? 0.1 : 0.01),
            );
          }
        }}
      >
        {failed && (
          <p className="sphere-webgl-fallback">
            {T(
              "3D needs WebGL. Enable hardware acceleration or try another browser. The scale reader and measurement buttons below still work.",
              "முப்பரிமாணக் காட்சிக்கு WebGL தேவை. வன்பொருள் முடுக்கத்தை இயக்கவும் அல்லது வேறு உலாவியைப் பயன்படுத்தவும். கீழுள்ள அளவிடைகளும் அளவீட்டுப் பொத்தான்களும் தொடர்ந்து இயங்கும்.",
            )}
          </p>
        )}
        {props.anatomy && !failed && (
          <>
            <svg
              className="sphere-part-leader"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <line
                ref={labelLine}
                x1="20"
                y1="12"
                stroke="#8fe3e8"
                strokeWidth=".3"
              />
              <circle ref={labelDot} r=".8" fill="#8fe3e8" />
            </svg>
            <span className="sphere-part-name">
              {T(
                labels.find((l) => l[0] === part)![1],
                labels.find((l) => l[0] === part)![2],
              )}
            </span>
          </>
        )}
      </div>
      <p className="sphere-orbit-hint">
        {T(
          "Drag the background to turn the instrument. Drag the metal knob or disc up/down to move the screw.",
          "கருவியைச் சுழற்றப் பின்னணியை இழுக்கவும். திருகாணியை நகர்த்த உலோகக் குமிழை அல்லது வட்டத்தட்டை மேலே / கீழே இழுக்கவும்.",
        )}
      </p>
      {props.anatomy && (
        <div className="sphere-parts">
          {labels.map(([id, en, ta]) => (
            <button
              key={id}
              aria-pressed={part === id}
              onClick={() => setPart(id)}
            >
              {T(en, ta)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
