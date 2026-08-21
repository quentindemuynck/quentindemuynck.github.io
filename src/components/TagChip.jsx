import { TAG_META, DEFAULT_TAG_META } from '../data/tagMeta.js'

function TagChip({ tag }) {
  const meta = TAG_META[tag] ?? DEFAULT_TAG_META
  return (
    <span className="tag-chip" style={{ backgroundColor: meta.color }}>
      {meta.icon && <img src={meta.icon} alt="" aria-hidden="true" />}
      {tag}
    </span>
  )
}

export default TagChip
