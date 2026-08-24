import { useEffect, useState } from 'react'
import { uploadImage, GitHubApiError } from './githubApi.js'

const BLANK_PROJECT = {
  slug: '',
  title: '',
  description: '',
  thumbnail: '',
  year: new Date().getFullYear(),
  status: 'completed',
  visible: false,
  tags: [],
  links: { github: '', itch: '', video: '', custom: [] },
  markdown: '',
}

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Editable form for one project's fields, incl. the visibility toggle. */
function ProjectForm({ project, isNew, onSave, onDelete, saving, saveError, tags, onQuickAddTag, token }) {
  const [form, setForm] = useState(() => ({
    ...BLANK_PROJECT,
    ...project,
    links: { ...BLANK_PROJECT.links, ...project?.links },
  }))
  const [newTagName, setNewTagName] = useState('')
  const [addingTag, setAddingTag] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    setForm({ ...BLANK_PROJECT, ...project, links: { ...BLANK_PROJECT.links, ...project?.links } })
  }, [project])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function updateLink(key, value) {
    setForm((f) => ({ ...f, links: { ...f.links, [key]: value } }))
  }

  function toggleTag(name) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(name) ? f.tags.filter((t) => t !== name) : [...f.tags, name],
    }))
  }

  async function handleAddNewTag() {
    const name = newTagName.trim()
    if (!name) return
    setAddingTag(true)
    const ok = await onQuickAddTag(name)
    setAddingTag(false)
    if (ok) {
      setForm((f) => ({ ...f, tags: f.tags.includes(name) ? f.tags : [...f.tags, name] }))
      setNewTagName('')
    }
  }

  function updateCustomLink(index, field, value) {
    setForm((f) => ({
      ...f,
      links: {
        ...f.links,
        custom: f.links.custom.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
      },
    }))
  }

  function addCustomLink() {
    setForm((f) => ({ ...f, links: { ...f.links, custom: [...f.links.custom, { title: '', url: '' }] } }))
  }

  function removeCustomLink(index) {
    setForm((f) => ({ ...f, links: { ...f.links, custom: f.links.custom.filter((_, i) => i !== index) } }))
  }

  async function handleThumbnailUpload(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      const path = await uploadImage(token, file, form.slug)
      update('thumbnail', path)
    } catch (err) {
      setUploadError(err instanceof GitHubApiError ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  function handleTitleChange(value) {
    setForm((f) => ({
      ...f,
      title: value,
      slug: isNew ? slugify(value) : f.slug,
      markdown: isNew ? `docs/${slugify(value)}.md` : f.markdown,
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const cleaned = {
      ...form,
      year: Number(form.year) || new Date().getFullYear(),
      tags: form.tags.filter(Boolean),
      links: {
        ...form.links,
        custom: form.links.custom.filter((l) => l.title.trim() && l.url.trim()),
      },
    }
    onSave(cleaned)
  }

  return (
    <form className="project-form" onSubmit={handleSubmit}>
      <label className="visibility-toggle">
        <input
          type="checkbox"
          checked={form.visible}
          onChange={(e) => update('visible', e.target.checked)}
        />
        <span>{form.visible ? 'Visible on site' : 'Hidden from site'}</span>
      </label>

      <label>
        Title
        <input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} required />
      </label>

      <label>
        Slug
        <input value={form.slug} onChange={(e) => update('slug', slugify(e.target.value))} required disabled={!isNew} />
      </label>

      <label>
        Description
        <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={3} />
      </label>

      <div className="form-row">
        <label>
          Year
          <input type="number" value={form.year} onChange={(e) => update('year', e.target.value)} />
        </label>
        <label>
          Status
          <select value={form.status} onChange={(e) => update('status', e.target.value)}>
            <option value="completed">Completed</option>
            <option value="in-progress">In progress</option>
          </select>
        </label>
      </div>

      <label>
        Thumbnail path (relative to /images/, e.g. images/foo.png)
        <input value={form.thumbnail} onChange={(e) => update('thumbnail', e.target.value)} />
      </label>
      <label className="upload-label">
        Or upload an image/gif
        <input type="file" accept="image/*" onChange={handleThumbnailUpload} disabled={uploading} />
      </label>
      {uploading && <p className="dev-status">Uploading…</p>}
      {uploadError && <p className="dev-error">{uploadError}</p>}
      {form.thumbnail && (
        <div className="thumb-preview">
          <img src={`/${form.thumbnail}`} alt="" onError={(e) => (e.currentTarget.style.opacity = 0.2)} />
        </div>
      )}

      <div className="tag-picker">
        <span className="tag-picker-label">Tags</span>
        <div className="tag-picker-chips">
          {tags.map((t) => (
            <button
              key={t.name}
              type="button"
              className={`tag-picker-chip ${form.tags.includes(t.name) ? 'selected' : ''}`}
              style={{ backgroundColor: form.tags.includes(t.name) ? t.color : undefined }}
              onClick={() => toggleTag(t.name)}
            >
              {t.name}
            </button>
          ))}
        </div>
        <div className="tag-picker-new">
          <input
            placeholder="New tag name"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
          />
          <button type="button" onClick={handleAddNewTag} disabled={!newTagName.trim() || addingTag}>
            {addingTag ? 'Adding…' : '+ New tag'}
          </button>
        </div>
      </div>

      <div className="form-row">
        <label>
          GitHub link
          <input value={form.links.github} onChange={(e) => updateLink('github', e.target.value)} />
        </label>
        <label>
          itch.io link
          <input value={form.links.itch} onChange={(e) => updateLink('itch', e.target.value)} />
        </label>
      </div>
      <label>
        Video link (YouTube)
        <input value={form.links.video} onChange={(e) => updateLink('video', e.target.value)} />
      </label>

      <div className="custom-links">
        <span className="tag-picker-label">Custom links (shown as buttons, e.g. a website or Steam page)</span>
        {form.links.custom.map((l, i) => (
          <div className="form-row custom-link-row" key={i}>
            <input placeholder="Title" value={l.title} onChange={(e) => updateCustomLink(i, 'title', e.target.value)} />
            <input placeholder="URL" value={l.url} onChange={(e) => updateCustomLink(i, 'url', e.target.value)} />
            <button type="button" className="danger" onClick={() => removeCustomLink(i)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addCustomLink}>
          + Add link
        </button>
      </div>

      <label>
        Markdown path (relative to /docs/, e.g. docs/foo.md)
        <input value={form.markdown} onChange={(e) => update('markdown', e.target.value)} />
      </label>

      {saveError && <p className="dev-error">{saveError}</p>}

      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save project data'}
        </button>
        {!isNew && (
          <button
            type="button"
            className="danger"
            disabled={saving}
            onClick={() => {
              if (confirm(`Delete "${form.title}" from projects.json? This does not delete its images or markdown.`)) {
                onDelete(form.slug)
              }
            }}
          >
            Delete
          </button>
        )}
      </div>
    </form>
  )
}

export default ProjectForm
