import { REPO_OWNER, REPO_NAME, REPO_BRANCH } from './config.js'

const API_BASE = 'https://api.github.com'

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

// atob()+JSON.parse alone mangles multi-byte UTF-8 (accents, emoji, etc.);
// round-tripping through TextDecoder/TextEncoder keeps it intact.
export function decodeBase64Utf8(base64) {
  const binary = atob(base64.replace(/\n/g, ''))
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function encodeUtf8Base64(text) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}

export class GitHubApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'GitHubApiError'
    this.status = status
  }
}

/** Confirms the token can read this specific repo. Throws with a status code on failure. */
export async function validateToken(token) {
  const res = await fetch(`${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) {
    throw new GitHubApiError(
      res.status === 401 || res.status === 403
        ? 'That token was rejected — check it has Contents: Read and write on this repo.'
        : `Couldn't reach the repo (status ${res.status}).`,
      res.status,
    )
  }
  return true
}

/** Reads a text file from the repo. Returns { text, sha } or { text: null, sha: null } if it doesn't exist yet. */
export async function getFile(path, token) {
  const res = await fetch(
    `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${REPO_BRANCH}`,
    { headers: authHeaders(token) },
  )
  if (res.status === 404) {
    return { text: null, sha: null }
  }
  if (!res.ok) {
    throw new GitHubApiError(`Failed to read ${path} (status ${res.status}).`, res.status)
  }
  const data = await res.json()
  return { text: decodeBase64Utf8(data.content), sha: data.sha }
}

/**
 * Writes a text file, creating or updating a commit on REPO_BRANCH.
 * Throws GitHubApiError with status 409 if `sha` is stale (someone/something
 * else changed the file since it was last read) — callers should re-fetch
 * and let the user reapply rather than silently overwriting.
 */
export async function putFile(path, token, text, sha, message) {
  const res = await fetch(`${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: encodeUtf8Base64(text),
      sha: sha ?? undefined,
      branch: REPO_BRANCH,
    }),
  })
  if (res.status === 409) {
    throw new GitHubApiError('The file changed on GitHub since you loaded it. Reloading latest…', 409)
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new GitHubApiError(body.message || `Failed to save ${path} (status ${res.status}).`, res.status)
  }
  return res.json()
}

export async function getProjectsFile(token) {
  const { text, sha } = await getFile('public/data/projects.json', token)
  return { data: text ? JSON.parse(text) : { projects: [] }, sha }
}

export async function putProjectsFile(token, data, sha, message) {
  return putFile('public/data/projects.json', token, `${JSON.stringify(data, null, 2)}\n`, sha, message)
}
