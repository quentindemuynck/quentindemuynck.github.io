import { useEffect, useState } from 'react'

let cache = null

async function fetchProjects() {
  if (cache) return cache
  const res = await fetch('/data/projects.json')
  if (!res.ok) throw new Error(`Failed to load projects.json: ${res.status}`)
  const data = await res.json()
  cache = data.projects
  return cache
}

export function invalidateProjectsCache() {
  cache = null
}

/** All projects, unfiltered (used by /dev). */
export function useAllProjects() {
  const [projects, setProjects] = useState(cache)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchProjects()
      .then((data) => {
        if (!cancelled) setProjects(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { projects, error, loading: !projects && !error }
}

/** Only publicly visible projects, for the public site. */
export function useProjects() {
  const { projects, error, loading } = useAllProjects()
  return {
    projects: projects ? projects.filter((p) => p.visible) : null,
    error,
    loading,
  }
}

export function useProject(slug) {
  const { projects, error, loading } = useAllProjects()
  if (!projects) return { project: null, error, loading }
  const project = projects.find((p) => p.slug === slug && p.visible) ?? null
  return { project, error, loading }
}
