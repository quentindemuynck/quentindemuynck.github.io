import { useEffect, useState } from 'react'

const BLANK_PROJECT = {
  slug: '',
  title: '',
  description: '',
  thumbnail: '',
  year: new Date().getFullYear(),
  status: 'completed',
  visible: false,
  tags: [],
  links: { github: '', itch: '', video: '' },
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
function ProjectForm({ project, isNew, onSave, onDelete, saving, saveError }) {
  const [form, setForm] = useState(() => ({ ...BLANK_PROJECT, ...project }))

  useEffect(() => {
    setForm({ ...BLANK_PROJECT, ...project })
  }, [project])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function updateLink(key, value) {
    setForm((f) => ({ ...f, links: { ...f.links, [key]: value } }))
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
      {form.thumbnail && (
        <div className="thumb-preview">
          <img src={`/${form.thumbnail}`} alt="" onError={(e) => (e.currentTarget.style.opacity = 0.2)} />
        </div>
      )}

      <label>
        Tags (comma-separated)
        <input
          value={form.tags.join(', ')}
          onChange={(e) => update('tags', e.target.value.split(',').map((t) => t.trim()))}
        />
      </label>

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
