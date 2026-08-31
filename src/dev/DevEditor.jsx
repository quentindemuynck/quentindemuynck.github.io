import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import TokenGate from './TokenGate.jsx'
import ProjectForm from './ProjectForm.jsx'
import MarkdownEditor from './MarkdownEditor.jsx'
import TagManager from './TagManager.jsx'
import { getProjectsFile, putProjectsFile, getTagsFile, putTagsFile, GitHubApiError } from './githubApi.js'
import { useNavTransition } from '../context/NavTransitionContext.jsx'
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
  const [activeTab, setActiveTab] = useState('projects')
  const [projects, setProjects] = useState(null)
  const [sha, setSha] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedSlug, setSelectedSlug] = useState(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [tags, setTags] = useState(null)
  const [tagsSha, setTagsSha] = useState(null)
  const [tagsLoading, setTagsLoading] = useState(true)
  const [tagsSaving, setTagsSaving] = useState(false)
  const [tagsSaveError, setTagsSaveError] = useState('')

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

  useEffect(() => {
    let cancelled = false
    getTagsFile(token)
      .then(({ data, sha }) => {
        if (cancelled) return
        setTags(data.tags)
        setTagsSha(sha)
      })
      .catch((err) => {
        if (!cancelled) setTagsSaveError(err.message)
      })
      .finally(() => {
        if (!cancelled) setTagsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  async function persistTags(nextTags, message) {
    setTagsSaving(true)
    setTagsSaveError('')
    try {
      const result = await putTagsFile(token, { tags: nextTags }, tagsSha, message)
      setTagsSha(result.content.sha)
      setTags(nextTags)
      return true
    } catch (err) {
      if (err instanceof GitHubApiError && err.status === 409) {
        const fresh = await getTagsFile(token)
        setTags(fresh.data.tags)
        setTagsSha(fresh.sha)
        setTagsSaveError('Someone/something else changed tags.json since you loaded it — reloaded the latest version. Please reapply your edit.')
      } else {
        setTagsSaveError(err.message)
      }
      return false
    } finally {
      setTagsSaving(false)
    }
  }

  // Lets ProjectForm's inline "+ New tag" both create the tag and select it
  // for the current project in one step, without a separate trip to the Tag
  // Manager tab.
  async function handleQuickAddTag(name) {
    if (tags.some((t) => t.name === name)) return true
    return persistTags([...tags, { name, color: '#1e2a44', icon: '' }], `Add tag "${name}" via /dev editor`)
  }

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

  if (loading || tagsLoading) return <p className="dev-status">Loading…</p>
  if (error) return <p className="dev-error">{error}</p>

  return (
    <div className="dev-editor">
      <header className="dev-header">
        <h1>Project editor</h1>
        <button type="button" className="link-like" onClick={onDisconnect}>
          Disconnect token
        </button>
      </header>

      <nav className="dev-tabs">
        <button
          type="button"
          className={activeTab === 'projects' ? 'active' : ''}
          onClick={() => setActiveTab('projects')}
        >
          Projects
        </button>
        <button type="button" className={activeTab === 'tags' ? 'active' : ''} onClick={() => setActiveTab('tags')}>
          Tags
        </button>
      </nav>

      {activeTab === 'tags' ? (
        <TagManager tags={tags} saving={tagsSaving} saveError={tagsSaveError} onSave={(next) => persistTags(next, 'Update tag catalog via /dev editor')} />
      ) : (
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
                  tags={tags}
                  onQuickAddTag={handleQuickAddTag}
                  token={token}
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
      )}
    </div>
  )
}

function DevEditor() {
  useNoIndex()
  const { leaving } = useNavTransition()
  return (
    <motion.div
      animate={{ opacity: leaving ? 0 : 1 }}
      initial={{ opacity: 1 }}
      transition={leaving ? { duration: 0.22, ease: [0.4, 0, 1, 1] } : { duration: 0 }}
    >
      <TokenGate>{(token, onDisconnect) => <Editor token={token} onDisconnect={onDisconnect} />}</TokenGate>
    </motion.div>
  )
}

export default DevEditor
