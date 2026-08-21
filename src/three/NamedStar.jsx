import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

/**
 * A small emissive sphere marking a navigation target ("Projects", "About").
 * Idles with a gentle bob/pulse; CameraRig takes over its scale/emissive
 * intensity during zoom/pan animations and while it's the "resting" target
 * (tracked via restingNavIdRef so this component knows to back off).
 */
function NamedStar({ position, color, navId, registerRef, restingNavIdRef }) {
  const meshRef = useRef(null)

  useFrame((state) => {
    if (!meshRef.current) return
    if (restingNavIdRef?.current === navId) return // CameraRig owns it while resting/zoomed

    const t = state.clock.elapsedTime
    meshRef.current.position.y = position[1] + Math.sin(t * 0.6 + position[0]) * 0.08
    const pulse = 0.9 + Math.sin(t * 1.3 + position[0]) * 0.15
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

export default NamedStar
