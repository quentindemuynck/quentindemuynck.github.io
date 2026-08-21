import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Home from './views/Home.jsx'
import Projects from './views/Projects.jsx'
import About from './views/About.jsx'
import ProjectDetail from './views/ProjectDetail.jsx'

// Code-split out of the main bundle: normal visitors never fetch this chunk.
const DevEditor = lazy(() => import('./dev/DevEditor.jsx'))

function AppRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/about" element={<About />} />
        <Route
          path="/dev"
          element={
            <Suspense fallback={<p className="view">Loading…</p>}>
              <DevEditor />
            </Suspense>
          }
        />
      </Routes>
    </AnimatePresence>
  )
}

export default AppRoutes
