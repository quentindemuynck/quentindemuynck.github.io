import { motion } from 'framer-motion'
import { useProjects } from '../hooks/useProjects.js'
import ProjectCard from '../components/ProjectCard.jsx'
import { viewVariants } from '../motion/viewTransition.js'
import { useNavTransition } from '../context/NavTransitionContext.jsx'

function Projects() {
  const { projects, error, loading } = useProjects()
  const { leaving } = useNavTransition()

  return (
    <motion.section
      className="view view-projects"
      variants={viewVariants}
      initial="initial"
      animate={leaving ? 'exit' : 'animate'}
      exit="exit"
    >
      <h2 className="view-heading" tabIndex={-1}>
        My Projects
      </h2>

      {loading && (
        <div className="project-grid" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="project-card project-card-skeleton" key={i} />
          ))}
        </div>
      )}

      {error && <p className="error-text">Couldn't load projects right now. Please try again later.</p>}

      {projects && (
        <div className="project-grid">
          {projects.map((project, i) => (
            <motion.div
              key={project.slug}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  )
}

export default Projects
