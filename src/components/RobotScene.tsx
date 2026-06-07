'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, RoundedBox, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

/* ─────────────────────────────────────
   PREMIUM ROBOT
   Rounded edges, PBR materials, proper
   lighting — Spline-quality look
   ───────────────────────────────────── */

function Robot({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const headRef = useRef<THREE.Group>(null)

  // Fixed Y-axis: mouse up → head looks UP (positive X rotation)
  useFrame(() => {
    if (!headRef.current) return
    const targetY =  mouse.current.x * 0.5
    const targetX =  mouse.current.y * 0.35  // FIXED: removed negative
    headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetY, 0.06)
    headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetX, 0.06)
  })

  /* Shared materials for performance + consistency */
  const darkMetal = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0d0d18',
    metalness: 1.0,
    roughness: 0.08,
    envMapIntensity: 1.8,
  }), [])

  const purpleFace = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#6D28D9',
    metalness: 0.55,
    roughness: 0.22,
    envMapIntensity: 2.0,
  }), [])

  const darkSide = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#111122',
    metalness: 0.95,
    roughness: 0.12,
    envMapIntensity: 1.4,
  }), [])

  return (
    <Float speed={1.2} floatIntensity={0.35} rotationIntensity={0.05}>
      <group position={[0, -0.6, 0]}>

        {/* ══════════════ BASE CUBE ══════════════ */}
        <RoundedBox
          args={[1.55, 1.55, 1.55]}
          radius={0.06}
          smoothness={4}
          position={[0, -0.85, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#0e0e1c"
            metalness={1.0}
            roughness={0.06}
            envMapIntensity={2.2}
          />
        </RoundedBox>

        {/* Base — top edge beveled glow strip */}
        <mesh position={[0, -0.06, 0]}>
          <boxGeometry args={[1.57, 0.018, 1.57]} />
          <meshStandardMaterial color="#7C3AED" emissive="#7C3AED" emissiveIntensity={4} toneMapped={false} />
        </mesh>

        {/* Base front subtle accent */}
        <mesh position={[0, -0.55, 0.785]}>
          <boxGeometry args={[0.5, 0.012, 0.008]} />
          <meshStandardMaterial color="#00E5FF" emissive="#00E5FF" emissiveIntensity={3} toneMapped={false} />
        </mesh>

        {/* ══════════════ NECK ══════════════ */}
        {/* Tapered cylinder stem */}
        <mesh position={[0, 0.15, 0]} castShadow material={darkMetal}>
          <cylinderGeometry args={[0.08, 0.13, 0.55, 32]} />
        </mesh>

        {/* Neck ball joint — polished sphere */}
        <mesh position={[0, 0.44, 0]} castShadow>
          <sphereGeometry args={[0.17, 32, 32]} />
          <meshStandardMaterial
            color="#141425"
            metalness={1.0}
            roughness={0.04}
            envMapIntensity={2.5}
          />
        </mesh>

        {/* Neck collar ring */}
        <mesh position={[0, 0.31, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.12, 0.022, 16, 40]} />
          <meshStandardMaterial color="#1a1a2e" metalness={1} roughness={0.05} envMapIntensity={2} />
        </mesh>

        {/* ══════════════ HEAD (tracks mouse) ══════════════ */}
        <group ref={headRef} position={[0, 0.98, 0]}>

          {/* ── Head: Purple front face ── */}
          <RoundedBox
            args={[1.8, 0.92, 0.72]}
            radius={0.1}
            smoothness={6}
            castShadow
          >
            {/* Multi-material: front=purple, sides=dark */}
            <meshStandardMaterial
              color="#6D28D9"
              metalness={0.5}
              roughness={0.2}
              envMapIntensity={2.2}
            />
          </RoundedBox>

          {/* Head back panel — darker for contrast */}
          <RoundedBox
            args={[1.76, 0.88, 0.05]}
            radius={0.04}
            smoothness={3}
            position={[0, 0, -0.35]}
          >
            <meshStandardMaterial color="#0e0e1a" metalness={0.98} roughness={0.06} envMapIntensity={1.6} />
          </RoundedBox>

          {/* Head right side panel */}
          <RoundedBox
            args={[0.05, 0.84, 0.64]}
            radius={0.02}
            smoothness={3}
            position={[0.895, 0, 0]}
          >
            <meshStandardMaterial color="#111122" metalness={0.98} roughness={0.08} envMapIntensity={1.6} />
          </RoundedBox>

          {/* Head top edge glow */}
          <mesh position={[0, 0.475, 0]}>
            <boxGeometry args={[1.82, 0.015, 0.74]} />
            <meshStandardMaterial color="#7C3AED" emissive="#9333EA" emissiveIntensity={3.5} toneMapped={false} />
          </mesh>

          {/* Head bottom edge subtle glow */}
          <mesh position={[0, -0.475, 0]}>
            <boxGeometry args={[1.82, 0.01, 0.74]} />
            <meshStandardMaterial color="#4C1D95" emissive="#6D28D9" emissiveIntensity={1.5} toneMapped={false} />
          </mesh>

          {/* ── LEFT EYE ── */}
          {/* Eye socket recess */}
          <mesh position={[-0.42, 0.06, 0.33]}>
            <sphereGeometry args={[0.18, 32, 32]} />
            <meshStandardMaterial color="#1a1030" metalness={0.8} roughness={0.1} />
          </mesh>
          {/* Eyeball */}
          <mesh position={[-0.42, 0.06, 0.40]} castShadow>
            <sphereGeometry args={[0.14, 40, 40]} />
            <meshStandardMaterial
              color="#e8e8f2"
              roughness={0.02}
              metalness={0.02}
              envMapIntensity={1.5}
            />
          </mesh>
          {/* Pupil */}
          <mesh position={[-0.42, 0.06, 0.545]}>
            <sphereGeometry args={[0.055, 24, 24]} />
            <meshStandardMaterial color="#060608" roughness={0.05} metalness={0.3} />
          </mesh>
          {/* Highlight — top left */}
          <mesh position={[-0.39, 0.11, 0.546]}>
            <sphereGeometry args={[0.026, 16, 16]} />
            <meshStandardMaterial color="white" emissive="white" emissiveIntensity={8} toneMapped={false} />
          </mesh>
          {/* Secondary highlight — smaller */}
          <mesh position={[-0.45, 0.02, 0.546]}>
            <sphereGeometry args={[0.013, 12, 12]} />
            <meshStandardMaterial color="white" emissive="white" emissiveIntensity={4} toneMapped={false} />
          </mesh>

          {/* ── RIGHT EYE ── */}
          <mesh position={[0.42, 0.06, 0.33]}>
            <sphereGeometry args={[0.18, 32, 32]} />
            <meshStandardMaterial color="#1a1030" metalness={0.8} roughness={0.1} />
          </mesh>
          <mesh position={[0.42, 0.06, 0.40]} castShadow>
            <sphereGeometry args={[0.14, 40, 40]} />
            <meshStandardMaterial color="#e8e8f2" roughness={0.02} metalness={0.02} envMapIntensity={1.5} />
          </mesh>
          <mesh position={[0.42, 0.06, 0.545]}>
            <sphereGeometry args={[0.055, 24, 24]} />
            <meshStandardMaterial color="#060608" roughness={0.05} metalness={0.3} />
          </mesh>
          <mesh position={[0.45, 0.11, 0.546]}>
            <sphereGeometry args={[0.026, 16, 16]} />
            <meshStandardMaterial color="white" emissive="white" emissiveIntensity={8} toneMapped={false} />
          </mesh>
          <mesh position={[0.39, 0.02, 0.546]}>
            <sphereGeometry args={[0.013, 12, 12]} />
            <meshStandardMaterial color="white" emissive="white" emissiveIntensity={4} toneMapped={false} />
          </mesh>

          {/* ── RIGHT SIDE BUTTON ── */}
          <mesh position={[0.925, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.065, 0.065, 0.08, 28]} />
            <meshStandardMaterial color="#0a0a16" metalness={1} roughness={0.04} envMapIntensity={2} />
          </mesh>
          {/* Button ring glow */}
          <mesh position={[0.94, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.06, 0.006, 12, 40]} />
            <meshStandardMaterial color="#F43F5E" emissive="#F43F5E" emissiveIntensity={3} toneMapped={false} />
          </mesh>

          {/* ── Red accent bar on right side ── */}
          <mesh position={[0.915, -0.2, 0.15]}>
            <boxGeometry args={[0.015, 0.15, 0.008]} />
            <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={3} toneMapped={false} />
          </mesh>

        </group>
        {/* ── END HEAD ── */}

      </group>
    </Float>
  )
}

/* ─────────────────────────────────────
   SCENE — Environment + Lighting
   ───────────────────────────────────── */
function Scene({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  return (
    <>
      {/* Environment map for realistic reflections */}
      <Environment preset="night" />

      {/* Key light — warm white from top-right */}
      <spotLight
        position={[4, 8, 6]}
        intensity={60}
        color="#ffffff"
        angle={0.35}
        penumbra={0.6}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
      />

      {/* Fill — purple from left */}
      <pointLight position={[-5, 3, 3]} intensity={8} color="#8B5CF6" />

      {/* Pink/magenta rim — floor area */}
      <pointLight position={[0, -4, 5]} intensity={6} color="#EC4899" />

      {/* Cool cyan from behind */}
      <pointLight position={[2, 2, -5]} intensity={4} color="#00E5FF" />

      {/* Ambient — very dim so shadows have depth */}
      <ambientLight intensity={0.06} />

      <Robot mouse={mouse} />

      {/* Contact shadow on the "floor" */}
      <ContactShadows
        position={[0, -2.4, 0]}
        opacity={0.6}
        scale={8}
        blur={2.2}
        far={6}
        color="#4C1D95"
      />
    </>
  )
}

/* ─────────────────────────────────────
   EXPORTED WRAPPER
   ───────────────────────────────────── */
export default function RobotScene() {
  const mouse = useRef({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth)  * 2 - 1
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  if (!mounted) return null

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 420 }}>
      <Canvas
        camera={{ position: [0, 0.5, 5.2], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        style={{ background: 'transparent' }}
        shadows
      >
        <Scene mouse={mouse} />
      </Canvas>
    </div>
  )
}
