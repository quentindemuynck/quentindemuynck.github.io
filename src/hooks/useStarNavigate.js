import { useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCameraRig } from '../context/CameraRigContext.jsx'

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

      if (dest === 'home') {
        rig.zoomOutToAmbient({ onMidpoint: () => navigate(path) })
        return
      }

      if (from === 'home' || from === null) {
        rig.zoomToStar(dest, { onMidpoint: () => navigate(path) })
        return
      }

      // Direct cross-section nav (Projects <-> About): lighter pan, no
      // return-to-hub in between.
      rig.panTo(dest, { onMidpoint: () => navigate(path) })
    },
    [navigate, location.pathname, cameraRigRef],
  )
}
