import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Billboard, Html, Sparkles, Stars, Text, useTexture } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ChevronRight, ExternalLink, Mail, Menu, RotateCcw, Volume2, VolumeX, ZoomIn, ZoomOut } from 'lucide-react';
import * as THREE from 'three';
import { resume } from './data/resume';
import './styles.css';

type SectionKey = 'HOME' | 'ABOUT' | 'SKILLS' | 'EDUCATION' | 'PROJECTS' | 'EXPERIENCE' | 'CONTACT';
type TouchGesture =
  | { kind: 'swipe'; startX: number; startY: number; target: Element | null }
  | { kind: 'pinch'; startDistance: number; lastDistance: number };

const worlds: Record<SectionKey, { z: number; color: string; label: string }> = {
  HOME: { z: 18, color: '#7be7ff', label: 'ORIGIN' },
  ABOUT: { z: 0, color: '#7be7ff', label: 'ABOUT WORLD' },
  SKILLS: { z: -24, color: '#9d8cff', label: 'SKILLS CONSTELLATION' },
  EDUCATION: { z: -50, color: '#73d9ff', label: 'EDUCATION RIFT' },
  PROJECTS: { z: -82, color: '#c79cff', label: 'PROJECT WORLDS' },
  EXPERIENCE: { z: -112, color: '#7fffb0', label: 'EXPERIENCE' },
  CONTACT: { z: -145, color: '#ffffff', label: 'CONTACT CORE' },
};

function CameraRig({ targetZ, reduced }: { targetZ: number; reduced: boolean }) {
  const { camera } = useThree();
  const velocity = useRef(0);
  useFrame((state, delta) => {
    const target = new THREE.Vector3(0, 0.18, targetZ + 5.5);
    const zoomSpeed = reduced ? 1.6 : 2.6;
    const sway = reduced ? 0.16 : 0.32;
    const driftX = Math.sin(state.clock.elapsedTime * 0.12) * sway;
    const driftY = 0.14 + Math.cos(state.clock.elapsedTime * 0.15) * (reduced ? 0.05 : 0.12);

    camera.position.z = THREE.MathUtils.damp(camera.position.z, target.z, zoomSpeed, delta);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, driftX, reduced ? 1.8 : 2.8, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, driftY, reduced ? 1.8 : 2.8, delta);
    velocity.current = THREE.MathUtils.damp(velocity.current, Math.abs(camera.position.z - target.z), reduced ? 2.3 : 3.1, delta);
    camera.lookAt(0, 0, targetZ - 1.5);
  });
  return null;
}

function CosmicDust({ reduced }: { reduced: boolean }) {
  const count = 5200;
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 210;
      const swirl = angle * 2.8;
      a[i * 3] = Math.cos(angle + swirl) * radius;
      a[i * 3 + 1] = (Math.random() - 0.5) * 110;
      a[i * 3 + 2] = Math.sin(angle + swirl) * radius * 0.96;
    }
    return a;
  }, []);
  const ref = useRef<THREE.Points>(null!);
  useFrame((_, d) => {
    if (!reduced) {
      ref.current.rotation.y += d * 0.0065;
      ref.current.rotation.z += d * 0.0018;
      ref.current.rotation.x += d * 0.0012;
    }
  });
  return <points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial size={0.018} color="#eafcff" transparent opacity={0.7} depthWrite={false} /></points>;
}

function ColorStreaks({ reduced }: { reduced: boolean }) {
  const count = 150;
  const coreRef = useRef<THREE.InstancedMesh>(null!);
  const glowRef = useRef<THREE.InstancedMesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const trails = useMemo(() => Array.from({ length: count }, (_, index) => ({
    x: (Math.random() - 0.5) * 58,
    y: (Math.random() - 0.5) * 34,
    z: -Math.random() * 180 - 4,
    length: 1.2 + Math.random() * 5.8,
    width: 0.012 + Math.random() * 0.018,
    angle: (Math.random() - 0.5) * 0.7,
    speed: 42 + Math.random() * 54,
    color: ['#ff385b', '#36baff', '#53ffad'][index % 3],
  })), []);

  useEffect(() => {
    trails.forEach((trail, index) => {
      const color = new THREE.Color(trail.color);
      coreRef.current.setColorAt(index, color);
      glowRef.current.setColorAt(index, color);
    });
    if (coreRef.current.instanceColor) coreRef.current.instanceColor.needsUpdate = true;
    if (glowRef.current.instanceColor) glowRef.current.instanceColor.needsUpdate = true;
  }, [trails]);

  useFrame(({ camera }, delta) => {
    groupRef.current.position.copy(camera.position);
    groupRef.current.quaternion.copy(camera.quaternion);

    trails.forEach((trail, index) => {
      if (!reduced) {
        trail.z += trail.speed * delta;
        if (trail.z > -1) {
          trail.z = -100 - Math.random() * 84;
          trail.x = (Math.random() - 0.5) * 58;
          trail.y = (Math.random() - 0.5) * 34;
        }
      }

      dummy.position.set(trail.x, trail.y, trail.z);
      dummy.rotation.set(0, 0, trail.angle);
      dummy.scale.set(trail.width, trail.length, 1);
      dummy.updateMatrix();
      coreRef.current.setMatrixAt(index, dummy.matrix);
      dummy.scale.set(trail.width * 4.5, trail.length * 1.2, 1);
      dummy.updateMatrix();
      glowRef.current.setMatrixAt(index, dummy.matrix);
    });
    coreRef.current.instanceMatrix.needsUpdate = true;
    glowRef.current.instanceMatrix.needsUpdate = true;
  });

  return <group ref={groupRef}>
    <instancedMesh ref={glowRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </instancedMesh>
    <instancedMesh ref={coreRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial transparent opacity={0.72} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  </group>;
}

function CinematicBackdrop() {
  const ref = useRef<THREE.Group>(null!);
  useFrame((state, delta) => {
    ref.current.rotation.z += delta * 0.14;
    ref.current.rotation.x += delta * 0.1;
    ref.current.position.z = -28 + Math.sin(state.clock.elapsedTime * 0.7) * 2.8;
  });

  return <group ref={ref}>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -30]}>
      <ringGeometry args={[16, 30, 128]} />
      <meshBasicMaterial color="#8af7bf" transparent opacity={0.22} side={THREE.DoubleSide} />
    </mesh>
    <mesh rotation={[0.6, 0.8, 0.4]} position={[0, 2, -40]}>
      <torusGeometry args={[22, 0.07, 24, 200]} />
      <meshBasicMaterial color="#9ffdd0" transparent opacity={0.28} />
    </mesh>
    <mesh rotation={[0.8, 1.2, 0.8]} position={[0, -2, -48]}>
      <torusGeometry args={[26, 0.05, 18, 220]} />
      <meshBasicMaterial color="#7fe5ff" transparent opacity={0.2} />
    </mesh>
    <mesh rotation={[1.3, 0.6, 0.2]} position={[0, -4, -52]}>
      <torusGeometry args={[34, 0.04, 18, 220]} />
      <meshBasicMaterial color="#9ef2c6" transparent opacity={0.12} />
    </mesh>
  </group>;
}

function MultiverseVeil() {
  const ref = useRef<THREE.Group>(null!);
  useFrame((state, delta) => {
    ref.current.rotation.z += delta * 0.2;
    ref.current.rotation.y += delta * 0.16;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.9) * 1.8;
  });

  return <group ref={ref}>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -25]}>
      <torusGeometry args={[28, 0.1, 26, 260]} />
      <meshBasicMaterial color="#7ef7b7" transparent opacity={0.26} />
    </mesh>
    <mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0, -45]}>
      <torusGeometry args={[34, 0.09, 22, 240]} />
      <meshBasicMaterial color="#6df0b5" transparent opacity={0.18} />
    </mesh>
    <mesh rotation={[1.1, 0.7, 0.4]} position={[0, 0, -60]}>
      <torusGeometry args={[42, 0.05, 18, 220]} />
      <meshBasicMaterial color="#84f5ff" transparent opacity={0.14} />
    </mesh>
  </group>;
}

function Galaxy({ reduced }: { reduced: boolean }) {
  return <>
    <color attach="background" args={['#010404']} />
    <fog attach="fog" args={['#010404', 16, 170]} />
    <ambientLight intensity={0.08} />
    <pointLight position={[0, 4, 12]} intensity={6.4} distance={28} color="#6df0b5" />
    <pointLight position={[12, -4, -70]} intensity={5.8} distance={32} color="#5965d9" />
    <pointLight position={[-18, 6, -25]} intensity={4.8} distance={22} color="#89d9ff" />
    <Stars radius={150} depth={140} count={10000} factor={2.1} saturation={0.1} fade speed={reduced ? 0 : 0.12} />
    <CosmicDust reduced={reduced} />
    <ColorStreaks reduced={reduced} />
    <CinematicBackdrop />
    <MultiverseVeil />
    <HomeBackdrop />
    <Sparkles count={1200} scale={[80, 52, 240]} size={0.82} speed={reduced ? 0 : 0.24} color="#b7f8d3" opacity={0.2} />
    {Object.entries(worlds).filter(([k]) => k !== 'HOME').map(([key, world]) => <World key={key} world={world} section={key as SectionKey} reduced={reduced} />)}
    <EarthHome />
    <HomeBeacon />
  </>;
}

function createNightTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#020b16';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const clusters = [
    { x: 0.20, y: 0.24, r: 0.20, alpha: 0.75 },
    { x: 0.31, y: 0.32, r: 0.18, alpha: 0.8 },
    { x: 0.40, y: 0.42, r: 0.22, alpha: 0.76 },
    { x: 0.56, y: 0.30, r: 0.22, alpha: 0.8 },
    { x: 0.72, y: 0.42, r: 0.18, alpha: 0.78 },
    { x: 0.82, y: 0.24, r: 0.14, alpha: 0.66 },
    { x: 0.54, y: 0.65, r: 0.15, alpha: 0.72 },
    { x: 0.68, y: 0.72, r: 0.17, alpha: 0.78 }
  ];

  clusters.forEach(({ x, y, r, alpha }) => {
    const gradient = ctx.createRadialGradient(x * canvas.width, y * canvas.height, 0, x * canvas.width, y * canvas.height, r * canvas.width);
    gradient.addColorStop(0, `rgba(255, 232, 154, ${alpha})`);
    gradient.addColorStop(0.45, 'rgba(255, 220, 120, 0.62)');
    gradient.addColorStop(1, 'rgba(255, 220, 120, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x * canvas.width, y * canvas.height, r * canvas.width, 0, Math.PI * 2);
    ctx.fill();
  });

  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const alpha = Math.random() * 0.9;
    if (Math.random() > 0.38) {
      ctx.fillStyle = `rgba(255, 233, 164, ${alpha})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createCloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  let seed = 173;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let i = 0; i < 260; i++) {
    const x = random() * canvas.width;
    const y = random() * canvas.height;
    const radius = 20 + random() * 115;
    const opacity = 0.08 + random() * 0.12;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((random() - 0.5) * 1.4);
    ctx.scale(radius, radius * (0.18 + random() * 0.34));
    const cloud = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    cloud.addColorStop(0, `rgba(255,255,255,${opacity})`);
    cloud.addColorStop(0.56, `rgba(255,255,255,${opacity * 0.68})`);
    cloud.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = cloud;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

function EarthHome() {
  const ref = useRef<THREE.Group>(null!);
  const cloudsRef = useRef<THREE.Mesh>(null!);
  const earthTexture = useTexture('https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=80');
  const nightTexture = useMemo(() => createNightTexture(), []);
  const cloudTexture = useMemo(() => createCloudTexture(), []);

  useFrame((state, delta) => {
    ref.current.rotation.y += delta * 0.08;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.6) * 0.14;
    ref.current.position.x = 9 + Math.sin(state.clock.elapsedTime * 0.7) * 0.8;
    ref.current.position.y = 1.4 + Math.cos(state.clock.elapsedTime * 0.9) * 0.8;
    cloudsRef.current.rotation.y += delta * 0.012;
  });

  return <group ref={ref} position={[9, 1.4, -18]}>
    <mesh>
      <sphereGeometry args={[2.8, 64, 64]} />
      <meshStandardMaterial map={earthTexture} emissiveMap={nightTexture} emissive={new THREE.Color('#9ec4ff')} emissiveIntensity={1.4} roughness={0.9} metalness={0.12} />
    </mesh>
    <mesh ref={cloudsRef}>
      <sphereGeometry args={[2.835, 64, 64]} />
      <meshPhongMaterial map={cloudTexture} color="#dce8f5" transparent opacity={0.56} specular="#7188a3" shininess={10} depthWrite={false} />
    </mesh>
    <mesh scale={1.08}>
      <sphereGeometry args={[2.9, 56, 56]} />
      <meshBasicMaterial color="#8fe8ff" transparent opacity={0.15} side={THREE.BackSide} />
    </mesh>
  </group>;
}

function HomeBeacon() {
  const ref = useRef<THREE.Group>(null!);
  const cloudsRef = useRef<THREE.Mesh>(null!);
  const earthTexture = useTexture('https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=80');
  const nightTexture = useMemo(() => createNightTexture(), []);
  const cloudTexture = useMemo(() => createCloudTexture(), []);
  useFrame((state, delta) => {
    ref.current.rotation.y += delta * 0.08;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.6) * 0.035;
    ref.current.position.y = Math.cos(state.clock.elapsedTime * 0.45) * 0.16;
    cloudsRef.current.rotation.y += delta * 0.012;
  });

  return <group ref={ref} position={[0, 0, 18]}>
    <mesh>
      <sphereGeometry args={[2.8, 64, 64]} />
      <meshStandardMaterial map={earthTexture} emissiveMap={nightTexture} emissive={new THREE.Color('#9ec4ff')} emissiveIntensity={1.4} roughness={0.9} metalness={0.12} />
    </mesh>
    <mesh ref={cloudsRef}>
      <sphereGeometry args={[2.835, 64, 64]} />
      <meshPhongMaterial map={cloudTexture} color="#dce8f5" transparent opacity={0.56} specular="#7188a3" shininess={10} depthWrite={false} />
    </mesh>
    <mesh scale={1.08}>
      <sphereGeometry args={[2.9, 56, 56]} />
      <meshBasicMaterial color="#8fe8ff" transparent opacity={0.15} side={THREE.BackSide} />
    </mesh>
    <Text position={[0, -3.6, 0]} fontSize={0.48} color="#eafff7" anchorX="center" anchorY="middle">ADWAITH K.</Text>
  </group>;
}

function HomeBackdrop() {
  const ref = useRef<THREE.Group>(null!);
  useFrame((state, delta) => {
    ref.current.rotation.y += delta * 0.12;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.7) * 0.22;
    ref.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.6) * 0.14;
  });

  return <group ref={ref} position={[0, 0, 12]}>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[8.5, 13.5, 120]} />
      <meshBasicMaterial color="#8bfbc1" transparent opacity={0.18} side={THREE.DoubleSide} />
    </mesh>
    <mesh rotation={[1.2, 0.6, 0.2]}>
      <torusGeometry args={[12, 0.05, 12, 220]} />
      <meshBasicMaterial color="#7fe8ff" transparent opacity={0.22} />
    </mesh>
    <mesh rotation={[0.3, 1.4, 0.6]}>
      <torusGeometry args={[16, 0.04, 10, 220]} />
      <meshBasicMaterial color="#9af8d4" transparent opacity={0.18} />
    </mesh>
    {[...Array(42)].map((_, i) => {
      const angle = (i / 42) * Math.PI * 2;
      const radius = 4 + (i % 6) * 2.6;
      const y = Math.sin(angle * 2.7 + i) * 3.1;
      return <mesh key={i} position={[Math.cos(angle) * radius, y, -2 + (i % 8)]}><sphereGeometry args={[0.09 + (i % 3) * 0.05, 12, 12]} /><meshBasicMaterial color={i % 2 === 0 ? '#8efcc6' : '#90eaff'} transparent opacity={0.85} /></mesh>;
    })}
  </group>;
}

function World({ world, section, reduced }: { world: { z: number; color: string; label: string }; section: SectionKey; reduced: boolean }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame((state, delta) => {
    if (!reduced) {
      ref.current.rotation.y += delta * 0.02;
      ref.current.rotation.z += delta * 0.006;
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.28 + world.z) * 0.12;
    }
  });
  const rings = useMemo(() => [5.2, 7.3, 9.6], []);
  return <group ref={ref} position={[0, 0, world.z]}>
    <pointLight color={world.color} intensity={section === 'CONTACT' ? 22 : 9} distance={28} />
    {rings.map((r, i) => <mesh key={r} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[r, 0.018 + i * 0.008, 8, 180]} /><meshBasicMaterial color={world.color} transparent opacity={0.12 - i * 0.025} /></mesh>)}
    <mesh><sphereGeometry args={[1.25, 48, 48]} /><meshStandardMaterial color="#0b1830" emissive={world.color} emissiveIntensity={1.8} metalness={0.8} roughness={0.2} /></mesh>
    <mesh scale={1.5}><sphereGeometry args={[1.55, 24, 24]} /><meshBasicMaterial color={world.color} transparent opacity={0.08} /></mesh>
    <Text position={[0, 2.7, 0]} fontSize={0.55} color={world.color} anchorX="center">{world.label}</Text>
    <Text position={[0, -2.7, 0]} fontSize={0.18} color="#71829b" anchorX="center">ZOOM DEEPER</Text>
    {section === 'PROJECTS' && <ProjectMiniatures />}
    {section === 'SKILLS' && <SkillNodes color={world.color} />}
  </group>;
}

function SkillNodes({ color }: { color: string }) {
  const labels = ['JAVA', 'SPRING BOOT', 'MYSQL', 'PYTHON', 'ML', 'NEURAL NETWORKS'];
  return <>{labels.map((x, i) => { const a = i / labels.length * Math.PI * 2; return <group key={x} position={[Math.cos(a) * 4.2, Math.sin(a) * 2.1, Math.sin(a) * 1.5]}><mesh><sphereGeometry args={[0.12, 16, 16]} /><meshBasicMaterial color={color} /></mesh><Billboard><Text position={[0, .25, 0]} fontSize={0.16} color="#cfe7ff" anchorX="center">{x}</Text></Billboard></group>; })}</>;
}

function ProjectMiniatures() {
  return <group>{[-3.8, 0, 3.8].map((x, i) => <mesh key={x} position={[x, -0.3, 0]} rotation={[0.3, i, 0]}><boxGeometry args={[1.25, .7, .08]} /><meshStandardMaterial color={i === 0 ? '#66e5ff' : i === 1 ? '#a58aff' : '#79ffb1'} emissive={i === 0 ? '#115d7d' : i === 1 ? '#3b267d' : '#165c3b'} emissiveIntensity={1.2} /></mesh>)}</group>;
}

function Scene({ targetZ, reduced }: { targetZ: number; reduced: boolean }) {
  return <Canvas dpr={[1, 1.6]} camera={{ position: [0, 0.15, 24], fov: 52, near: 0.1, far: 260 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
    <Suspense fallback={null}><Galaxy reduced={reduced} /><CameraRig targetZ={targetZ} reduced={reduced} /></Suspense>
  </Canvas>;
}

function App() {
  const [section, setSection] = useState<SectionKey>('HOME');
  const [intro, setIntro] = useState(true);
  const [menu, setMenu] = useState(false);
  const [sound, setSound] = useState(true);
  const [reduced, setReduced] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const touchGesture = useRef<TouchGesture | null>(null);
  const targetZ = worlds[section].z;
  const sections = Object.keys(worlds) as SectionKey[];
  const playWhoosh = (enabled = sound) => {
    if (!enabled || !window.AudioContext) return;
    const context = audioContext.current ?? new window.AudioContext();
    audioContext.current = context;
    if (context.state === 'suspended') void context.resume();

    const now = context.currentTime;
    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.9), context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;

    const noise = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const noiseGain = context.createGain();
    noise.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, now);
    filter.frequency.exponentialRampToValueAtTime(1250, now + 0.34);
    filter.frequency.exponentialRampToValueAtTime(320, now + 1.3);
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.06, now + 0.24);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.32);
    noise.connect(filter).connect(noiseGain).connect(context.destination);
    noise.start(now);
    noise.stop(now + 1.34);

    const tone = context.createOscillator();
    const toneGain = context.createGain();
    tone.type = 'sine';
    tone.frequency.setValueAtTime(78, now);
    tone.frequency.exponentialRampToValueAtTime(42, now + 1.3);
    toneGain.gain.setValueAtTime(0.0001, now);
    toneGain.gain.exponentialRampToValueAtTime(0.032, now + 0.22);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.32);
    tone.connect(toneGain).connect(context.destination);
    tone.start(now);
    tone.stop(now + 1.34);
  };
  const go = (s: SectionKey) => {
    if (s !== section) playWhoosh();
    setSection(s);
    setMenu(false);
  };
  const advance = (direction: -1 | 1) => {
    const index = sections.indexOf(section);
    const next = Math.max(0, Math.min(sections.length - 1, index + direction));
    if (next !== index) go(sections[next]);
  };

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const getPinchDistance = (touches: TouchList) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (intro) return;
      if (Math.abs(e.deltaY) < 18) return;
      advance(e.deltaY > 0 ? -1 : 1);
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2 && !menu) {
        const distance = getPinchDistance(e.touches);
        touchGesture.current = { kind: 'pinch', startDistance: distance, lastDistance: distance };
      } else if (intro || menu) {
        touchGesture.current = null;
      } else if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchGesture.current = { kind: 'swipe', startX: touch.clientX, startY: touch.clientY, target: e.target instanceof Element ? e.target : null };
      } else {
        touchGesture.current = null;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      const gesture = touchGesture.current;
      if (gesture?.kind === 'pinch' && e.touches.length === 2) {
        e.preventDefault();
        gesture.lastDistance = getPinchDistance(e.touches);
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      const gesture = touchGesture.current;
      if (!gesture) return;

      if (gesture.kind === 'pinch') {
        if (e.touches.length > 0) return;
        touchGesture.current = null;
        const scale = gesture.lastDistance / gesture.startDistance;
        if (intro) {
          if (scale > 1.16) {
            playWhoosh();
            setIntro(false);
          }
          return;
        }
        if (scale > 1.16) advance(1);
        else if (scale < 1 / 1.16) advance(-1);
        return;
      }

      if (e.touches.length > 0 || e.changedTouches.length !== 1) return;
      touchGesture.current = null;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - gesture.startX;
      const deltaY = touch.clientY - gesture.startY;
      if (Math.abs(deltaY) < 48 || Math.abs(deltaY) < Math.abs(deltaX) * 1.25) return;
      if (gesture.target?.closest('button, a, input, textarea, select')) return;

      const overlay = gesture.target?.closest('.overlay');
      if (overlay instanceof HTMLElement && overlay.scrollHeight > overlay.clientHeight) {
        const canScroll = deltaY < 0
          ? overlay.scrollTop + overlay.clientHeight < overlay.scrollHeight - 2
          : overlay.scrollTop > 2;
        if (canScroll) return;
      }

      advance(deltaY < 0 ? 1 : -1);
    };
    const onTouchCancel = () => { touchGesture.current = null; };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchCancel, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [section, sections, intro, menu]);

  return <>
    <main ref={mainRef} aria-hidden={intro}>
    <div className="scene"><Scene targetZ={targetZ} reduced={reduced} /></div>
    <div className="vignette" />
    <div className="film-grain" />
    <header>
      <button className="brand" onClick={() => go('HOME')}>AK<span>•</span></button>
      <nav>{sections.map(s => <button key={s} className={section === s ? 'active' : ''} onClick={() => go(s)}>{s}</button>)}</nav>
      <div className="header-actions"><button aria-label={sound ? 'Mute sound effects' : 'Enable sound effects'} aria-pressed={sound} onClick={() => { if (!sound) playWhoosh(true); setSound(!sound); }}>{sound ? <Volume2 size={16} /> : <VolumeX size={16} />}</button><button className="menu" onClick={() => setMenu(!menu)}><Menu size={18}/></button></div>
    </header>
    <AnimatePresence>{menu && <motion.div className="mobile-nav" initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}}>{sections.map(s => <button key={s} onClick={() => go(s)}>{s}</button>)}</motion.div>}</AnimatePresence>

    <div className="cinema-top"><span>ADWAITH / DIGITAL UNIVERSE</span><span>{worlds[section].label}</span><span>SCENE {String(sections.indexOf(section) + 1).padStart(2,'0')} / 07</span></div>

    <section className="content">
      <AnimatePresence mode="wait">
        {section === 'HOME' && <HomeOverlay key="home" go={go} />}
        {section === 'ABOUT' && <AboutOverlay key="about" />}
        {section === 'SKILLS' && <SkillsOverlay key="skills" />}
        {section === 'EDUCATION' && <EducationOverlay key="education" />}
        {section === 'PROJECTS' && <ProjectsOverlay key="projects" />}
        {section === 'EXPERIENCE' && <ExperienceOverlay key="experience" />}
        {section === 'CONTACT' && <ContactOverlay key="contact" />}
      </AnimatePresence>
    </section>

    <div className="camera-readout"><span>CAMERA Z</span><strong>{Math.abs(targetZ).toFixed(0).padStart(3,'0')}</strong><span>·</span><span>SPATIAL MODE</span></div>
    <div className="controls"><button onClick={() => { const idx = sections.indexOf(section); if (idx < sections.length - 1) go(sections[idx + 1]); }}><ZoomIn size={15}/></button><button onClick={() => { const idx = sections.indexOf(section); if (idx > 0) go(sections[idx - 1]); }}><ZoomOut size={15}/></button><button onClick={() => go('HOME')}><RotateCcw size={15}/></button></div>
    <div className="explore-hint"><ArrowDown size={13}/> SWIPE / SCROLL TO TRAVEL THROUGH SPACE</div>
    </main>
    <AnimatePresence>{intro && <OpeningPage onEnter={() => { playWhoosh(); setIntro(false); }} />}</AnimatePresence>
  </>;
}

function OpeningPage({ onEnter }: { onEnter: () => void }) {
  return <motion.div className="opening-page" role="dialog" aria-modal="true" aria-label="Portfolio introduction" initial={{ opacity: 0, scale: 1.015 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }} transition={{ duration: 0.85, ease: [.16, 1, .3, 1] }}>
    <div className="opening-frame">
      <div className="opening-mark"><span>AK</span><i /></div>
      <div className="opening-copy">
        <div className="opening-kicker"><span />INTERACTIVE PORTFOLIO</div>
        <h1>ADWAITH <em>K.</em></h1>
        <p>A portfolio in motion.</p>
        <button className="opening-enter" autoFocus onClick={onEnter}>ENTER THE UNIVERSE <ChevronRight size={17} /></button>
      </div>
      <div className="opening-footer"><span>DESIGN · CODE · IMAGINATION</span><span>01 — 07</span></div>
    </div>
  </motion.div>;
}

function Overlay({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) { return <motion.div className="overlay" initial={{opacity:0, filter:'blur(12px)', y:20}} animate={{opacity:1, filter:'blur(0px)', y:0}} exit={{opacity:0, filter:'blur(12px)', y:-20}} transition={{duration:.75, ease:[.16,1,.3,1]}}><div className="eyebrow">{eyebrow}</div><h2>{title}</h2>{children}</motion.div>; }
function HomeOverlay({go}:{go:(s:SectionKey)=>void}) { return <div className="home-overlay"><div className="home-kicker"><span aria-hidden="true" />PERSONAL PORTFOLIO</div><h1><span>ADWAITH</span><em>K.</em></h1><button className="enter" onClick={()=>go('ABOUT')}>ENTER THE STORY <ChevronRight size={16}/></button><div className="home-note">SWIPE / SCROLL TO EXPLORE</div></div>; }
function AboutOverlay(){return <Overlay eyebrow="01 / ABOUT WORLD" title="Building with curiosity."><p>{resume.profile}</p><div className="metric-row"><div><strong>03</strong><span>PROJECT WORLDS</span></div><div><strong>01</strong><span>CURRENT INTERNSHIP</span></div><div><strong>NSS</strong><span>LEADERSHIP</span></div></div></Overlay>;}
function SkillsOverlay(){const skills=['Java','Spring Boot','MySQL','Python','Machine Learning','Neural Networks','Full-Stack Web','Accessibility','GitHub','VS Code']; return <Overlay eyebrow="02 / SKILLS CONSTELLATION" title="A system of tools."><p>Technologies and areas represented by the supplied resume and projects.</p><div className="skill-grid">{skills.map((x,i)=><motion.div key={x} whileHover={{scale:1.04, y:-4}} className="skill-pill"><span>0{i+1}</span>{x}</motion.div>)}</div></Overlay>;}
function EducationOverlay(){return <Overlay eyebrow="03 / EDUCATION RIFT" title="The path so far."><div className="education-grid">{resume.education.map((e,i)=><div className="edu" key={i}><span>{e[0]}</span><h3>{e[2]}</h3><p>{e[1]}</p></div>)}</div></Overlay>;}
function ProjectsOverlay(){return <Overlay eyebrow="04 / PROJECT WORLDS" title="Three worlds. Three problems."><div className="project-grid">{resume.projects.map((p,i)=><article className="project-card" key={p.title}><span className="project-no">0{i+1}</span><h3>{p.title}</h3><div className="tags">{p.tags.map(t=><span key={t}>{t}</span>)}</div><p>{p.desc}</p>{p.details && <ul>{p.details.map(d=><li key={d}>{d}</li>)}</ul>}</article>)}</div></Overlay>;}
function ExperienceOverlay(){return <Overlay eyebrow="05 / EXPERIENCE + LEADERSHIP" title="Learning by doing."><div className="experience-grid"><div><span>EXPERIENCE</span><h3>{resume.experience[0][0]}</h3><p>{resume.experience[0][1]}</p></div>{resume.leadership.map((l,i)=><div key={i}><span>LEADERSHIP</span><h3>{l[0]}</h3><small>{l[1]}</small><p>{l[2]}</p></div>)}</div></Overlay>;}
function ContactOverlay(){return <Overlay eyebrow="06 / CONTACT CORE" title="LET’S BUILD SOMETHING."><p>Professional channels from the supplied resume.</p><div className="contact-links"><a href={`mailto:${resume.email}`}><Mail size={16}/> {resume.email}</a><a href={resume.linkedin} target="_blank" rel="noreferrer"><ExternalLink size={16}/> LinkedIn</a><a href={resume.github} target="_blank" rel="noreferrer"><ExternalLink size={16}/> GitHub</a></div></Overlay>;}

const rootElement = document.getElementById('root')!;
const appRoot = createRoot(rootElement);
appRoot.render(<App />);
if (import.meta.hot) import.meta.hot.dispose(() => appRoot.unmount());
