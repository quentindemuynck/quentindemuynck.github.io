import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const STAR_COUNT = 2600
const GALAXY_RADIUS = 55
const ARM_COUNT = 3
const ARM_TWIST = 2.4 // spiral tightness
const DISK_TILT_X = THREE.MathUtils.degToRad(26)
const DISK_THICKNESS = 9
const Z_OFFSET = -18 // push the bulk of the field out in front of the camera
const ROTATE_SPEED = 0.02 // rad/sec — slow, continuous "living galaxy" drift

// Mostly the site's blues/violets, with cyan/white/pink sprinkled in for
// real "different colors of glowing" variety without losing the theme.
const PALETTE = [
  '#4da3ff',
  '#7dc0ff',
  '#7b6cff',
  '#a78bfa',
  '#5ee6e6',
  '#eaf2ff',
  '#ff8ad1',
]
const PALETTE_WEIGHTS = [0.26, 0.18, 0.16, 0.12, 0.12, 0.1, 0.06]

function pickPaletteColor() {
  const r = Math.random()
  let acc = 0
  for (let i = 0; i < PALETTE.length; i++) {
    acc += PALETTE_WEIGHTS[i]
    if (r <= acc) return PALETTE[i]
  }
  return PALETTE[0]
}

let glowTexture = null
function getGlowTexture() {
  if (glowTexture) return glowTexture
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.55)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  glowTexture = new THREE.CanvasTexture(canvas)
  return glowTexture
}

function buildStarData() {
  const positions = new Float32Array(STAR_COUNT * 3)
  const baseColors = new Float32Array(STAR_COUNT * 3)
  const phases = new Float32Array(STAR_COUNT)
  const speeds = new Float32Array(STAR_COUNT)
  const cosT = Math.cos(DISK_TILT_X)
  const sinT = Math.sin(DISK_TILT_X)
  const color = new THREE.Color()

  for (let i = 0; i < STAR_COUNT; i++) {
    const armOffset = ((i % ARM_COUNT) / ARM_COUNT) * Math.PI * 2
    const rand = Math.random()
    const r = Math.pow(rand, 1.6) * GALAXY_RADIUS
    const jitterR = r + (Math.random() - 0.5) * GALAXY_RADIUS * 0.12
    const theta = armOffset + r * (ARM_TWIST / GALAXY_RADIUS) + (Math.random() - 0.5) * 0.7
    const x = jitterR * Math.cos(theta)
    const zLocal = jitterR * Math.sin(theta)
    const y = (Math.random() - 0.5) * DISK_THICKNESS * (1 - (r / GALAXY_RADIUS) * 0.6)

    // tilt the disk around X so it reads as a 3D galaxy, not a flat poster
    const y2 = y * cosT - zLocal * sinT
    const z2 = y * sinT + zLocal * cosT + Z_OFFSET

    positions[i * 3] = x
    positions[i * 3 + 1] = y2
    positions[i * 3 + 2] = z2

    // brighter stars near the core for a glowing center, on top of the
    // palette color (still clamped so it doesn't blow out to pure white)
    const coreBoost = 1 - Math.min(r / GALAXY_RADIUS, 1)
    const brightness = 0.85 + coreBoost * 0.9
    color.set(pickPaletteColor())
    baseColors[i * 3] = Math.min(color.r * brightness, 1)
    baseColors[i * 3 + 1] = Math.min(color.g * brightness, 1)
    baseColors[i * 3 + 2] = Math.min(color.b * brightness, 1)

    phases[i] = Math.random() * Math.PI * 2
    speeds[i] = 0.5 + Math.random() * 1.2
  }

  return { positions, baseColors, phases, speeds }
}

/**
 * The ambient "living galaxy" background: a tilted, spiral-biased field of
 * glowing, multi-colored points that slowly rotates. Also exposes
 * getRandomStar() so navigation can zoom into an arbitrary star actually
 * pulled from this field, rather than a fixed pre-placed marker.
 */
const GalaxyField = forwardRef(function GalaxyField(_props, ref) {
  const groupRef = useRef(null)
  const pointsRef = useRef(null)
  const data = useMemo(() => buildStarData(), [])
  const liveColors = useMemo(() => data.baseColors.slice(), [data])

  useImperativeHandle(
    ref,
    () => ({
      getRandomStar() {
        const i = Math.floor(Math.random() * STAR_COUNT)
        const local = new THREE.Vector3(
          data.positions[i * 3],
          data.positions[i * 3 + 1],
          data.positions[i * 3 + 2],
        )
        groupRef.current?.updateMatrixWorld()
        const world = groupRef.current ? local.applyMatrix4(groupRef.current.matrixWorld) : local
        const color = new THREE.Color(
          data.baseColors[i * 3],
          data.baseColors[i * 3 + 1],
          data.baseColors[i * 3 + 2],
        )
        return { position: world, color }
      },
    }),
    [data],
  )

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * ROTATE_SPEED
    }
    const colorAttr = pointsRef.current?.geometry.attributes.color
    if (!colorAttr) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < STAR_COUNT; i++) {
      const twinkle = 0.55 + 0.45 * Math.sin(t * data.speeds[i] + data.phases[i])
      liveColors[i * 3] = data.baseColors[i * 3] * twinkle
      liveColors[i * 3 + 1] = data.baseColors[i * 3 + 1] * twinkle
      liveColors[i * 3 + 2] = data.baseColors[i * 3 + 2] * twinkle
    }
    colorAttr.array.set(liveColors)
    colorAttr.needsUpdate = true
  })

  return (
    <group ref={groupRef}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[liveColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.5}
          vertexColors
          map={getGlowTexture()}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  )
})

export default GalaxyField
