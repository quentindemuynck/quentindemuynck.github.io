import { forwardRef, useImperativeHandle, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { AMBIENT_CAMERA_POSITION } from './starData.js'
import { SPHERE_CENTER_Z } from './GalaxyField.jsx'

const AMBIENT_LOOKAT = new THREE.Vector3(0, 0, 0)
// How close the camera ends up to a named star when "zoomed in" — small
// enough that the star fills most of the frame (the bloom-hides-the-seam
// trick), without actually clipping through it.
const APPROACH_DISTANCE = 0.08
// Max scale/emissive the target star reaches at full zoom — big enough that
// its sphere genuinely fills the viewport at APPROACH_DISTANCE, rather than
// just appearing as a bright circle with visible background around it.
const MAX_ZOOM_SCALE = 10
const MAX_ZOOM_EMISSIVE = 9
const MAX_PAN_SCALE = 7
const MAX_PAN_EMISSIVE = 9

// Fixed durations made short hops feel instant and long hops feel rushed,
// since the arbitrary-star pick makes travel distance vary hugely between
// navigations. Duration now scales with actual distance instead, clamped to
// a sane range per animation kind.
const ZOOM_IN_DURATION = { base: 1000, perUnit: 25, min: 1100, max: 2200 }
const ZOOM_OUT_DURATION = { base: 800, perUnit: 20, min: 900, max: 1800 }
const PAN_DURATION = { base: 800, perUnit: 20, min: 900, max: 1700 }

function distanceAwareDuration(distance, { base, perUnit, min, max }) {
  return Math.min(Math.max(base + distance * perUnit, min), max)
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * Imperative camera controller for the starfield. Lives inside the R3F
 * Canvas (so it can use useFrame/useThree) but is driven from outside via
 * a forwarded ref, since navigation is decided by the DOM/router layer.
 */
const CameraRig = forwardRef(function CameraRig({ starRefs, restingNavIdRef, galaxyFieldRef }, ref) {
  const { camera } = useThree()
  const anim = useRef(null)
  const currentLook = useRef(AMBIENT_LOOKAT.clone())
  const restingNavId = restingNavIdRef

  // Pulls a genuinely arbitrary star out of the live galaxy field and
  // re-homes the given destination's target mesh to it (position + color),
  // so every navigation zooms into a different, differently-colored star
  // instead of a fixed pre-placed marker. Returns the picked color's hex
  // string so callers can pass it along to the arrival-flash overlay.
  function repickTargetStar(navId) {
    const star = starRefs.current[navId]
    const picked = galaxyFieldRef?.current?.getRandomStar()
    if (!star || !picked) return null
    star.position.copy(picked.position)
    if (star.material) {
      star.material.color.copy(picked.color)
      star.material.emissive.copy(picked.color)
    }
    return '#' + picked.color.getHexString()
  }

  function startAnimation({ kind, toPos, toLook, duration, midpointT = 0.72, targetNavId = null, colorHex = null, onMidpoint, onComplete }) {
    anim.current = {
      kind,
      startTime: performance.now(),
      duration,
      midpointT,
      midpointFired: false,
      fromPos: camera.position.clone(),
      fromLook: currentLook.current.clone(),
      toPos: toPos.clone(),
      toLook: toLook.clone(),
      targetNavId,
      colorHex,
      onMidpoint,
      onComplete,
    }
  }

  function approachPositionFor(starPos) {
    const dir = starPos.clone().sub(camera.position)
    if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1)
    dir.normalize()
    return starPos.clone().sub(dir.multiplyScalar(APPROACH_DISTANCE))
  }

  // Projects a target star's current world position to viewport percentages
  // (0-100, CSS-style with y growing downward), so the arrival-flash overlay
  // can originate from wherever the star actually is on screen at the
  // midpoint — not always dead center, which looks wrong for a lateral pan
  // where the star can still be well off to one side at that point.
  function screenPositionOf(navId) {
    const star = navId ? starRefs.current[navId] : null
    if (!star) return { x: 50, y: 50 }
    camera.updateMatrixWorld()
    const ndc = star.position.clone().project(camera)
    return {
      x: THREE.MathUtils.clamp((ndc.x * 0.5 + 0.5) * 100, 0, 100),
      y: THREE.MathUtils.clamp((1 - (ndc.y * 0.5 + 0.5)) * 100, 0, 100),
    }
  }

  useImperativeHandle(
    ref,
    () => ({
      zoomToStar(navId, { onMidpoint, onComplete } = {}) {
        const colorHex = repickTargetStar(navId)
        const star = starRefs.current[navId]
        if (!star) return
        const starPos = star.position.clone()
        const toPos = approachPositionFor(starPos)
        const distance = camera.position.distanceTo(toPos)
        startAnimation({
          kind: 'zoomIn',
          toPos,
          toLook: starPos,
          duration: distanceAwareDuration(distance, ZOOM_IN_DURATION),
          midpointT: 0.8,
          targetNavId: navId,
          colorHex,
          onMidpoint,
          onComplete: () => {
            restingNavId.current = navId
            onComplete?.()
          },
        })
      },

      zoomOutToAmbient({ onMidpoint, onComplete } = {}) {
        const toPos = new THREE.Vector3(...AMBIENT_CAMERA_POSITION)
        const distance = camera.position.distanceTo(toPos)
        startAnimation({
          kind: 'zoomOut',
          toPos,
          toLook: AMBIENT_LOOKAT.clone(),
          duration: distanceAwareDuration(distance, ZOOM_OUT_DURATION),
          midpointT: 0.5,
          targetNavId: restingNavId.current,
          onMidpoint,
          onComplete: () => {
            restingNavId.current = null
            onComplete?.()
          },
        })
      },

      panTo(navId, { onMidpoint, onComplete } = {}) {
        const colorHex = repickTargetStar(navId)
        const star = starRefs.current[navId]
        if (!star) return
        const starPos = star.position.clone()
        const fromPos = camera.position.clone()
        const toPos = approachPositionFor(starPos)
        const distance = fromPos.distanceTo(toPos)

        // Pull-back point for the arc, derived from the actual endpoints
        // rather than a fixed world-space point — otherwise the dip looks
        // arbitrary depending on which two stars happened to get picked.
        // Pull the midpoint away from the galaxy center, scaled with the
        // hop's own distance (with a floor so short pans still get an arc).
        const midPos = fromPos.clone().lerp(toPos, 0.5)
        const outwardDir = midPos.clone().sub(new THREE.Vector3(0, 0, SPHERE_CENTER_Z))
        if (outwardDir.lengthSq() < 1e-6) outwardDir.set(0, -1, 1)
        outwardDir.normalize()
        const dipPos = midPos.clone().add(outwardDir.multiplyScalar(Math.max(distance * 0.35, 3)))

        anim.current = {
          kind: 'pan',
          startTime: performance.now(),
          duration: distanceAwareDuration(distance, PAN_DURATION),
          midpointT: 0.8,
          midpointFired: false,
          fromPos,
          fromLook: currentLook.current.clone(),
          dipPos,
          toPos,
          toLook: starPos,
          targetNavId: navId,
          colorHex,
          prevNavId: restingNavId.current,
          onMidpoint,
          onComplete: () => {
            restingNavId.current = navId
            onComplete?.()
          },
        }
      },

      snapTo(navId, { onComplete } = {}) {
        anim.current = null
        if (!navId || navId === 'home') {
          camera.position.set(...AMBIENT_CAMERA_POSITION)
          camera.lookAt(AMBIENT_LOOKAT)
          currentLook.current.copy(AMBIENT_LOOKAT)
          restingNavId.current = null
        } else {
          repickTargetStar(navId)
          const star = starRefs.current[navId]
          if (star) {
            const starPos = star.position.clone()
            const toPos = approachPositionFor(starPos)
            camera.position.copy(toPos)
            camera.lookAt(starPos)
            currentLook.current.copy(starPos)
            // no animation to grow it here, so show it at full size directly
            star.scale.setScalar(MAX_ZOOM_SCALE)
            if (star.material) star.material.emissiveIntensity = MAX_ZOOM_EMISSIVE
            restingNavId.current = navId
          }
        }
        onComplete?.()
      },

      getRestingNavId() {
        return restingNavId.current
      },
    }),
    [camera, starRefs, galaxyFieldRef],
  )

  useFrame(() => {
    const a = anim.current
    if (!a) return
    const elapsed = performance.now() - a.startTime
    const t = Math.min(elapsed / a.duration, 1)
    const eased = easeInOutCubic(t)

    if (a.kind === 'pan') {
      // quadratic bezier through the dip point for a lateral pan with a
      // brief pull-back, rather than a straight lerp between the two stars
      const p0 = a.fromPos
      const p1 = a.dipPos
      const p2 = a.toPos
      const u = 1 - eased
      camera.position.set(
        u * u * p0.x + 2 * u * eased * p1.x + eased * eased * p2.x,
        u * u * p0.y + 2 * u * eased * p1.y + eased * eased * p2.y,
        u * u * p0.z + 2 * u * eased * p1.z + eased * eased * p2.z,
      )
      const lookPoint = new THREE.Vector3().lerpVectors(a.fromLook, a.toLook, eased)
      camera.lookAt(lookPoint)
      currentLook.current.copy(lookPoint)

      // fade the outgoing star's glow down and the incoming star's glow up
      const prevStar = a.prevNavId ? starRefs.current[a.prevNavId] : null
      const nextStar = starRefs.current[a.targetNavId]
      if (prevStar?.material) {
        prevStar.material.emissiveIntensity = (1 - eased) * MAX_PAN_EMISSIVE
        prevStar.scale.setScalar((1 - eased) * MAX_PAN_SCALE)
      }
      if (nextStar?.material) {
        nextStar.material.emissiveIntensity = eased * MAX_PAN_EMISSIVE
        nextStar.scale.setScalar(eased * MAX_PAN_SCALE)
      }
    } else {
      camera.position.lerpVectors(a.fromPos, a.toPos, eased)
      const lookPoint = new THREE.Vector3().lerpVectors(a.fromLook, a.toLook, eased)
      camera.lookAt(lookPoint)
      currentLook.current.copy(lookPoint)

      if (a.targetNavId) {
        const star = starRefs.current[a.targetNavId]
        if (star?.material) {
          const growing = a.kind === 'zoomIn'
          const factor = growing ? eased : 1 - eased
          star.material.emissiveIntensity = factor * MAX_ZOOM_EMISSIVE
          star.scale.setScalar(factor * MAX_ZOOM_SCALE)
        }
      }
    }

    if (!a.midpointFired && t >= a.midpointT) {
      a.midpointFired = true
      a.onMidpoint?.(a.colorHex, screenPositionOf(a.targetNavId))
    }
    if (t >= 1) {
      a.onComplete?.()
      anim.current = null
    }
  })

  return null
})

export default CameraRig
