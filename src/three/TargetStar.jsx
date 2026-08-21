import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

/**
 * A small emissive sphere marking a navigation target ("Projects", "About").
 * Invisible (scale 0) whenever it isn't the "resting" target — CameraRig
 * repositions/recolors/grows it imperatively right before and during each
 * zoom/pan (picking a fresh star from GalaxyField), and owns its
 * scale/emissive intensity throughout. Because TargetStar mounts before
 * CameraRig in Starfield.jsx, CameraRig's per-frame writes during an active
 * animation run after (and so win over) this component's own "hide me"
 * default each frame — so the two don't fight.
 */
function TargetStar({ position, color, navId, registerRef, restingNavIdRef }) {
  const meshRef = useRef(null)

  useFrame(() => {
    if (!meshRef.current) return
    if (restingNavIdRef?.current !== navId) {
      meshRef.current.scale.setScalar(0)
    }
  })

  return (
    <mesh
      ref={(el) => {
        meshRef.current = el
        registerRef?.(el)
      }}
      position={position}
      scale={0}
      userData={{ navId }}
    >
      <sphereGeometry args={[0.18, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} toneMapped={false} />
    </mesh>
  )
}

export default TargetStar
