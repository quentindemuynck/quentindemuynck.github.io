import { createContext, useContext, useEffect, useState } from 'react'
import { DEFAULT_TAG_META } from '../data/tagMeta.js'

export const TagsContext = createContext({ tags: [], tagMap: {}, loading: true, error: null })

/**
 * Fetches the tag catalog (public/data/tags.json, managed via /dev's Tag
 * Manager) once and provides it to the whole app — TagChip reads styling
 * (color/icon) from this instead of a hardcoded map, so tags created in
 * /dev show up with the right look everywhere without a code change.
 */
export function TagsProvider({ children }) {
  const [state, setState] = useState({ tags: [], tagMap: {}, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    fetch('/data/tags.json')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load tags.json: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        const tags = data.tags ?? []
        const tagMap = Object.fromEntries(tags.map((t) => [t.name, t]))
        setState({ tags, tagMap, loading: false, error: null })
      })
      .catch((error) => {
        if (!cancelled) setState({ tags: [], tagMap: {}, loading: false, error })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return <TagsContext.Provider value={state}>{children}</TagsContext.Provider>
}

export function useTagCatalog() {
  return useContext(TagsContext)
}

export function tagMetaFor(tagMap, name) {
  return tagMap[name] ?? DEFAULT_TAG_META
}
