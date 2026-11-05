// frontend/src/components/Motion/Auth3DScene.jsx
// REAL 3D scene behind auth cards
// Uses @react-three/fiber + @react-three/drei (both already installed)
// No new dependencies

import React, { useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, TorusKnot, Icosahedron, Sphere, Environment } from '@react-three/drei';
import * as THREE from 'three';

/* Rotating torus knot — top right */
function Knot({ color = '#8b5cf6' }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * 0.18;
    ref.current.rotation.y = state.clock.elapsedTime * 0.24;
  });
  return (
    <Float speed={1.4} rotationIntensity={0.8} floatIntensity={1.4}>
      <TorusKnot ref={ref} args={[1, 0.3, 128, 32]} position={[3.2, 1.6, 0]}>
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.35}
          distort={0.35}
          speed={1.6}
          roughness={0.15}
          metalness={0.9}
        />
      </TorusKnot>
    </Float>
  );
}

/* Icosahedron — bottom left */
function Ico({ color = '#3b82f6' }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * 0.12;
    ref.current.rotation.z = state.clock.elapsedTime * 0.2;
  });
  return (
    <Float speed={1.1} rotationIntensity={0.5} floatIntensity={2}>
      <Icosahedron ref={ref} args={[1.2, 0]} position={[-3.4, -1.8, 0]}>
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          distort={0.28}
          speed={1.3}
          roughness={0.25}
          metalness={0.75}
        />
      </Icosahedron>
    </Float>
  );
}

/* Central distorted sphere — far back */
function Center({ color = '#06b6d4' }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.1;
  });
  return (
    <Sphere ref={ref} args={[1.7, 64, 64]} position={[0, 0.4, -3]}>
      <MeshDistortMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.25}
        distort={0.55}
        speed={2}
        roughness={0.1}
        metalness={0.95}
        transparent
        opacity={0.85}
      />
    </Sphere>
  );
}

/* Small orbiting particles */
function Particles({ count = 50 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      arr[i] = (Math.random() - 0.5) * 16;
      arr[i + 1] = (Math.random() - 0.5) * 12;
      arr[i + 2] = (Math.random() - 0.5) * 8 - 2;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.035;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.07} color="#a5b4fc" transparent opacity={0.75} sizeAttenuation />
    </points>
  );
}

/* Parallax rig — moves whole scene with mouse for depth */
function ParallaxRig({ children, strength = 0.35 }) {
  const { camera, pointer } = useThree();
  const target = useRef({ x: 0, y: 0 });
  useFrame(() => {
    target.current.x += (pointer.x * strength - target.current.x) * 0.06;
    target.current.y += (pointer.y * strength - target.current.y) * 0.06;
    camera.position.x = target.current.x;
    camera.position.y = target.current.y;
    camera.lookAt(0, 0, 0);
  });
  return <>{children}</>;
}

export default function Auth3DScene({
  variant = 'default',
  intensity = 1,
}) {
  const palette = {
    default: { knot: '#8b5cf6', ico: '#3b82f6', center: '#06b6d4' },
    register: { knot: '#10b981', ico: '#06b6d4', center: '#8b5cf6' },
    otp: { knot: '#f59e0b', ico: '#ec4899', center: '#6366f1' },
    forgot: { knot: '#3b82f6', ico: '#8b5cf6', center: '#06b6d4' },
  }[variant] || { knot: '#8b5cf6', ico: '#3b82f6', center: '#06b6d4' };

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ParallaxRig strength={0.35 * intensity}>
            <ambientLight intensity={0.55} />
            <directionalLight position={[5, 5, 5]} intensity={1.2} />
            <pointLight position={[-5, -5, -5]} intensity={0.8} color={palette.knot} />
            <pointLight position={[4, -3, 2]} intensity={0.5} color={palette.ico} />

            <Center color={palette.center} />
            <Knot color={palette.knot} />
            <Ico color={palette.ico} />
            <Particles count={50} />
          </ParallaxRig>
        </Suspense>
      </Canvas>
    </div>
  );
}