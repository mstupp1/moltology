import { useSyncExternalStore } from 'react'
import { can3D, subscribe3DSupport } from '@/lib/avatar3d-support'

/**
 * Whether this browser draws characters in 3D: true, false, or null while that is not known yet
 * (on the server and during hydration). Characters are 3D for everyone; null is the moment to
 * show a loader, and false (no WebGL, or 3D failed on this page) shows a plain placeholder.
 */
export function useAvatar3D(): boolean | null {
  return useSyncExternalStore(subscribe3DSupport, can3D, () => null)
}
