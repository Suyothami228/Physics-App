import { tmSpecimens, type TMSpecimen } from "../domain/travelling";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createTravellingMicroscope } from "./travellingMesh";
import { disposeObject } from "./spherometerMesh";
import { useApp } from "../state";
type Props = {
  x: number;
  y: number;
  mode: string;
  specimen: TMSpecimen;
  stage: string;
  locked: boolean;
  anatomy?: boolean;
  onMove: (x: number, y: number) => void;
};
export function TravellingScene(props: Props) {
  const { T } = useApp();
  const host = useRef<HTMLDivElement>(null),
    live = useRef(props);
  live.current = props;
  const update = useRef<(() => void) | null>(null),
    cameraControl = useRef<((s: string) => void) | null>(null);
  const [failed, setFailed] = useState(false),
    [part, setPart] = useState("scope");
  const partRef = useRef(part);
  partRef.current = part;
  const line = useRef<SVGLineElement>(null),
    dot = useRef<SVGCircleElement>(null);
  const labels = [
    ["scope", "Microscope", "நுணுக்குக்காட்டி"],
    ["vertical", "Vertical main scale", "நிலைக்குத்துப் பிரதான அளவிடை"],
    ["horizontal", "Horizontal main scale", "கிடைப் பிரதான அளவிடை"],
    ["fine", "Fine adjustment", "நுண் சீராக்கி"],
    ["base", "Levelling base", "மட்டப்படுத்தும் அடித்தளம்"],
  ];
  useEffect(() => {
    const el = host.current!;
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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    const canvas = renderer.domElement;
    canvas.style.touchAction = "none";
    el.prepend(canvas);
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(36, 1, 0.1, 600);
    scene.add(new THREE.HemisphereLight(0xd8efff, 0x4e5661, 3));
    const light = new THREE.DirectionalLight(0xffedce, 3.5);
    light.position.set(-70, 130, 90);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    Object.assign(light.shadow.camera, {
      left: -100,
      right: 100,
      top: 100,
      bottom: -100,
      near: 1,
      far: 300,
    });
    scene.add(light);
    const rim = new THREE.DirectionalLight(0x9ccfff, 2);
    rim.position.set(80, 60, -60);
    scene.add(rim);
    const model = createTravellingMicroscope();
    scene.add(model.root);
    let yaw = 0.65,
      pitch = 0.26,
      distance = 205;
    const render = () => {
      const d = distance / Math.min(1, camera.aspect);
      camera.position.set(
        Math.sin(yaw) * Math.cos(pitch) * d,
        30 + Math.sin(pitch) * d,
        Math.cos(yaw) * Math.cos(pitch) * d,
      );
      camera.lookAt(0, 30, 0);
      camera.updateMatrixWorld();
      renderer.render(scene, camera);
      const p = live.current;
      const points: Record<string, THREE.Vector3> = {
        scope: new THREE.Vector3(p.x - 40, p.y + 4, 22),
        vertical: new THREE.Vector3(p.x - 42, 60, -9),
        horizontal: new THREE.Vector3(25, 1, -5),
        fine: new THREE.Vector3(p.x - 30, p.y, -13),
        base: new THREE.Vector3(33, -12, 30),
      };
      const point = points[partRef.current].project(camera);
      line.current?.setAttribute("x2", String((point.x + 1) * 50));
      line.current?.setAttribute("y2", String((1 - point.y) * 50));
      dot.current?.setAttribute("cx", String((point.x + 1) * 50));
      dot.current?.setAttribute("cy", String((1 - point.y) * 50));
    };
    const sync = () => {
      const p = live.current;
      model.carriage.position.x = p.x - 40;
      model.scope.position.y = p.y;
      const shape = tmSpecimens[p.specimen].shape;
      model.specimen.visible = p.mode === "tube" && shape === "rubber";
      model.bubble.visible = p.mode === "tube" && shape === "bubble";
      model.capillary.visible = p.mode === "tube" && shape === "capillary";
      model.slab.visible = p.mode === "glass";
      model.slabMesh.visible = p.stage !== "reference";
      model.outline.visible = p.stage !== "reference";
      model.dust.visible = p.stage === "top";
      render();
    };
    update.current = sync;
    const resize = () => {
      const w = el.clientWidth,
        h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      render();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const ray = new THREE.Raycaster(),
      mouse = new THREE.Vector2();
    let drag: null | {
      kind: string;
      x: number;
      y: number;
      mx: number;
      my: number;
      yaw: number;
      pitch: number;
      sx: [number, number];
      sy: [number, number];
    } = null;
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const b = canvas.getBoundingClientRect();
      mouse.set(
        ((e.clientX - b.left) / b.width) * 2 - 1,
        (-(e.clientY - b.top) / b.height) * 2 + 1,
      );
      ray.setFromCamera(mouse, camera);
      const hit = ray.intersectObjects([
        model.body,
        model.fineKnob,
        model.focusKnob,
        model.horizontalKnob,
        model.horizontalCarriage,
        model.column,
        model.tube,
      ])[0];
      const origin = hit?.point ?? new THREE.Vector3(0, live.current.y, -13);
      const screenAxis = (axis: THREE.Vector3): [number, number] => {
        const a = origin.clone().project(camera);
        const z = origin.clone().add(axis).project(camera);
        return [((z.x - a.x) * b.width) / 2, (-(z.y - a.y) * b.height) / 2];
      };
      drag = {
        kind: live.current.anatomy
          ? "orbit"
          : !hit
            ? "orbit"
            : [
                  model.horizontalKnob,
                  model.horizontalCarriage,
                  model.column,
                ].some((part) => part === hit.object)
              ? "x"
              : [model.body, model.tube].some((part) => part === hit.object)
                ? "pending"
                : "y",
        sx: screenAxis(new THREE.Vector3(1, 0, 0)),
        sy: screenAxis(new THREE.Vector3(0, 1, 0)),
        x: e.clientX,
        y: e.clientY,
        mx: live.current.x,
        my: live.current.y,
        yaw,
        pitch,
      };
      el.focus({ preventScroll: true });
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      if (drag.kind === "orbit") {
        yaw = drag.yaw - (e.clientX - drag.x) * 0.008;
        pitch = Math.max(
          0.05,
          Math.min(1.4, drag.pitch + (e.clientY - drag.y) * 0.006),
        );
        render();
      } else if (!live.current.locked) {
        const dx = e.clientX - drag.x,
          dy = e.clientY - drag.y;
        if (drag.kind === "pending") {
          if (Math.hypot(dx, dy) < 4) return;
          const alignment = ([ax, ay]: [number, number]) =>
            Math.abs(dx * ax + dy * ay) / Math.max(0.01, Math.hypot(ax, ay));
          drag.kind = alignment(drag.sx) >= alignment(drag.sy) ? "x" : "y";
        }
        const [ax, ay] = drag.kind === "x" ? drag.sx : drag.sy;
        const length2 = ax * ax + ay * ay;
        // Match world-axis travel to the displayed camera angle and zoom.
        // At an edge-on angle, retain a usable screen-direction fallback.
        const delta =
          length2 > 0.04
            ? (dx * ax + dy * ay) / length2
            : (drag.kind === "x" ? dx : -dy) * 0.1;
        canvas.style.cursor = drag.kind === "x" ? "ew-resize" : "ns-resize";
        live.current.onMove(
          drag.kind === "x" ? drag.mx + delta : drag.mx,
          drag.kind === "y" ? drag.my + delta : drag.my,
        );
      }
    };
    const up = (e: PointerEvent) => {
      drag = null;
      canvas.style.cursor = "grab";
      if (canvas.hasPointerCapture(e.pointerId))
        canvas.releasePointerCapture(e.pointerId);
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    cameraControl.current = (name) => {
      if (name === "in") distance = Math.max(135, distance - 25);
      else if (name === "out") distance = Math.min(280, distance + 25);
      else {
        yaw = name === "front" ? 0 : 0.65;
        pitch = name === "front" ? 0.08 : 0.26;
        distance = 205;
      }
      render();
    };
    resize();
    sync();
    return () => {
      ro.disconnect();
      update.current = null;
      cameraControl.current = null;
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
    update.current?.();
  }, [props.x, props.y, props.mode, props.specimen, props.stage, part]);
  return (
    <div className="tm-scene-wrap">
      <div className="sphere-view-controls">
        {[
          ["3d", "3D view", "முப்பரிமாணம்"],
          ["front", "Front view", "முன்பக்கம்"],
          ["in", "Zoom +", "பெரிதாக்கு +"],
          ["out", "Zoom −", "சிறிதாக்கு −"],
        ].map(([id, en, ta]) => (
          <button key={id} onClick={() => cameraControl.current?.(id)}>
            {T(en, ta)}
          </button>
        ))}
      </div>
      <div
        ref={host}
        className="tm-scene"
        tabIndex={props.anatomy ? -1 : 0}
        role="group"
        aria-label={T(
          "3D travelling microscope",
          "முப்பரிமாண நகரும் நுணுக்குக்காட்டி",
        )}
        onKeyDown={(e) => {
          if (props.anatomy || props.locked || !e.key.startsWith("Arrow"))
            return;
          e.preventDefault();
          const step = e.shiftKey ? 0.5 : 0.01;
          props.onMove(
            props.x +
              (e.key === "ArrowRight"
                ? step
                : e.key === "ArrowLeft"
                  ? -step
                  : 0),
            props.y +
              (e.key === "ArrowUp" ? step : e.key === "ArrowDown" ? -step : 0),
          );
        }}
      >
        {failed && (
          <p>
            {T(
              "WebGL is unavailable. The optical view and measurement controls below still work.",
              "WebGL கிடைக்கவில்லை. கீழுள்ள ஒளியியல் காட்சியும் அளவீட்டுப் பொத்தான்களும் தொடர்ந்து இயங்கும்.",
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
                ref={line}
                x1="20"
                y1="12"
                stroke="#8fe3e8"
                strokeWidth=".3"
              />
              <circle ref={dot} r=".8" fill="#8fe3e8" />
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
          "Drag the column or base carriage sideways. Drag the microscope body sideways or up/down. Drag the background to rotate.",
          "தூணை அல்லது அடித் தாங்கியைப் பக்கவாட்டில் இழுக்கவும். நுணுக்குக்காட்டியைப் பக்கவாட்டில் அல்லது மேலே / கீழே இழுக்கவும். சுழற்றப் பின்னணியை இழுக்கவும்.",
        )}
      </p>
      {props.anatomy && (
        <div className="sphere-parts">
          {labels.map(([id, en, ta]) => (
            <button
              key={id}
              aria-pressed={id === part}
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
