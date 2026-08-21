import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * A small emissive sphere marking a navigation target ("Projects", "About").
 * CameraRig repositions/recolors it imperatively right before each zoom/pan
 * (picking a fresh star from GalaxyField), and owns its scale/emissive
 * intensity while it's the "resting" target (tracked via restingNavIdRef).
 * When idle, it bobs gently around wherever it was last left — not the
 * initial `position` prop, since that's just the pre-first-navigation
 * fallback and goes stale the moment CameraRig moves this star.
 */
function TargetStar({ position, color, navId, registerRef, restingNavIdRef }) {
  const meshRef = useRef(null)
  const baseRef = useRef(new THREE.Vector3(...position))
  const wasRestingRef = useRef(false)

  useFrame((state) => {
    if (!meshRef.current) return

    const isResting = restingNavIdRef?.current === navId
    if (isResting) {
      wasRestingRef.current = true
      return // CameraRig owns position/scale/emissive while resting/animating
    }
    if (wasRestingRef.current) {
      // just released — re-anchor the idle bob to wherever it ended up
      baseRef.current.copy(meshRef.current.position)
      wasRestingRef.current = false
    }

    const t = state.clock.elapsedTime
    meshRef.current.position.y = baseRef.current.y + Math.sin(t * 0.6 + baseRef.current.x) * 0.08
    const pulse = 0.9 + Math.sin(t * 1.3 + baseRef.current.x) * 0.15
    meshRef.current.scale.setScalar(pulse)
  })

  return (
    <mesh
      ref={(el) => {
        meshRef.current = el
        registerRef?.(el)
      }}
      position={position}
      userData={{ navId }}
    >
      <sphereGeometry args={[0.18, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} toneMapped={false} />
    </mesh>
  )
}

export default TargetStar
