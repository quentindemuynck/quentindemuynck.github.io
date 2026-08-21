import { useEffect, useMemo, useState } from 'react'
import TokenGate from './TokenGate.jsx'
import ProjectForm from './ProjectForm.jsx'
import MarkdownEditor from './MarkdownEditor.jsx'
import { getProjectsFile, putProjectsFile, GitHubApiError } from './githubApi.js'
import './dev.css'

function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => document.head.removeChild(meta)
  }, [])
}

function Editor({ token, onDisconnect }) {
  const [projects, setProjects] = useState(null)
  const [sha, setSha] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedSlug, setSelectedSlug] = useState(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    let cancelled = false
    getProjectsFile(token)
      .then(({ data, sha }) => {
        if (cancelled) return
        setProjects(data.projects)
        setSha(sha)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const selected = useMemo(() => {
    if (isNew) return null
    return projects?.find((p) => p.slug === selectedSlug) ?? null
  }, [projects, selectedSlug, isNew])

  async function persist(nextProjects, message) {
    setSaving(true)
    setSaveError('')
    try {
      const result = await putProjectsFile(token, { projects: nextProjects }, sha, message)
      setSha(result.content.sha)
      setProjects(nextProjects)
      return true
    } catch (err) {
      if (err instanceof GitHubApiError && err.status === 409) {
        const fresh = await getProjectsFile(token)
        setProjects(fresh.data.projects)
        setSha(fresh.sha)
        setSaveError('Someone/something else changed projects.json since you loaded it — reloaded the latest version. Please reapply your edit.')
      } else {
        setSaveError(err.message)
      }
      return false
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveProject(form) {
    const exists = projects.some((p) => p.slug === form.slug)
    const next = exists
      ? projects.map((p) => (p.slug === form.slug ? form : p))
      : [...projects, form]
    const ok = await persist(next, `${exists ? 'Update' : 'Add'} project "${form.title}" via /dev editor`)
    if (ok) {
      setIsNew(false)
      setSelectedSlug(form.slug)
    }
  }

  async function handleDelete(slug) {
    const target = projects.find((p) => p.slug === slug)
    const next = projects.filter((p) => p.slug !== slug)
    const ok = await persist(next, `Remove project "${target?.title ?? slug}" via /dev editor`)
    if (ok) {
      setSelectedSlug(null)
    }
  }

  async function handleQuickToggle(slug) {
    const next = projects.map((p) => (p.slug === slug ? { ...p, visible: !p.visible } : p))
    const target = projects.find((p) => p.slug === slug)
    await persist(next, `${target?.visible ? 'Hide' : 'Show'} project "${target?.title ?? slug}" via /dev editor`)
  }

  if (loading) return <p className="dev-status">Loading projects…</p>
  if (error) return <p className="dev-error">{error}</p>

  return (
    <div className="dev-editor">
      <header className="dev-header">
        <h1>Project editor</h1>
        <button type="button" className="link-like" onClick={onDisconnect}>
          Disconnect token
        </button>
      </header>

      <div className="dev-layout">
        <aside className="dev-project-list">
          <button
            type="button"
            className="dev-new-button"
            onClick={() => {
              setIsNew(true)
              setSelectedSlug(null)
            }}
          >
            + New project
          </button>
          <ul>
            {projects.map((p) => (
              <li key={p.slug}>
                <button
                  type="button"
                  className={`dev-project-row ${!isNew && selectedSlug === p.slug ? 'active' : ''} ${!p.visible ? 'hidden-project' : ''}`}
                  onClick={() => {
                    setIsNew(false)
                    setSelectedSlug(p.slug)
                  }}
                >
                  <span>{p.title || '(untitled)'}</span>
                  {!p.visible && <span className="hidden-badge">Hidden</span>}
                </button>
                <button
                  type="button"
                  className="eye-toggle"
                  title={p.visible ? 'Hide from site' : 'Show on site'}
                  onClick={() => handleQuickToggle(p.slug)}
                >
                  {p.visible ? '👁' : '🚫'}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="dev-form-panel">
          {(selected || isNew) && (
            <>
              <ProjectForm
                key={isNew ? 'new' : selected.slug}
                project={isNew ? undefined : selected}
                isNew={isNew}
                onSave={handleSaveProject}
                onDelete={handleDelete}
                saving={saving}
                saveError={saveError}
              />
              {!isNew && (
                <div className="markdown-editor-wrap">
                  <h2>Write-up</h2>
                  <MarkdownEditor token={token} slug={selected.slug} />
                </div>
              )}
            </>
          )}
          {!selected && !isNew && <p className="dev-status">Select a project on the left, or add a new one.</p>}
        </section>
      </div>
    </div>
  )
}

function DevEditor() {
  useNoIndex()
  return <TokenGate>{(token, onDisconnect) => <Editor token={token} onDisconnect={onDisconnect} />}</TokenGate>
}

export default DevEditor
