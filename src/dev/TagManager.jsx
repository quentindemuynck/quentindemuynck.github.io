import { useEffect, useState } from 'react'

const BLANK_NEW_TAG = { name: '', color: '#1e2a44', icon: '' }

/** Manage panel for the reusable tag catalog (public/data/tags.json) — create,
 * edit, and delete premade tags (name + color + optional icon) so project
 * forms can pick from them instead of retyping tag names each time. State
 * (fetch/save/sha) is owned by DevEditor, same as ProjectForm/projects. */
function TagManager({ tags, saving, saveError, onSave }) {
  const [rows, setRows] = useState(tags)
  const [newTag, setNewTag] = useState(BLANK_NEW_TAG)

  useEffect(() => {
    setRows(tags)
  }, [tags])

  function updateRow(index, field, value) {
    setRows((r) => r.map((t, i) => (i === index ? { ...t, [field]: value } : t)))
  }

  function removeRow(index) {
    setRows((r) => r.filter((_, i) => i !== index))
  }

  function addNewTag() {
    const name = newTag.name.trim()
    if (!name || rows.some((t) => t.name === name)) return
    setRows((r) => [...r, { name, color: newTag.color, icon: newTag.icon.trim() }])
    setNewTag(BLANK_NEW_TAG)
  }

  return (
    <div className="tag-manager">
      <p className="dev-gate-note">
        Premade tags shown here can be picked in a project's form instead of retyping them. Color
        and icon apply everywhere the tag is used.
      </p>

      <div className="tag-manager-rows">
        {rows.map((t, i) => (
          <div className="tag-manager-row" key={i}>
            <input type="color" value={t.color} onChange={(e) => updateRow(i, 'color', e.target.value)} />
            <input
              className="tag-manager-name"
              value={t.name}
              onChange={(e) => updateRow(i, 'name', e.target.value)}
            />
            <input
              className="tag-manager-icon"
              placeholder="/icons/foo.png (optional)"
              value={t.icon ?? ''}
              onChange={(e) => updateRow(i, 'icon', e.target.value)}
            />
            <button type="button" className="danger" onClick={() => removeRow(i)}>
              Delete
            </button>
          </div>
        ))}
      </div>

      <div className="tag-manager-row tag-manager-new">
        <input type="color" value={newTag.color} onChange={(e) => setNewTag((t) => ({ ...t, color: e.target.value }))} />
        <input
          className="tag-manager-name"
          placeholder="New tag name"
          value={newTag.name}
          onChange={(e) => setNewTag((t) => ({ ...t, name: e.target.value }))}
        />
        <input
          className="tag-manager-icon"
          placeholder="/icons/foo.png (optional)"
          value={newTag.icon}
          onChange={(e) => setNewTag((t) => ({ ...t, icon: e.target.value }))}
        />
        <button type="button" onClick={addNewTag} disabled={!newTag.name.trim()}>
          + Add tag
        </button>
      </div>

      {saveError && <p className="dev-error">{saveError}</p>}

      <div className="form-actions">
        <button type="button" disabled={saving} onClick={() => onSave(rows)}>
          {saving ? 'Saving…' : 'Save tags'}
        </button>
      </div>
    </div>
  )
}

export default TagManager
