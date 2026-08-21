// Repo the /dev editor reads from and commits to via the GitHub Contents API.
export const REPO_OWNER = 'quentindemuynck'
export const REPO_NAME = 'quentindemuynck.github.io'
// Defaults to 'main' since that's what GitHub Pages actually deploys from —
// override locally by creating a git-ignored .env.local with
// VITE_DEV_BRANCH=<branch> (e.g. new-portfolio) to test against a branch
// that actually has data/projects.json before it's merged to main.
export const REPO_BRANCH = import.meta.env.VITE_DEV_BRANCH || 'main'

// Source-tree paths (NOT the built dist/ output) — the Contents API edits
// the repo directly, and Vite copies public/ to dist/'s root at build time.
export const PROJECTS_JSON_PATH = 'public/data/projects.json'
export const docsPath = (slug) => `public/docs/${slug}.md`

// This gate is a UI speed bump only, not real security — the JS source
// (including this hash) ships to every visitor's browser, so anyone who
// looks can find it. The actual security boundary is the GitHub PAT: no
// write happens without one, and the PAT is never stored anywhere but the
// user's own browser.
//
// Default passphrase is "portfolio-dev-2026" — change it by hashing a new
// passphrase (e.g. in a browser console: pass the string through
// crypto.subtle.digest('SHA-256', ...) the same way TokenGate does) and
// swapping the hex string below.
export const GATE_PASSPHRASE_HASH = 'a33fec722656f0474477486a586f5a76b101e948ce5fdd3fb2dd8ae3c64946c2'

export const GATE_SESSION_KEY = 'dev_gate_passed'
export const PAT_STORAGE_KEY = 'gh_pat'
