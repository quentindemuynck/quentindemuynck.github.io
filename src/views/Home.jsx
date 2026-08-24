import { motion } from 'framer-motion'
import { viewVariants } from '../motion/viewTransition.js'
import { useNavTransition } from '../context/NavTransitionContext.jsx'

function Home() {
  const { leaving } = useNavTransition()
  return (
    <motion.section
      className="view view-home"
      variants={viewVariants}
      initial="initial"
      animate={leaving ? 'exit' : 'animate'}
      exit="exit"
    >
      <div className="hero-copy">
        <h1 className="view-heading" tabIndex={-1}>
          Hi, I'm Quentin Demuynck
        </h1>
        <p className="hero-subtitle">
          Game Developer that recently graduated at Digital Arts &amp; Entertainment at Howest
          Kortrijk.
        </p>
        <p className="hero-line">Languages &amp; Tools: C++, C#, JavaScript, Python, Lua, GDScript, …</p>
        <p className="hero-line">Engines: Unreal Engine, Unity, Godot, School-built engines, Custom engine</p>
      </div>
    </motion.section>
  )
}

export default Home
