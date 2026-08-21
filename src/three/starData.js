// Fallback/idle placement for the two navigation target stars, used only
// until the first navigation ever happens — CameraRig re-homes each one to
// an arbitrary star pulled live from GalaxyField on every zoom/pan (see
// CameraRig.repickTargetStar), so these positions are rarely seen.
export const NAMED_STARS = {
  projects: { position: [-7.5, -3.6, -5], color: '#4da3ff' },
  about: { position: [7.5, -3.6, -5], color: '#7b6cff' },
}

export const AMBIENT_CAMERA_POSITION = [0, 0, 10]
