import { useMemo, useRef, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const STAR_COUNT = 4200
const GALAXY_RADIUS = 68
const ARM_COUNT = 3
const ARM_TWIST = 2.4 // spiral tightness
const DISK_TILT_X = THREE.MathUtils.degToRad(26)
const DISK_THICKNESS = 15
const Z_OFFSET = -18 // push the bulk of the field out in front of the camera
const ROTATE_SPEED = 0.02 // rad/sec — slow, continuous "living galaxy" drift
const BASE_POINT_SIZE = 4.5

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

// gl_PointSize varies per-star (aSize) and pulses over time (aPhase/aSpeed) —
// real size variety plus flicker, neither of which stock PointsMaterial can
// do (it only takes one uniform size for every point).
const VERTEX_SHADER = /* glsl */ `
  attribute vec3 color;
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;

  uniform float uTime;
  uniform float uPixelRatio;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = color;
    float flicker = 0.5 + 0.5 * sin(uTime * aSpeed + aPhase);
    vAlpha = clamp(0.25 + flicker * 0.75, 0.0, 1.0);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float sizeFlicker = 0.65 + 0.55 * sin(uTime * aSpeed * 1.6 + aPhase * 2.1);
    float attenuated = aSize * sizeFlicker * uPixelRatio * (50.0 / -mvPosition.z);
    gl_PointSize = min(attenuated, 30.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uMap;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    float a = tex.a * vAlpha;
    if (a < 0.02) discard;
    gl_FragColor = vec4(vColor, a);
  }
`

function buildStarData() {
  const positions = new Float32Array(STAR_COUNT * 3)
  const baseColors = new Float32Array(STAR_COUNT * 3)
  const sizes = new Float32Array(STAR_COUNT)
  const phases = new Float32Array(STAR_COUNT)
  const speeds = new Float32Array(STAR_COUNT)
  const cosT = Math.cos(DISK_TILT_X)
  const sinT = Math.sin(DISK_TILT_X)
  const color = new THREE.Color()

  for (let i = 0; i < STAR_COUNT; i++) {
    const armOffset = ((i % ARM_COUNT) / ARM_COUNT) * Math.PI * 2
    const rand = Math.random()
    // flatter exponent than a tight core-biased distribution — spreads
    // stars across the whole disk instead of collapsing them toward center
    const r = Math.pow(rand, 0.8) * GALAXY_RADIUS
    const jitterR = r + (Math.random() - 0.5) * GALAXY_RADIUS * 0.2
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

    // wide multiplicative spread so small and large stars are both common
    sizes[i] = BASE_POINT_SIZE * (0.4 + Math.random() * 1.3) * (1 + coreBoost * 0.5)

    phases[i] = Math.random() * Math.PI * 2
    speeds[i] = 0.5 + Math.random() * 1.2
  }

  return { positions, baseColors, sizes, phases, speeds }
}

/**
 * The ambient "living galaxy" background: a tilted, spiral-biased field of
 * glowing, multi-colored, variably-sized points that slowly rotates and
 * flickers (both size and brightness, driven per-frame by a single uTime
 * uniform — cheap, GPU-side). Also exposes getRandomStar() so navigation can
 * zoom into an arbitrary star actually pulled from this field, rather than a
 * fixed pre-placed marker.
 */
const GalaxyField = forwardRef(function GalaxyField(_props, ref) {
  const groupRef = useRef(null)
  const data = useMemo(() => buildStarData(), [])
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2) },
      uMap: { value: getGlowTexture() },
    }),
    [],
  )

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
    uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[data.baseColors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[data.sizes, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[data.phases, 1]} />
          <bufferAttribute attach="attributes-aSpeed" args={[data.speeds, 1]} />
        </bufferGeometry>
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={VERTEX_SHADER}
          fragmentShader={FRAGMENT_SHADER}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
})

export default GalaxyField
