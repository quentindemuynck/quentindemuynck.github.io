import { createContext, useContext } from 'react'

// Lets the outgoing top-level view start its exit animation the instant a
// star-driven navigation begins, decoupled from the route change (which
// still waits for the camera animation's midpoint so the new view mounts
// hidden inside the star's bloom).
export const NavTransitionContext = createContext({ leaving: false, setLeaving: () => {} })

export function useNavTransition() {
  return useContext(NavTransitionContext)
}
