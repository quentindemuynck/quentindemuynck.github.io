import { useEffect, useState } from 'react'
import { marked } from 'marked'
import { getFile, putFile, GitHubApiError } from './githubApi.js'
import { docsPath } from './config.js'

function MarkdownEditor({ token, slug }) {
  const [text, setText] = useState('')
  const [sha, setSha] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedAt, setSavedAt] = useState(null)

  const path = docsPath(slug)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setSavedAt(null)
    getFile(path, token)
      .then(({ text, sha }) => {
        if (cancelled) return
        setText(text ?? '')
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
  }, [path, token])

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const result = await putFile(path, token, text, sha, `Update ${path} via /dev editor`)
      setSha(result.content.sha)
      setSavedAt(new Date())
    } catch (err) {
      if (err instanceof GitHubApiError && err.status === 409) {
        const fresh = await getFile(path, token)
        setSha(fresh.sha)
      }
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Loading write-up…</p>

  return (
    <div className="markdown-editor">
      <div className="markdown-editor-pane">
        <label htmlFor="md-source">Write-up (Markdown)</label>
        <textarea
          id="md-source"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={16}
          placeholder="Leave empty to show &quot;Write-up coming soon.&quot; on the public site."
        />
      </div>
      <div className="markdown-editor-pane">
        <span className="markdown-preview-label">Preview</span>
        <div
          className="markdown-content markdown-preview"
          dangerouslySetInnerHTML={{ __html: text.trim() ? marked.parse(text) : '<p><em>(empty)</em></p>' }}
        />
      </div>
      <div className="form-actions">
        <button type="button" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save write-up'}
        </button>
        {savedAt && <span className="save-confirm">Saved {savedAt.toLocaleTimeString()}</span>}
      </div>
      {error && <p className="dev-error">{error}</p>}
    </div>
  )
}

export default MarkdownEditor
