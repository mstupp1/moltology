/**
 * Lets a page ask every live 3D character on it to react (for example to celebrate a save)
 * without holding a reference to the stage or loading the 3D renderer.
 */
export type AvatarReaction = 'poke' | 'snap' | 'equip' | 'celebrate'

const EVENT = 'avatar3d:react'

export function reactAvatars(kind: AvatarReaction): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<AvatarReaction>(EVENT, { detail: kind }))
}

/** Listen for reactions. Returns a function that stops listening. */
export function onAvatarReaction(listener: (kind: AvatarReaction) => void): () => void {
  const handle = (event: Event) => listener((event as CustomEvent<AvatarReaction>).detail)
  window.addEventListener(EVENT, handle)
  return () => window.removeEventListener(EVENT, handle)
}
