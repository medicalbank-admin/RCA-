
"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Center,
  Html,
  OrbitControls,
  useGLTF
} from "@react-three/drei";
import * as THREE from "three";

const HEART_MODEL =
  "https://cdn.3dassets.dev/assets/38953/v1/model.glb";

function AnatomyLabel({
  position,
  children
}: {
  position: [number, number, number];
  children: React.ReactNode;
}) {
  return (
    <Html position={position} center distanceFactor={7}>
      <span className="anatomy-label">{children}</span>
    </Html>
  );
}

function HeartModel() {
  const { scene } = useGLTF(HEART_MODEL);
  const heartRef = useRef<THREE.Group>(null);

  const heart = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    return clone;
  }, [scene]);

  useFrame(({ clock }) => {
    if (!heartRef.current) return;

    const beat = Math.sin(clock.elapsedTime * 3.2);
    const secondBeat = Math.sin(clock.elapsedTime * 6.4);

    const pulse = 1 + Math.max(0, beat) * 0.018
      + Math.max(0, secondBeat) * 0.006;

    heartRef.current.scale.setScalar(pulse);
  });

  return (
    <group ref={heartRef}>
      <Center>
        <primitive object={heart} scale={5.8} />
      </Center>

      {/* Anterior-view anatomical labels.
          Patient's right appears on the viewer's left. */}

      <AnatomyLabel position={[-0.25, 1.65, 0.25]}>
        Aorta
      </AnatomyLabel>

      <AnatomyLabel position={[-1.25, 1.15, 0.25]}>
        Pulmonary trunk
      </AnatomyLabel>

      <AnatomyLabel position={[-1.25, 0.55, 0.25]}>
        Superior vena cava
      </AnatomyLabel>

      <AnatomyLabel position={[-1.25, 0.05, 0.25]}>
        Right atrium
      </AnatomyLabel>

      <AnatomyLabel position={[1.15, 0.35, 0.25]}>
        Left atrium
      </AnatomyLabel>

      <AnatomyLabel position={[-1.05, -0.8, 0.25]}>
        Right ventricle
      </AnatomyLabel>

      <AnatomyLabel position={[1.05, -0.8, 0.25]}>
        Left ventricle
      </AnatomyLabel>

      <AnatomyLabel position={[0.85, -1.45, 0.25]}>
        Apex
      </AnatomyLabel>
    </group>
  );
}

function LoadingHeart() {
  return (
    <Html center>
      <div className="heart-loading">
        Loading 3D heart anatomy...
      </div>
    </Html>
  );
}

export default function Heart3D() {
  return (
    <div className="heart-3d-stage">
      <div className="heart-3d-glow" />

      <Canvas
        camera={{
          position: [0, 0, 5.5],
          fov: 38
        }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <ambientLight intensity={1.5} />

        <directionalLight
          position={[4, 5, 6]}
          intensity={2.2}
        />

        <directionalLight
          position={[-4, 1, -3]}
          intensity={1}
          color="#ff8b9a"
        />

        <Suspense fallback={<LoadingHeart />}>
          <HeartModel />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={3.8}
          maxDistance={8}
          autoRotate
          autoRotateSpeed={0.65}
          minPolarAngle={0.5}
          maxPolarAngle={2.5}
        />
      </Canvas>

      <div className="heart-3d-instruction">
        <span>↔</span> Drag to rotate · Pinch to zoom
      </div>

      <div className="heart-3d-caption">
        <span className="eyebrow">ANATOMY IN 3D</span>
        <h2>Explore the Human Heart</h2>
        <p>
          Rotate the model and explore the major cardiac structures.
        </p>
        <span className="heart-caption-bottom">
          LEARN · PRACTICE · EXCEL
        </span>
      </div>
    </div>
  );
}

useGLTF.preload(HEART_MODEL);
        
