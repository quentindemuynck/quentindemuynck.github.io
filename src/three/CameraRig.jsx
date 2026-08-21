import { forwardRef, useImperativeHandle, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { AMBIENT_CAMERA_POSITION } from './starData.js'

const AMBIENT_LOOKAT = new THREE.Vector3(0, 0, 0)
// How close the camera ends up to a named star when "zoomed in" — small
// enough that the star fills most of the frame (the bloom-hides-the-seam
// trick), without actually clipping through it.
const APPROACH_DISTANCE = 0.4

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * Imperative camera controller for the starfield. Lives inside the R3F
 * Canvas (so it can use useFrame/useThree) but is driven from outside via
 * a forwarded ref, since navigation is decided by the DOM/router layer.
 */
const CameraRig = forwardRef(function CameraRig({ starRefs, restingNavIdRef }, ref) {
  const { camera } = useThree()
  const anim = useRef(null)
  const currentLook = useRef(AMBIENT_LOOKAT.clone())
  const restingNavId = restingNavIdRef

  function startAnimation({ kind, toPos, toLook, duration, midpointT = 0.72, targetNavId = null, onMidpoint, onComplete }) {
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

  useImperativeHandle(
    ref,
    () => ({
      zoomToStar(navId, { onMidpoint, onComplete } = {}) {
        const star = starRefs.current[navId]
        if (!star) return
        const starPos = star.position.clone()
        startAnimation({
          kind: 'zoomIn',
          toPos: approachPositionFor(starPos),
          toLook: starPos,
          duration: 1100,
          midpointT: 0.72,
          targetNavId: navId,
          onMidpoint,
          onComplete: () => {
            restingNavId.current = navId
            onComplete?.()
          },
        })
      },

      zoomOutToAmbient({ onMidpoint, onComplete } = {}) {
        startAnimation({
          kind: 'zoomOut',
          toPos: new THREE.Vector3(...AMBIENT_CAMERA_POSITION),
          toLook: AMBIENT_LOOKAT.clone(),
          duration: 900,
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
        const star = starRefs.current[navId]
        if (!star) return
        const starPos = star.position.clone()
        const dipPos = new THREE.Vector3(0, -1.2, 5.5) // brief pull-back at the midpoint
        anim.current = {
          kind: 'pan',
          startTime: performance.now(),
          duration: 600,
          midpointT: 0.5,
          midpointFired: false,
          fromPos: camera.position.clone(),
          fromLook: currentLook.current.clone(),
          dipPos,
          toPos: approachPositionFor(starPos),
          toLook: starPos,
          targetNavId: navId,
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
          const star = starRefs.current[navId]
          if (star) {
            const starPos = star.position.clone()
            const toPos = approachPositionFor(starPos)
            camera.position.copy(toPos)
            camera.lookAt(starPos)
            currentLook.current.copy(starPos)
            restingNavId.current = navId
          }
        }
        onComplete?.()
      },

      getRestingNavId() {
        return restingNavId.current
      },
    }),
    [camera, starRefs],
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
        prevStar.material.emissiveIntensity = 1.4 + (1 - eased) * 3
        prevStar.scale.setScalar(1 + (1 - eased) * 1.4)
      }
      if (nextStar?.material) {
        nextStar.material.emissiveIntensity = 1.4 + eased * 3
        nextStar.scale.setScalar(1 + eased * 1.4)
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
          star.material.emissiveIntensity = 1.4 + factor * 5
          star.scale.setScalar(1 + factor * 2.2)
        }
      }
    }

    if (!a.midpointFired && t >= a.midpointT) {
      a.midpointFired = true
      a.onMidpoint?.()
    }
    if (t >= 1) {
      a.onComplete?.()
      anim.current = null
    }
  })

  return null
})

export default CameraRig
