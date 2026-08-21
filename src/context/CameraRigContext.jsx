import { createContext, useContext } from 'react'

export const CameraRigContext = createContext(null)

export function useCameraRig() {
  return useContext(CameraRigContext)
}
