
"use client";

import { Suspense, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

type HeartMode = "external" | "internal";

const MODELS = {
  external: "/models/human-heart-light.glb",
  internal: "/models/human-heart-cutaway-light.glb",
};

function HeartModel({ mode }: { mode: HeartMode }) {
  const { scene } = useGLTF(MODELS[mode]);

  const heart = useMemo(() => {
    const model = scene.clone(true);

    const bounds = new THREE.Box3().setFromObject(model);
    const dimensions = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());

    const largest = Math.max(
      dimensions.x,
      dimensions.y,
      dimensions.z
    );

    const scale = largest > 0 ? 3.5 / largest : 1;

    model.scale.setScalar(scale);
    model.position.set(
      -center.x * scale,
      -center.y * scale,
      -center.z * scale
    );

    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    return model;
  }, [scene]);

  return <primitive object={heart} />;
}

function LoadingHeart() {
  return (
    <Html center>
      <span className="heart-loading">Loading heart...</span>
    </Html>
  );
}

export default function Heart3D() {
  const [mode, setMode] = useState<HeartMode>("external");
  const [autoRotate, setAutoRotate] = useState(true);

  const structures =
    mode === "external"
      ? [
          "Aorta",
          "Pulmonary trunk",
          "Superior vena cava",
          "Inferior vena cava",
          "Coronary arteries",
        ]
      : [
          "Right atrium",
          "Left atrium",
          "Right ventricle",
          "Left ventricle",
          "Tricuspid valve",
          "Mitral valve",
          "Interventricular septum",
        ];

  return (
    <div className="rca-hero-heart">

      <div className="heart-view-controls">
        <button
          type="button"
          className={mode === "external" ? "selected" : ""}
          onClick={() => setMode("external")}
          aria-pressed={mode === "external"}
        >
          External View
        </button>

        <button
          type="button"
          className={mode === "internal" ? "selected" : ""}
          onClick={() => setMode("internal")}
          aria-pressed={mode === "internal"}
        >
          Explore Inside
        </button>
      </div>

      <div className="heart-model">
        <Canvas
          key={mode}
          camera={{
            position: [0, 0, 5],
            fov: 35,
            near: 0.01,
            far: 100,
          }}
          dpr={[1, 1.5]}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "default",
          }}
        >
          <ambientLight intensity={1.8} />

          <directionalLight
            position={[4, 5, 5]}
            intensity={2.5}
          />

          <directionalLight
            position={[-4, 2, -3]}
            intensity={1.5}
            color="#ffb3a5"
          />

          <pointLight
            position={[0, 0, 4]}
            intensity={0.8}
          />

          <Suspense fallback={<LoadingHeart />}>
            <HeartModel mode={mode} />
          </Suspense>

          <OrbitControls
            makeDefault
            enablePan={false}
            enableZoom
            minDistance={2.8}
            maxDistance={7}
            autoRotate={autoRotate}
            autoRotateSpeed={1.1}
          />
        </Canvas>
      </div>

      <div className="heart-rotation-control">
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
        >
          {autoRotate ? "Ⅱ Pause Rotation" : "▶ Start Rotation"}
        </button>

        <span>Drag to rotate · Pinch to zoom</span>
      </div>

      <div className="heart-anatomy">
        <span className="heart-anatomy-heading">
          {mode === "external"
            ? "EXTERNAL ANATOMY"
            : "INTERNAL ANATOMY"}
        </span>

        <div className="heart-structure-list">
          {structures.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>

      <style jsx>{`
        .rca-hero-heart {
          width: 100%;
          min-width: 0;
          color: white;
          background: transparent;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .heart-view-controls {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
          position: relative;
          z-index: 2;
        }

        .heart-view-controls button,
        .heart-rotation-control button {
          padding: 10px 16px;
          border: 1px solid rgba(255,255,255,0.4);
          border-radius: 30px;
          background: transparent;
          color: white;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .heart-view-controls button.selected {
          background: #bd263d;
          border-color: #bd263d;
        }

        .heart-model {
          width: 100%;
          height: 480px;
          background: transparent;
          overflow: visible;
        }

        .heart-model canvas {
          background: transparent !important;
        }

        .heart-rotation-control {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: -15px;
          color: #d5deeb;
          font-size: 11px;
          position: relative;
          z-index: 2;
        }

        .heart-rotation-control button {
          background: rgba(255,255,255,0.1);
        }

        .heart-anatomy {
          width: 100%;
          margin-top: 22px;
          text-align: center;
        }

        .heart-anatomy-heading {
          color: #f08091;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .heart-structure-list {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 8px 18px;
          margin-top: 12px;
        }

        .heart-structure-list span {
          color: #e0e8f4;
          font-size: 12px;
          line-height: 1.5;
        }

        .heart-loading {
          color: white;
          font-size: 13px;
          white-space: nowrap;
        }

        @media (max-width: 700px) {
          .heart-model {
            height: 390px;
          }

          .heart-view-controls button {
            padding: 9px 13px;
            font-size: 11px;
          }

          .heart-structure-list {
            gap: 7px 12px;
          }

          .heart-structure-list span {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}
