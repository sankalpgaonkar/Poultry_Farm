import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * A stylised low-poly poultry farm, built entirely from three.js primitives in code
 * (no downloaded models or textures). The island turns slowly, leans towards the mouse
 * and rotates/zooms as the page scrolls. `lite` (phones) drops shadows and extra props.
 */

const C = {
  grass: '#86b84a', grassDark: '#6b9a3a', soil: '#8a5a3c', soilDark: '#6d4530', barn: '#c2452d', roof: '#5a2a20', trim: '#fff7ea',
  coop: '#f1dfbd', coopRoof: '#d9822b', silo: '#c9d3dc', siloTop: '#8fa1b3', trunk: '#7a4e2d', leaf: ['#4f8a3a', '#5f9e43', '#3f7a33'],
  hay: '#e8c25a', crop: ['#c9d94f', '#9fc13f'], egg: '#fbf3e4', eggBrown: '#e7b98a', gold: '#f2b544', fence: '#d8c3a0', water: '#5fb3d9',
};

const flat = (color, extra = {}) => <meshStandardMaterial color={color} flatShading roughness={0.85} metalness={0} {...extra} />;

function useEggGeometry() {
  return useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 16; i += 1) {
      const t = (i / 16) * Math.PI;
      pts.push(new THREE.Vector2(Math.sin(t) * (0.78 + 0.1 * Math.cos(t)) * 0.5, -Math.cos(t) * 0.62));
    }
    return new THREE.LatheGeometry(pts, 14);
  }, []);
}

function Island({ lite }) {
  return (
    <group>
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <cylinderGeometry args={[4.2, 4.2, 0.4, 9]} />
        {flat(C.grass)}
      </mesh>
      <mesh position={[0, -1.15, 0]}>
        <cylinderGeometry args={[4.2, 2.6, 1.5, 9]} />
        {flat(C.soil)}
      </mesh>
      <mesh position={[0, -2.25, 0]}>
        <coneGeometry args={[2.6, 1.0, 9]} />
        {flat(C.soilDark)}
      </mesh>
      {!lite && [[-3.1, -0.9, 1.9], [2.7, -1.2, -2.3], [0.8, -1.6, 2.9]].map((p, i) => (
        <mesh key={i} position={p} rotation={[i, i * 2, 0]}>
          <dodecahedronGeometry args={[0.35 + i * 0.08, 0]} />
          {flat('#9b9488')}
        </mesh>
      ))}
    </group>
  );
}

function Barn(props) {
  return (
    <group {...props}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 1.2, 1.3]} />
        {flat(C.barn)}
      </mesh>
      {/* gable roof: a 3-sided prism */}
      <mesh position={[0, 1.42, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.62, 1, 1.12]} castShadow>
        <cylinderGeometry args={[0.75, 0.75, 1.5, 3]} />
        {flat(C.roof)}
      </mesh>
      <mesh position={[0, 0.45, 0.66]}>
        <boxGeometry args={[0.62, 0.9, 0.04]} />
        {flat(C.trim)}
      </mesh>
      <mesh position={[0, 0.45, 0.69]}>
        <boxGeometry args={[0.5, 0.78, 0.03]} />
        {flat('#9e3424')}
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, 0.45, 0.71]} rotation={[0, 0, s * 0.95]}>
          <boxGeometry args={[0.06, 0.92, 0.02]} />
          {flat(C.trim)}
        </mesh>
      ))}
      <mesh position={[0, 1.22, 0.66]}>
        <boxGeometry args={[0.34, 0.26, 0.04]} />
        {flat(C.trim)}
      </mesh>
    </group>
  );
}

function Coop(props) {
  return (
    <group {...props}>
      {[[-0.4, -0.3], [0.4, -0.3], [-0.4, 0.3], [0.4, 0.3]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.18, z]}>
          <boxGeometry args={[0.07, 0.36, 0.07]} />
          {flat(C.trunk)}
        </mesh>
      ))}
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.55, 0.78]} />
        {flat(C.coop)}
      </mesh>
      <mesh position={[0, 1.05, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.5, 1, 0.75]} castShadow>
        <cylinderGeometry args={[0.6, 0.6, 1.1, 3]} />
        {flat(C.coopRoof)}
      </mesh>
      <mesh position={[0.15, 0.58, 0.4]}>
        <boxGeometry args={[0.26, 0.3, 0.02]} />
        {flat('#5b3a22')}
      </mesh>
      <mesh position={[0.15, 0.2, 0.75]} rotation={[0.72, 0, 0]}>
        <boxGeometry args={[0.24, 0.03, 0.6]} />
        {flat(C.fence)}
      </mesh>
    </group>
  );
}

function Silo(props) {
  return (
    <group {...props}>
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 2.0, 10]} />
        {flat(C.silo)}
      </mesh>
      <mesh position={[0, 2.0, 0]}>
        <sphereGeometry args={[0.42, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {flat(C.siloTop)}
      </mesh>
      {[0.5, 1.0, 1.5].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <torusGeometry args={[0.43, 0.02, 4, 12]} />
          {flat(C.siloTop)}
        </mesh>
      ))}
    </group>
  );
}

function Tree({ scale = 1, color = C.leaf[0], ...props }) {
  return (
    <group scale={scale} {...props}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 0.6, 5]} />
        {flat(C.trunk)}
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <icosahedronGeometry args={[0.45, 0]} />
        {flat(color)}
      </mesh>
      <mesh position={[0.12, 1.2, 0.05]} castShadow>
        <icosahedronGeometry args={[0.3, 0]} />
        {flat(color)}
      </mesh>
    </group>
  );
}

function Field(props) {
  return (
    <group {...props}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0, 0.06, i * 0.32]} receiveShadow>
          <boxGeometry args={[1.7, 0.12, 0.2]} />
          {flat(C.crop[i % 2])}
        </mesh>
      ))}
    </group>
  );
}

function Fence({ from = -0.6, to = 0.9, radius = 3.75 }) {
  const posts = [];
  for (let a = from; a <= to; a += 0.16) posts.push(a);
  return (
    <group>
      {posts.map((a) => (
        <mesh key={a} position={[Math.cos(a) * radius, 0.2, Math.sin(a) * radius]}>
          <boxGeometry args={[0.06, 0.4, 0.06]} />
          {flat(C.fence)}
        </mesh>
      ))}
      {[0.14, 0.3].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, -(from + to) / 2 + Math.PI / 2]}>
          <torusGeometry args={[radius, 0.018, 3, 40, to - from]} />
          {flat(C.fence)}
        </mesh>
      ))}
    </group>
  );
}

function HayBale(props) {
  return (
    <mesh {...props} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.22, 0.22, 0.4, 8]} />
      {flat(C.hay)}
    </mesh>
  );
}

/** A hen that walks a small loop and pecks at the ground. */
function Hen({ color = '#ffffff', radius = 0.5, center = [0, 0, 0], speed = 0.5, phase = 0, animate = true }) {
  const root = useRef();
  const head = useRef();
  useFrame(({ clock }) => {
    if (!animate || !root.current) return;
    const t = clock.elapsedTime * speed + phase;
    const walking = Math.sin(t * 0.7) > -0.2;
    const a = t * 0.6;
    if (walking) {
      root.current.position.set(center[0] + Math.cos(a) * radius, Math.abs(Math.sin(t * 9)) * 0.03, center[2] + Math.sin(a) * radius);
      root.current.rotation.y = -a;
    }
    if (head.current) head.current.rotation.z = walking ? 0 : Math.max(0, Math.sin(t * 10)) * 0.9;
  });
  return (
    <group ref={root} position={[center[0] + radius, 0, center[2]]}>
      <group scale={0.62}>
        <mesh position={[0, 0.32, 0]} scale={[1.25, 1, 0.95]} castShadow>
          <icosahedronGeometry args={[0.24, 1]} />
          {flat(color)}
        </mesh>
        <mesh position={[-0.3, 0.42, 0]} rotation={[0, 0, 0.9]}>
          <coneGeometry args={[0.12, 0.25, 4]} />
          {flat(color)}
        </mesh>
        <group ref={head} position={[0.22, 0.48, 0]}>
          <mesh position={[0.06, 0.08, 0]}>
            <icosahedronGeometry args={[0.12, 0]} />
            {flat(color)}
          </mesh>
          <mesh position={[0.06, 0.22, 0]}>
            <boxGeometry args={[0.1, 0.07, 0.03]} />
            {flat('#d63b2b')}
          </mesh>
          <mesh position={[0.19, 0.07, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.035, 0.09, 4]} />
            {flat('#f0a020')}
          </mesh>
        </group>
        {[0.06, -0.06].map((z) => (
          <mesh key={z} position={[0, 0.08, z]}>
            <cylinderGeometry args={[0.012, 0.012, 0.16, 3]} />
            {flat('#f0a020')}
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Chick({ position, phase }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = position[1] + Math.abs(Math.sin(clock.elapsedTime * 4 + phase)) * 0.05;
  });
  return (
    <mesh ref={ref} position={position} castShadow>
      <icosahedronGeometry args={[0.07, 0]} />
      {flat('#ffd54a')}
    </mesh>
  );
}

/** Gentle bob-and-spin, like drei's <Float>, without pulling in the helper library. */
function Float({ speed = 1, rotationIntensity = 1, floatIntensity = 1, offset = 0, children }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current || !speed) return;
    const t = clock.elapsedTime * speed + offset;
    ref.current.position.y = Math.sin(t) * 0.15 * floatIntensity;
    ref.current.rotation.x = Math.cos(t / 4) * 0.12 * rotationIntensity;
    ref.current.rotation.y = Math.sin(t / 4) * 0.25 * rotationIntensity;
    ref.current.rotation.z = Math.sin(t / 3) * 0.1 * rotationIntensity;
  });
  return <group ref={ref}>{children}</group>;
}

/** Soft round shadow under the island (a radial-gradient texture on a plane). */
function SoftShadow({ y = -3, size = 11 }) {
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, 'rgba(36,49,15,0.26)');
    grad.addColorStop(0.6, 'rgba(36,49,15,0.08)');
    grad.addColorStop(1, 'rgba(36,49,15,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

function FloatingEggs({ lite, animate }) {
  const egg = useEggGeometry();
  const eggs = lite
    ? [{ p: [3.4, 2.4, 0.6], c: C.egg, s: 0.75 }, { p: [2.2, 3.5, 2.8], c: C.gold, s: 1, metal: true }]
    : [
      { p: [3.4, 2.4, 0.6], c: C.egg, s: 0.8 },
      { p: [2.2, 3.7, 2.8], c: C.gold, s: 1.05, metal: true },
      { p: [1.4, 3.3, -3.0], c: C.eggBrown, s: 0.7 },
      { p: [-3.6, 1.7, 2.0], c: C.egg, s: 0.55 },
    ];
  return eggs.map((e, i) => (
    <Float key={i} offset={i * 1.7} speed={animate ? 1.4 + i * 0.3 : 0} rotationIntensity={animate ? 0.8 : 0} floatIntensity={animate ? 1.2 : 0}>
      <mesh geometry={egg} position={e.p} scale={e.s} rotation={[0.3, 0, 0.35]} castShadow>
        <meshStandardMaterial color={e.c} roughness={e.metal ? 0.32 : 0.55} metalness={e.metal ? 0.25 : 0} emissive={e.metal ? '#8a5a00' : '#000000'} emissiveIntensity={e.metal ? 0.35 : 0} />
      </mesh>
    </Float>
  ));
}

function Nest(props) {
  const egg = useEggGeometry();
  return (
    <group {...props}>
      <mesh position={[0, 0.06, 0]}>
        <torusGeometry args={[0.2, 0.08, 5, 9]} />
        {flat(C.hay)}
      </mesh>
      {[[0, 0], [0.09, 0.05], [-0.08, 0.06]].map(([x, z], i) => (
        <mesh key={i} geometry={egg} position={[x, 0.1, z]} scale={0.22} rotation={[Math.PI / 2.4, i, 0]}>
          <meshStandardMaterial color={i === 1 ? C.eggBrown : C.egg} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Clouds({ animate }) {
  const ref = useRef();
  useFrame((_, dt) => { if (animate && ref.current) ref.current.rotation.y += dt * 0.03; });
  const puff = (pos, s) => (
    <group position={pos} scale={s}>
      {[[0, 0, 0, 0.5], [0.5, -0.1, 0.1, 0.38], [-0.45, -0.12, 0, 0.36]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <icosahedronGeometry args={[r, 0]} />
          <meshStandardMaterial color="#ffffff" flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  );
  return <group ref={ref}>{puff([3.8, 4.0, -1.8], 0.9)}{puff([-3.9, 4.3, 1.2], 0.75)}{puff([0.4, 4.7, 3.6], 0.55)}</group>;
}

function Water(props) {
  return (
    <group {...props}>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.7, 0.2, 0.28]} />
        {flat('#7d8b96')}
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.62, 0.02, 0.2]} />
        <meshStandardMaterial color={C.water} roughness={0.2} metalness={0.1} />
      </mesh>
    </group>
  );
}

/** The whole farm, turning with time, mouse and scroll. */
function Farm({ lite, animate, scrollRef }) {
  const group = useRef();
  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const scroll = scrollRef.current || 0; // 0 at top, 1 after one screen
    const targetY = (animate ? state.clock.elapsedTime * 0.08 : 0.6) + state.pointer.x * 0.35 + scroll * 1.6;
    const targetX = -state.pointer.y * 0.08 + scroll * 0.18;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetY, 3, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetX, 3, dt);
    const s = 1 - Math.min(scroll, 1) * 0.12;
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, s, 4, dt));
    g.position.y = THREE.MathUtils.damp(g.position.y, -scroll * 0.8, 4, dt);
  });
  const hens = lite
    ? [{ c: '#ffffff', center: [0.6, 0, 1.6], r: 0.45, ph: 0 }, { c: '#b5651d', center: [2.0, 0, 1.9], r: 0.4, ph: 2 }, { c: '#ffffff', center: [-0.4, 0, 2.4], r: 0.35, ph: 4 }]
    : [
      { c: '#ffffff', center: [0.6, 0, 1.6], r: 0.45, ph: 0 }, { c: '#b5651d', center: [2.0, 0, 1.9], r: 0.4, ph: 2 },
      { c: '#ffffff', center: [-0.4, 0, 2.4], r: 0.35, ph: 4 }, { c: '#2b2b2b', center: [2.6, 0, 0.0], r: 0.3, ph: 1 },
      { c: '#d9a066', center: [0.3, 0, 0.4], r: 0.55, ph: 3 }, { c: '#ffffff', center: [-1.0, 0, 1.2], r: 0.3, ph: 5 },
    ];
  return (
    <group ref={group}>
      <Island lite={lite} />
      <Barn position={[-1.2, 0, -1.1]} rotation={[0, 0.35, 0]} />
      <Coop position={[1.5, 0, -0.6]} rotation={[0, -0.5, 0]} />
      <Silo position={[-2.6, 0, 0.2]} />
      <Field position={[0.6, 0, -3.1]} rotation={[0, 0.1, 0]} />
      <Tree position={[-3.2, 0, -1.6]} scale={1.1} color={C.leaf[0]} />
      <Tree position={[3.1, 0, -1.9]} scale={0.9} color={C.leaf[1]} />
      <Tree position={[-2.4, 0, 2.6]} scale={0.8} color={C.leaf[2]} />
      {!lite && <Tree position={[3.4, 0, 1.6]} scale={0.7} color={C.leaf[0]} />}
      {!lite && <Tree position={[-0.2, 0, -3.6]} scale={0.6} color={C.leaf[1]} />}
      <Fence from={-0.25} to={1.35} />
      <HayBale position={[-0.1, 0.22, -0.4]} />
      <HayBale position={[0.35, 0.22, -0.55]} />
      {!lite && <HayBale position={[0.12, 0.6, -0.48]} />}
      <Water position={[1.2, 0, 1.0]} rotation={[0, 0.4, 0]} />
      <Nest position={[2.2, 0.02, 0.6]} />
      {hens.map((h, i) => <Hen key={i} color={h.c} center={h.center} radius={h.r} phase={h.ph} speed={0.5 + i * 0.07} animate={animate} />)}
      {!lite && [[-0.75, 0.07, 1.5], [-0.62, 0.07, 1.62], [-0.85, 0.07, 1.7]].map((p, i) => <Chick key={i} position={p} phase={i} />)}
    </group>
  );
}

export default function FarmScene({ lite = false, animate = true, paused = false, scrollRef, onReady }) {
  return (
    <Canvas
      shadows={!lite}
      frameloop={paused ? 'never' : 'always'}
      dpr={lite ? [1, 1.5] : [1, 1.75]}
      camera={{ position: lite ? [10.4, 7.6, 12] : [10, 7.0, 11.4], fov: 34, near: 0.1, far: 80 }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
      onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); onReady?.(); }}
      aria-hidden="true"
    >
      <hemisphereLight args={['#fff6e0', '#6b8f3a', 0.9]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[6, 9, 4]}
        intensity={2.1}
        color="#fff1d6"
        castShadow={!lite}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0005}
      />
      <group position={[0, -0.2, 0]}>
        <Farm lite={lite} animate={animate} scrollRef={scrollRef || { current: 0 }} />
        <FloatingEggs lite={lite} animate={animate} />
        <Clouds animate={animate} />
      </group>
      <SoftShadow y={-3.1} size={8.5} />
    </Canvas>
  );
}
