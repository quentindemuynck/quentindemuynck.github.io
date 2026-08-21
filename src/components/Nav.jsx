import { NavLink } from 'react-router-dom'
import { useStarNavigate } from '../hooks/useStarNavigate.js'

function isPlainLeftClick(e) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
}

function Nav() {
  const goTo = useStarNavigate()

  function handleNav(dest) {
    return (e) => {
      if (!isPlainLeftClick(e)) return
      e.preventDefault()
      goTo(dest)
    }
  }

  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <NavLink to="/" className="brand" end onClick={handleNav('home')}>
          Quentin Demuynck
        </NavLink>
        <nav aria-label="Primary">
          <ul>
            <li>
              <NavLink
                to="/projects"
                className={({ isActive }) => (isActive ? 'active' : undefined)}
                onClick={handleNav('projects')}
              >
                Projects
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/about"
                className={({ isActive }) => (isActive ? 'active' : undefined)}
                onClick={handleNav('about')}
              >
                About &amp; Contact
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Nav
