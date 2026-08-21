// Shared enter/exit motion for the three star-driven top-level views (Home,
// Projects, About). Exit is deliberately much shorter than enter, with an
// ease-in curve that starts moving immediately — so the outgoing view is
// visibly gone before the incoming one has finished settling in, rather
// than the two taking equally long and just crossfading flatly.
export const viewVariants = {
  initial: { opacity: 0, scale: 0.94, y: 14 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 1.04,
    y: -10,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
  },
}
