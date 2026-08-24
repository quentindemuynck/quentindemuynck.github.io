import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { marked } from 'marked'
import hljs from 'highlight.js'
import { motion } from 'framer-motion'
import { useProject } from '../hooks/useProjects.js'
import TagChip from '../components/TagChip.jsx'

function useMarkdown(path) {
  const [html, setHtml] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!path) return
    let cancelled = false
    setLoading(true)
    setHtml(null)
    fetch(`/${path}`)
      .then((res) => (res.ok ? res.text() : ''))
      .then((text) => {
        if (cancelled) return
        setHtml(text.trim() ? marked.parse(text) : '')
      })
      .catch(() => {
        if (!cancelled) setHtml('')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [path])

  return { html, loading }
}

function getYoutubeEmbedUrl(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`
    }
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
  } catch {
    return null
  }
  return null
}

function ProjectDetail() {
  const { slug } = useParams()
  const { project, loading: loadingProject } = useProject(slug)
  const { html: markdownHtml, loading: loadingMarkdown } = useMarkdown(project?.markdown)

  useEffect(() => {
    if (markdownHtml) {
      document.querySelectorAll('#markdown-content pre code').forEach((block) => {
        hljs.highlightElement(block)
      })
    }
  }, [markdownHtml])

  if (loadingProject) {
    return (
      <section className="view view-project-detail">
        <p>Loading…</p>
      </section>
    )
  }

  if (!project) {
    return <Navigate to="/projects" replace />
  }

  const embedUrl = getYoutubeEmbedUrl(project.links.video)

  return (
    <motion.section
      className="view view-project-detail"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
    >
      <Link to="/projects" className="back-link">
        &larr; Back to projects
      </Link>

      <div className="project-detail-thumb">
        <motion.img layoutId={`thumb-${project.slug}`} src={`/${project.thumbnail}`} alt="" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.25, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="view-heading" tabIndex={-1}>
          {project.title}
        </h1>
        <p className="project-detail-meta">{project.year}</p>
        <div className="tag-row">
          {project.tags.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
        <p className="project-detail-description">{project.description}</p>

        <div className="project-detail-links">
          {project.links.github && (
            <a href={project.links.github} target="_blank" rel="noreferrer" className="link-button">
              <img src="/icons/github.png" alt="" aria-hidden="true" /> GitHub
            </a>
          )}
          {project.links.itch && (
            <a href={project.links.itch} target="_blank" rel="noreferrer" className="link-button">
              <img src="/icons/itch.png" alt="" aria-hidden="true" /> itch.io
            </a>
          )}
          {(project.links.custom ?? []).map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="link-button">
              {link.title}
            </a>
          ))}
        </div>

        {embedUrl && (
          <div className="video-embed">
            <iframe
              src={embedUrl}
              title={`${project.title} video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {!loadingMarkdown && markdownHtml && (
          <div
            id="markdown-content"
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: markdownHtml }}
          />
        )}
        {!loadingMarkdown && !markdownHtml && <p className="writeup-placeholder">Write-up coming soon.</p>}
      </motion.div>
    </motion.section>
  )
}

export default ProjectDetail
