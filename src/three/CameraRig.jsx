import { forwardRef, useImperativeHandle, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { AMBIENT_CAMERA_POSITION } from './starData.js'
import { SPHERE_CENTER_Z } from './GalaxyField.jsx'

const AMBIENT_LOOKAT = new THREE.Vector3(0, 0, 0)
// How far the camera stops from a named star when "zoomed in" — a fixed,
// moderate distance so the star reads as a discrete glowing object held
// dead center in frame (camera.lookAt always centers it, whichever star was
// picked or whichever direction you approached from), rather than the
// camera passing into/through it.
const APPROACH_DISTANCE = 2.2
// Scale/emissive the target star reaches at full zoom — sized to read
// clearly as a glowing sphere at APPROACH_DISTANCE without filling/
// swallowing the frame.
const MAX_ZOOM_SCALE = 3
const MAX_ZOOM_EMISSIVE = 6
const MAX_PAN_SCALE = 2.2
const MAX_PAN_EMISSIVE = 6

// Fixed durations made short hops feel instant and long hops feel rushed,
// since the arbitrary-star pick makes travel distance vary hugely between
// navigations. Duration now scales with actual distance instead, clamped to
// a sane range per animation kind.
const ZOOM_IN_DURATION = { base: 1000, perUnit: 25, min: 1100, max: 2200 }
const ZOOM_OUT_DURATION = { base: 800, perUnit: 20, min: 900, max: 1800 }
const PAN_DURATION = { base: 800, perUnit: 20, min: 900, max: 1700 }
// How long the resting star takes to fade itself back out after arrival —
// it used to just stay lit forever, which looked fine when it filled the
// whole frame but reads as a stray leftover circle now that it settles at a
// fixed, moderate size.
const SETTLE_DURATION = 450

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

  function startAnimation({
    kind,
    toPos,
    toLook,
    duration,
    midpointT = 0.72,
    targetNavId = null,
    colorHex = null,
    fromStarScale = null,
    fromStarEmissive = null,
    onMidpoint,
    onComplete,
  }) {
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
      fromStarScale,
      fromStarEmissive,
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
        // Fade from wherever the resting star's brightness/size actually is
        // right now (it may already be mid-settle, or fully faded, or still
        // fully lit if the user navigated away fast) rather than assuming a
        // fixed starting point — avoids a pop back to full brightness.
        const restingStar = restingNavId.current ? starRefs.current[restingNavId.current] : null
        startAnimation({
          kind: 'zoomOut',
          toPos,
          toLook: AMBIENT_LOOKAT.clone(),
          duration: distanceAwareDuration(distance, ZOOM_OUT_DURATION),
          midpointT: 0.5,
          targetNavId: restingNavId.current,
          fromStarScale: restingStar ? restingStar.scale.x : null,
          fromStarEmissive: restingStar?.material?.emissiveIntensity ?? null,
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

        // Same as zoomOutToAmbient: fade the outgoing star from whatever its
        // actual current brightness/size is, not a fixed assumed starting
        // point, so an already-settled (or mid-settle) star doesn't pop.
        const prevNavId = restingNavId.current
        const prevStar = prevNavId ? starRefs.current[prevNavId] : null

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
          prevNavId,
          fromPrevScale: prevStar ? prevStar.scale.x : null,
          fromPrevEmissive: prevStar?.material?.emissiveIntensity ?? null,
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
            // Reduced motion is instant/animation-free by design — the star
            // stays at its default hidden state instead of popping to full
            // brightness with nothing to fade it back out afterward.
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

    if (a.kind === 'settle') {
      // Camera has already arrived and isn't moving — just fade the resting
      // star's brightness/size back down from wherever it actually was when
      // this started, so it stops sitting in the background indefinitely.
      const star = a.targetNavId ? starRefs.current[a.targetNavId] : null
      if (star?.material) {
        const factor = 1 - eased
        star.material.emissiveIntensity = factor * a.fromStarEmissive
        star.scale.setScalar(factor * a.fromStarScale)
      }
    } else if (a.kind === 'pan') {
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

      // fade the outgoing star's glow down (from its actual current
      // brightness/size, not an assumed fixed one) and the incoming star's
      // glow up
      const prevStar = a.prevNavId ? starRefs.current[a.prevNavId] : null
      const nextStar = starRefs.current[a.targetNavId]
      if (prevStar?.material) {
        const prevScaleBasis = a.fromPrevScale ?? MAX_PAN_SCALE
        const prevEmissiveBasis = a.fromPrevEmissive ?? MAX_PAN_EMISSIVE
        prevStar.material.emissiveIntensity = (1 - eased) * prevEmissiveBasis
        prevStar.scale.setScalar((1 - eased) * prevScaleBasis)
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
          // Growing (zoomIn) always builds toward the fixed max; shrinking
          // (zoomOut) fades from wherever the star's brightness/size
          // actually was, not an assumed fixed starting point.
          const emissiveBasis = growing ? MAX_ZOOM_EMISSIVE : (a.fromStarEmissive ?? MAX_ZOOM_EMISSIVE)
          const scaleBasis = growing ? MAX_ZOOM_SCALE : (a.fromStarScale ?? MAX_ZOOM_SCALE)
          star.material.emissiveIntensity = factor * emissiveBasis
          star.scale.setScalar(factor * scaleBasis)
        }
      }
    }

    if (!a.midpointFired && t >= a.midpointT) {
      a.midpointFired = true
      a.onMidpoint?.(a.colorHex, screenPositionOf(a.targetNavId))
    }
    if (t >= 1) {
      a.onComplete?.()
      // zoomIn/pan hand off into a short settle fade so the resting star
      // doesn't stay lit in the background forever; everything else just ends.
      const star = a.targetNavId ? starRefs.current[a.targetNavId] : null
      if ((a.kind === 'zoomIn' || a.kind === 'pan') && star?.material) {
        anim.current = {
          kind: 'settle',
          startTime: performance.now(),
          duration: SETTLE_DURATION,
          targetNavId: a.targetNavId,
          fromStarScale: star.scale.x,
          fromStarEmissive: star.material.emissiveIntensity,
        }
      } else {
        anim.current = null
      }
    }
  })

  return null
})

export default CameraRig
