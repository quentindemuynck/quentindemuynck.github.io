import { useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCameraRig } from '../context/CameraRigContext.jsx'
import { useNavTransition } from '../context/NavTransitionContext.jsx'

const DEST_PATH = { home: '/', projects: '/projects', about: '/about' }

function routeCategory(pathname) {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/projects')) return 'projects'
  if (pathname.startsWith('/about')) return 'about'
  return null
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

// Washes the screen briefly in the color of the star just flown into, so
// landing reads as actually stopping on it rather than just seeing it
// nearby. Fires right at the animation's midpoint, before the destination
// route mounts underneath it. No-op if there's no picked color (e.g. the
// zoom-out-to-home case, which has no single associated star). `screenPos`
// (from CameraRig's projection of the target star) places the glow's origin
// wherever the star actually is on screen — a pan can land the star well
// off-center, and a flash that always originates dead-center looked wrong
// for those.
function triggerArrivalFlash(colorHex, screenPos) {
  if (!colorHex || typeof document === 'undefined') return
  const el = document.getElementById('arrival-flash')
  if (!el) return
  const { x = 50, y = 50 } = screenPos || {}
  el.style.setProperty('--arrival-color', colorHex)
  el.style.setProperty('--arrival-x', `${x}%`)
  el.style.setProperty('--arrival-y', `${y}%`)
  el.classList.remove('arrival-flash-active')
  // eslint-disable-next-line no-unused-expressions
  el.offsetWidth // force reflow so re-adding the class restarts the animation
  el.classList.add('arrival-flash-active')
}

/**
 * Central navigation hook for the three top-level destinations (Home,
 * Projects, About). Decides which CameraRig transition fits the current
 * route pair, fires it, and navigates the router at the animation's
 * midpoint so the new view mounts while still hidden inside the star glow.
 */
export function useStarNavigate() {
  const navigate = useNavigate()
  const location = useLocation()
  const cameraRigRef = useCameraRig()
  const { setLeaving } = useNavTransition()

  return useCallback(
    (dest) => {
      const path = DEST_PATH[dest]
      if (!path) return
      const from = routeCategory(location.pathname)

      if (from === dest) {
        navigate(path)
        return
      }

      const rig = cameraRigRef?.current
      if (!rig || prefersReducedMotion()) {
        rig?.snapTo(dest === 'home' ? null : dest)
        navigate(path)
        return
      }

      // The outgoing view starts its fast exit right away, on click — the
      // route swap (and therefore when the new view mounts) still waits
      // for the camera animation's midpoint below, so the old view isn't
      // stuck on screen for the whole (often 1-2s) camera travel time.
      setLeaving(true)

      if (dest === 'home') {
        rig.zoomOutToAmbient({
          onMidpoint: () => {
            setLeaving(false)
            navigate(path)
          },
        })
        return
      }

      if (from === 'home' || from === null) {
        rig.zoomToStar(dest, {
          onMidpoint: (colorHex, screenPos) => {
            setLeaving(false)
            triggerArrivalFlash(colorHex, screenPos)
            navigate(path)
          },
        })
        return
      }

      // Direct cross-section nav (Projects <-> About): lighter pan, no
      // return-to-hub in between.
      rig.panTo(dest, {
        onMidpoint: (colorHex, screenPos) => {
          setLeaving(false)
          triggerArrivalFlash(colorHex, screenPos)
          navigate(path)
        },
      })
    },
    [navigate, location.pathname, cameraRigRef, setLeaving],
  )
}
