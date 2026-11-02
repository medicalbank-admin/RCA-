
"use client";

import { Suspense, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Bounds,
  Center,
  Html,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";

type HeartMode = "external" | "internal";

const MODELS = {
  external: "/models/human-heart-light.glb",
  internal: "/models/human-heart-cutaway-light.glb",
};

function HeartModel({ mode }: { mode: HeartMode }) {
  const modelPath = MODELS[mode];
  const { scene } = useGLTF(modelPath);

  const heart = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    return cloned;
  }, [scene]);

  return (
    <Bounds fit clip observe margin={1.35}>
      <Center>
        <primitive object={heart} />
      </Center>
    </Bounds>
  );
}

function LoadingHeart() {
  return (
    <Html center>
      <div
        style={{
          color: "#ffffff",
          fontSize: "14px",
          whiteSpace: "nowrap",
          background: "#111827",
          padding: "12px 18px",
          borderRadius: "12px",
        }}
      >
        Loading anatomical heart...
      </div>
    </Html>
  );
}

const externalStructures = [
  "Aorta",
  "Pulmonary trunk",
  "Superior vena cava",
  "Inferior vena cava",
  "Coronary arteries",
  "Right and left auricles",
];

const internalStructures = [
  "Right atrium",
  "Left atrium",
  "Right ventricle",
  "Left ventricle",
  "Tricuspid valve",
  "Mitral valve",
  "Interventricular septum",
  "Aortic and pulmonary valves",
];

export default function Heart3D() {
  const [mode, setMode] = useState<HeartMode>("external");
  const [autoRotate, setAutoRotate] = useState(true);

  const structures =
    mode === "external" ? externalStructures : internalStructures;

  return (
    <section className="rca-heart-section">
      <div className="rca-heart-heading">
        <span className="rca-heart-eyebrow">EXPLORE HUMAN ANATOMY</span>

        <h2>Discover the Human Heart</h2>

        <p>
          Explore the heart in interactive 3D. Rotate the model,
          examine its external anatomy and explore its internal chambers.
        </p>
      </div>

      <div className="rca-heart-viewer">
        <div className="rca-heart-toolbar">
          <button
            type="button"
            className={mode === "external" ? "active" : ""}
            onClick={() => setMode("external")}
            aria-pressed={mode === "external"}
          >
            External View
          </button>

          <button
            type="button"
            className={mode === "internal" ? "active" : ""}
            onClick={() => setMode("internal")}
            aria-pressed={mode === "internal"}
          >
            Explore Inside
          </button>
        </div>

        <div className="rca-heart-canvas">
          <Canvas
            key={mode}
            camera={{
              position: [0, 0, 4],
              fov: 40,
              near: 0.01,
              far: 100,
            }}
            dpr={[1, 1.5]}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "default",
            }}
          >
            <color attach="background" args={["#101827"]} />

            <ambientLight intensity={1.5} />

            <directionalLight
              position={[4, 5, 5]}
              intensity={2.2}
            />

            <directionalLight
              position={[-4, 2, -3]}
              intensity={1.1}
              color="#ffb3a5"
            />

            <Suspense fallback={<LoadingHeart />}>
              <HeartModel mode={mode} />
            </Suspense>

            <OrbitControls
              makeDefault
              enablePan={false}
              enableZoom={true}
              minDistance={1.8}
              maxDistance={8}
              autoRotate={autoRotate}
              autoRotateSpeed={1.1}
              minPolarAngle={0.3}
              maxPolarAngle={Math.PI - 0.3}
            />
          </Canvas>
        </div>

        <div className="rca-heart-controls">
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
          >
            {autoRotate ? "Pause Rotation" : "Start Rotation"}
          </button>

          <span>Drag to rotate · Pinch to zoom</span>
        </div>
      </div>

      <div className="rca-heart-info">
        <div>
          <span className="rca-heart-eyebrow">
            {mode === "external"
              ? "EXTERNAL ANATOMY"
              : "INTERNAL ANATOMY"}
          </span>

          <h3>
            {mode === "external"
              ? "External Heart Structures"
              : "Inside the Heart"}
          </h3>

          <p>
            {mode === "external"
              ? "Examine the major blood vessels and external structures of the human heart."
              : "Explore the chambers, valves and muscular wall separating the right and left sides of the heart."}
          </p>
        </div>

        <ul>
          {structures.map((structure) => (
            <li key={structure}>{structure}</li>
          ))}
        </ul>
      </div>

      <p className="rca-heart-note">
        Educational 3D visualization. Anatomical structures should be
        verified against standard medical references.
      </p>

      <style jsx>{`
        .rca-heart-section {
          width: 100%;
          padding: 55px 20px;
          color: #172033;
        }

        .rca-heart-heading {
          max-width: 720px;
          margin: 0 auto 28px;
          text-align: center;
        }

        .rca-heart-eyebrow {
          color: #bd3650;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .rca-heart-heading h2 {
          margin: 12px 0;
          font-size: clamp(26px, 5vw, 40px);
          font-weight: 800;
        }

        .rca-heart-heading p,
        .rca-heart-info p {
          color: #647084;
          line-height: 1.7;
        }

        .rca-heart-viewer {
          max-width: 850px;
          margin: auto;
          overflow: hidden;
          border-radius: 22px;
          background: #101827;
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.14);
        }

        .rca-heart-toolbar {
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          padding: 18px 12px 12px;
        }

        .rca-heart-toolbar button,
        .rca-heart-controls button {
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 30px;
          padding: 11px 19px;
          background: transparent;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }

        .rca-heart-toolbar button.active {
          background: #c83752;
          border-color: #c83752;
        }

        .rca-heart-canvas {
          width: 100%;
          height: 430px;
          touch-action: pan-y;
        }

        .rca-heart-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 15px;
          padding: 12px 15px 20px;
          color: #cbd5e1;
          font-size: 12px;
        }

        .rca-heart-controls button {
          background: #26364c;
        }

        .rca-heart-info {
          max-width: 850px;
          margin: 30px auto 0;
          padding: 25px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
        }

        .rca-heart-info h3 {
          font-size: 22px;
          margin: 10px 0;
        }

        .rca-heart-info ul {
          margin: 0;
          padding-left: 20px;
          color: #374151;
          line-height: 2;
        }

        .rca-heart-note {
          max-width: 850px;
          margin: 15px auto 0;
          color: #8490a0;
          font-size: 11px;
          text-align: center;
        }

        @media (max-width: 600px) {
          .rca-heart-section {
            padding: 35px 12px;
          }

          .rca-heart-canvas {
            height: 340px;
          }

          .rca-heart-info {
            grid-template-columns: 1fr;
            padding: 19px;
          }

          .rca-heart-toolbar button {
            padding: 10px 14px;
            font-size: 12px;
          }
        }
      `}</style>
    </section>
  );
      }
