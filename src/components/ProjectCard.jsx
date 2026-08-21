import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import TagChip from './TagChip.jsx'

function ProjectCard({ project }) {
  return (
    <Link to={`/projects/${project.slug}`} className="project-card">
      <div className="project-card-thumb">
        <motion.img
          layoutId={`thumb-${project.slug}`}
          src={`/${project.thumbnail}`}
          alt=""
          loading="lazy"
        />
      </div>
      <div className="project-card-body">
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <div className="tag-row">
          {project.tags.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
      </div>
    </Link>
  )
}

export default ProjectCard
