'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COUNT = 90
const CONNECT_DIST = 2.8
const MAX_LINES = 50
const BOUNDS_X = 14
const BOUNDS_Y = 6

/* ─── Drifting nodes + connection lines ─── */
function CampusNetwork() {
  const pointsRef = useRef<THREE.Points>(null)
  const linesRef  = useRef<THREE.LineSegments>(null)

  // Build initial particle positions + velocities
  const { positions, velocities } = useMemo(() => {
    const positions  = new Float32Array(COUNT * 3)
    const velocities = new Float32Array(COUNT * 3)

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * BOUNDS_X * 2
      positions[i * 3 + 1] = (Math.random() - 0.5) * BOUNDS_Y * 2
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2

      velocities[i * 3]     = (Math.random() - 0.5) * 0.005
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.004
      velocities[i * 3 + 2] = 0
    }
    return { positions, velocities }
  }, [])

  // Reserve a fixed buffer for connection lines
  const linePositions = useMemo(() => new Float32Array(MAX_LINES * 6), [])

  useFrame(() => {
    const pts = pointsRef.current
    const lns = linesRef.current
    if (!pts || !lns) return

    const pos = pts.geometry.attributes.position.array as Float32Array

    // Drift particles + soft boundary bounce
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3]     += velocities[i * 3]
      pos[i * 3 + 1] += velocities[i * 3 + 1]

      if (Math.abs(pos[i * 3])     > BOUNDS_X) velocities[i * 3]     *= -1
      if (Math.abs(pos[i * 3 + 1]) > BOUNDS_Y) velocities[i * 3 + 1] *= -1
    }
    pts.geometry.attributes.position.needsUpdate = true

    // Build connection lines between near pairs
    const lp = lns.geometry.attributes.position.array as Float32Array
    let li = 0

    outer: for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        if (li >= MAX_LINES) break outer
        const dx = pos[i * 3]     - pos[j * 3]
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1]
        if (dx * dx + dy * dy < CONNECT_DIST * CONNECT_DIST) {
          lp[li * 6]     = pos[i * 3];     lp[li * 6 + 1] = pos[i * 3 + 1]; lp[li * 6 + 2] = pos[i * 3 + 2]
          lp[li * 6 + 3] = pos[j * 3];     lp[li * 6 + 4] = pos[j * 3 + 1]; lp[li * 6 + 5] = pos[j * 3 + 2]
          li++
        }
      }
    }
    // Collapse unused slots to origin so they're invisible
    for (let k = li * 6; k < MAX_LINES * 6; k++) lp[k] = 0
    lns.geometry.attributes.position.needsUpdate = true
  })

  return (
    <>
      {/* Drifting nodes */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.055}
          color="#00E5FF"
          transparent
          opacity={0.65}
          sizeAttenuation
        />
      </points>

      {/* Connection lines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#00E5FF" transparent opacity={0.13} />
      </lineSegments>
    </>
  )
}

/* ─── A few bright "hotspot" nodes in purple (issue pins) ─── */
function HotspotNodes() {
  const ref = useRef<THREE.Points>(null)

  const positions = useMemo(() => {
    const spots = [
      [-6, 2, 0], [3, -1.5, 0], [8, 3, 0],
      [-2, -3, 0], [5, -3.5, 0], [-9, -1, 0],
    ]
    const arr = new Float32Array(spots.length * 3)
    spots.forEach(([x, y, z], i) => {
      arr[i * 3] = x; arr[i * 3 + 1] = y; arr[i * 3 + 2] = z
    })
    return arr
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    // Gentle pulse via opacity — achieved by scaling point size
    const t = state.clock.elapsedTime
    ;(ref.current.material as THREE.PointsMaterial).size =
      0.12 + Math.sin(t * 1.8) * 0.04
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.14}
        color="#8B5CF6"
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  )
}

/* ─── Exported wrapper — fills the hero section absolutely ─── */
export default function HeroBg3D() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 11], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        <CampusNetwork />
        <HotspotNodes />
      </Canvas>
    </div>
  )
}
