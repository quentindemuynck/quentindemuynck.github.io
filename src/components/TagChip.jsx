import { useTagCatalog, tagMetaFor } from '../context/TagsContext.jsx'

function TagChip({ tag }) {
  const { tagMap } = useTagCatalog()
  const meta = tagMetaFor(tagMap, tag)
  return (
    <span className="tag-chip" style={{ backgroundColor: meta.color }}>
      {meta.icon && <img src={meta.icon} alt="" aria-hidden="true" />}
      {tag}
    </span>
  )
}

export default TagChip
