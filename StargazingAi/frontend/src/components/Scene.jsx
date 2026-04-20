import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// Realistic planet configurations
const PLANET_DATA = {
  earth: {
    orbitRadius: 10, size: 1.2, color: '#2b82c9', speed: 0.3, label: 'earth',
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg'
  },
  moon: {
    orbitRadius: 2.0, size: 0.4, color: '#d9d9d9', speed: 1.2, label: 'moon', parent: 'earth',
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg'
  },
  mars: {
    orbitRadius: 16, size: 0.9, color: '#c1440e', speed: 0.24, label: 'mars',
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/mars_1k_color.jpg'
  },
  jupiter: {
    orbitRadius: 26, size: 3.0, color: '#e3b168', speed: 0.1, label: 'jupiter',
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg'
  },
  saturn: {
    orbitRadius: 38, size: 2.5, color: '#f2d599', speed: 0.08, label: 'saturn', hasRing: true,
  },
};

const CelestialBody = ({ config, selectedTarget, setTarget, bodyRef }) => {
  const isSelected = selectedTarget === config.label;
  const ringRef = useRef();
  const materialRef = useRef();
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Change cursor on hover
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [hovered]);

  // Load textures dynamically with color fallback
  useEffect(() => {
    if (config.textureUrl && materialRef.current) {
      new THREE.TextureLoader().load(
        config.textureUrl,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          materialRef.current.map = texture;
          materialRef.current.color = new THREE.Color(0xffffff);
          materialRef.current.needsUpdate = true;
        },
        undefined,
        () => {
          console.warn(`Failed to load texture for ${config.label}, using color fallback.`);
        }
      );
    }
  }, [config.textureUrl]);

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.1;
    }

    // Smooth scale: grow to 1.55x when selected, shrink back otherwise
    if (meshRef.current) {
      const targetScale = isSelected ? 1.55 : 1.0;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        delta * 4
      );
    }
  });

  return (
    <group ref={bodyRef}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          setTarget(config.label);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
      >
        <sphereGeometry args={[config.size, 64, 64]} />
        {/* No emissive tint — planet keeps its original color when selected */}
        <meshStandardMaterial
          ref={materialRef}
          color={config.color}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {config.hasRing && (
        <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, 0]}>
          <ringGeometry args={[config.size * 1.4, config.size * 2.2, 64]} />
          <meshStandardMaterial
            color="#e3cbab"
            side={THREE.DoubleSide}
            transparent={true}
            opacity={0.8}
            roughness={0.9}
          />
        </mesh>
      )}

      {/* No glow ring, no wireframe sphere — selection shown only by scale-up + camera focus */}
    </group>
  );
};

const OrbitLine = ({ radius }) => (
  <mesh rotation={[Math.PI / 2, 0, 0]}>
    <ringGeometry args={[radius - 0.05, radius + 0.05, 128]} />
    <meshBasicMaterial color="#ffffff" transparent opacity={0.15} side={THREE.DoubleSide} />
  </mesh>
);

const SolarSystem = ({ target, setTarget, controlsRef }) => {
  const earthRef = useRef();
  const moonRef = useRef();
  const marsRef = useRef();
  const jupiterRef = useRef();
  const saturnRef = useRef();

  const refs = {
    earth: earthRef,
    moon: moonRef,
    mars: marsRef,
    jupiter: jupiterRef,
    saturn: saturnRef,
  };

  const time = useRef(0);
  // Track how long since target last changed — stop animating after 1.8s so user can zoom/pan freely
  const lastTarget = useRef(target);
  const animTimer = useRef(0);

  useFrame((state, delta) => {
    time.current += delta;

    // Update planet positions on their orbits
    Object.keys(PLANET_DATA).forEach(key => {
      const config = PLANET_DATA[key];
      const ref = refs[key];
      if (!ref.current) return;

      if (config.parent) {
        const parentRef = refs[config.parent];
        if (parentRef.current) {
          const px = parentRef.current.position.x;
          const pz = parentRef.current.position.z;
          ref.current.position.x = px + Math.cos(time.current * config.speed) * config.orbitRadius;
          ref.current.position.z = pz + Math.sin(time.current * config.speed) * config.orbitRadius;
        }
      } else {
        ref.current.position.x = Math.cos(time.current * config.speed) * config.orbitRadius;
        ref.current.position.z = Math.sin(time.current * config.speed) * config.orbitRadius;
      }

      // Self rotation
      ref.current.rotation.y += delta * 0.5;
    });

    // Fly-to animation — only runs for 1.8s after a new planet is selected,
    // then stops so OrbitControls lets the user zoom/pan freely.
    if (lastTarget.current !== target) {
      lastTarget.current = target;
      animTimer.current = 0; // reset timer on new selection
    }

    if (animTimer.current < 1.8) {
      animTimer.current += delta;
      if (controlsRef.current) {
        const targetRef = refs[target];
        if (targetRef && targetRef.current) {
          const targetPos = targetRef.current.position;
          const config = PLANET_DATA[target];

          // Smoothly move the orbit pivot to the planet
          controlsRef.current.target.lerp(targetPos, 0.08);

          // Fly camera to a comfortable distance from the planet
          const desiredDistance = (config?.size ?? 1) * 6 + 5;
          const camDir = state.camera.position.clone().sub(targetPos).normalize();
          const desiredCamPos = targetPos.clone()
            .add(camDir.multiplyScalar(desiredDistance))
            .add(new THREE.Vector3(0, desiredDistance * 0.25, 0));

          state.camera.position.lerp(desiredCamPos, 0.05);
          state.camera.updateProjectionMatrix();
        }
      }
    }
  });

  return (
    <group>
      {/* Central Sun */}
      <mesh>
        <sphereGeometry args={[5, 64, 64]} />
        <meshBasicMaterial color="#ffeba1" />
        <pointLight intensity={3.5} distance={300} decay={1.2} color="#fffcf2" />
      </mesh>

      {/* Orbits */}
      <OrbitLine radius={PLANET_DATA.earth.orbitRadius} />
      <OrbitLine radius={PLANET_DATA.mars.orbitRadius} />
      <OrbitLine radius={PLANET_DATA.jupiter.orbitRadius} />
      <OrbitLine radius={PLANET_DATA.saturn.orbitRadius} />

      {/* Planets */}
      {Object.keys(PLANET_DATA).map((key) => (
        <CelestialBody
          key={key}
          config={PLANET_DATA[key]}
          selectedTarget={target}
          setTarget={setTarget}
          bodyRef={refs[key]}
        />
      ))}
    </group>
  );
};

export default function Scene({ target, setTarget }) {
  const controlsRef = useRef();

  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 20, 60], fov: 45 }}>
        <color attach="background" args={['#020206']} />

        <ambientLight intensity={0.6} color="#ffffff" />
        <directionalLight position={[-20, 10, 20]} intensity={0.5} color="#00d2ff" />

        <group>
          <Stars radius={150} depth={50} count={12000} factor={4} saturation={0} fade speed={1.5} />
          <Stars radius={100} depth={50} count={4000} factor={7} saturation={0.5} fade speed={3} />
          <Sparkles count={800} scale={120} size={2.5} speed={0.3} opacity={0.4} color="#00d2ff" />
          <Sparkles count={600} scale={120} size={2} speed={0.2} opacity={0.3} color="#ff00cc" />
        </group>

        <React.Suspense fallback={null}>
          <SolarSystem target={target} setTarget={setTarget} controlsRef={controlsRef} />
        </React.Suspense>

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={true}
          minDistance={4}
          maxDistance={120}
          maxPolarAngle={Math.PI / 2 + 0.1}
        />
      </Canvas>
    </div>
  );
}
