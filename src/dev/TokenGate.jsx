import { useEffect, useState } from 'react'
import { validateToken, GitHubApiError } from './githubApi.js'
import { GATE_PASSPHRASE_HASH, GATE_SESSION_KEY, PAT_STORAGE_KEY, REPO_OWNER, REPO_NAME } from './config.js'

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function PassphraseStep({ onPass }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setChecking(true)
    setError('')
    const hash = await sha256Hex(value)
    setChecking(false)
    if (hash === GATE_PASSPHRASE_HASH) {
      sessionStorage.setItem(GATE_SESSION_KEY, '1')
      onPass()
    } else {
      setError('Incorrect passphrase.')
    }
  }

  return (
    <div className="dev-gate">
      <h1>/dev</h1>
      <p className="dev-gate-note">
        This is a speed bump, not real security — the actual protection is that saving requires
        your own GitHub token below.
      </p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="dev-passphrase">Passphrase</label>
        <input
          id="dev-passphrase"
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          autoComplete="off"
        />
        <button type="submit" disabled={checking || !value}>
          {checking ? 'Checking…' : 'Continue'}
        </button>
        {error && <p className="dev-error">{error}</p>}
      </form>
    </div>
  )
}

function TokenStep({ onReady }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setChecking(true)
    setError('')
    try {
      await validateToken(value.trim())
      localStorage.setItem(PAT_STORAGE_KEY, value.trim())
      onReady(value.trim())
    } catch (err) {
      setError(err instanceof GitHubApiError ? err.message : 'Could not validate token.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="dev-gate">
      <h1>Connect a GitHub token</h1>
      <p className="dev-gate-note">
        Paste a <strong>fine-grained</strong> GitHub Personal Access Token scoped to just{' '}
        <code>
          {REPO_OWNER}/{REPO_NAME}
        </code>{' '}
        with <strong>Contents: Read and write</strong> permission — nothing more. It's stored only in
        this browser's local storage and sent only to <code>api.github.com</code>.
      </p>
      <p className="dev-gate-note">
        <a
          href="https://github.com/settings/personal-access-tokens/new"
          target="_blank"
          rel="noreferrer"
        >
          Create a token on GitHub &rarr;
        </a>
      </p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="dev-token">Personal access token</label>
        <input
          id="dev-token"
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          autoComplete="off"
          placeholder="github_pat_…"
        />
        <button type="submit" disabled={checking || !value}>
          {checking ? 'Validating…' : 'Connect'}
        </button>
        {error && <p className="dev-error">{error}</p>}
      </form>
    </div>
  )
}

/**
 * Two-step gate: a passphrase speed bump, then a GitHub PAT that's actually
 * validated against the repo before anything renders behind it.
 */
function TokenGate({ children }) {
  const [passed, setPassed] = useState(() => sessionStorage.getItem(GATE_SESSION_KEY) === '1')
  const [token, setToken] = useState(null)
  const [checkingStoredToken, setCheckingStoredToken] = useState(true)

  useEffect(() => {
    if (!passed) {
      setCheckingStoredToken(false)
      return
    }
    const stored = localStorage.getItem(PAT_STORAGE_KEY)
    if (!stored) {
      setCheckingStoredToken(false)
      return
    }
    validateToken(stored)
      .then(() => setToken(stored))
      .catch(() => localStorage.removeItem(PAT_STORAGE_KEY))
      .finally(() => setCheckingStoredToken(false))
  }, [passed])

  if (!passed) {
    return <PassphraseStep onPass={() => setPassed(true)} />
  }

  if (checkingStoredToken) {
    return (
      <div className="dev-gate">
        <p>Checking stored token…</p>
      </div>
    )
  }

  if (!token) {
    return <TokenStep onReady={setToken} />
  }

  return children(token, () => {
    localStorage.removeItem(PAT_STORAGE_KEY)
    setToken(null)
  })
}

export default TokenGate
