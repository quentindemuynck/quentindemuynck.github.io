import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars, PerspectiveCamera } from '@react-three/drei'
import { NAMED_STARS, AMBIENT_CAMERA_POSITION } from './starData.js'
import NamedStar from './NamedStar.jsx'
import CameraRig from './CameraRig.jsx'

/**
 * Persistent, full-viewport 3D starfield mounted once at the app shell level
 * so its camera state survives route changes — CameraRig drives zoom/pan
 * transitions between views, coordinated from outside via cameraRigRef.
 */
function Starfield({ cameraRigRef }) {
  const starRefs = useRef({})
  const restingNavIdRef = useRef(null)

  return (
    <div className="starfield-canvas" aria-hidden="true">
      <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <PerspectiveCamera makeDefault position={AMBIENT_CAMERA_POSITION} fov={60} />
        <ambientLight intensity={0.7} />
        <Stars radius={90} depth={60} count={2500} factor={3} saturation={0} fade speed={0.5} />
        {Object.entries(NAMED_STARS).map(([navId, star]) => (
          <NamedStar
            key={navId}
            navId={navId}
            position={star.position}
            color={star.color}
            restingNavIdRef={restingNavIdRef}
            registerRef={(mesh) => {
              starRefs.current[navId] = mesh
            }}
          />
        ))}
        <CameraRig ref={cameraRigRef} starRefs={starRefs} restingNavIdRef={restingNavIdRef} />
      </Canvas>
    </div>
  )
}

export default Starfield
