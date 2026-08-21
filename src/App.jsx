import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Nav from './components/Nav.jsx'
import AppRoutes from './routes.jsx'
import Starfield from './three/Starfield.jsx'
import { CameraRigContext } from './context/CameraRigContext.jsx'
import { NavTransitionContext } from './context/NavTransitionContext.jsx'

function App() {
  const cameraRigRef = useRef(null)
  const location = useLocation()
  const [leaving, setLeaving] = useState(false)

  // Move focus to the new view's heading once a route transition has had
  // time to settle, so keyboard/screen-reader users land somewhere sane
  // instead of staying on a now-stale nav link.
  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelector('.view-heading')?.focus({ preventScroll: true })
    }, 550)
    return () => clearTimeout(timer)
  }, [location.pathname])

  return (
    <CameraRigContext.Provider value={cameraRigRef}>
      <NavTransitionContext.Provider value={{ leaving, setLeaving }}>
        <div className="app-shell">
          <Starfield cameraRigRef={cameraRigRef} />
          <Nav />
          <main className="app-main">
            <AppRoutes />
          </main>
          <div id="arrival-flash" aria-hidden="true" />
        </div>
      </NavTransitionContext.Provider>
    </CameraRigContext.Provider>
  )
}

export default App
