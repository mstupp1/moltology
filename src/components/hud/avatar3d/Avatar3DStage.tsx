import React, { useEffect, useRef } from 'react'
import type { Avatar3DLook, Stage } from '@/lib/avatar3d'
import { onAvatarReaction } from '@/lib/avatar3d-events'
import { mark3DUnavailable } from '@/lib/avatar3d-support'
import { cn } from '@/lib/utils'

export interface Avatar3DStageProps {
  look: Avatar3DLook
  /** Turn slowly on its own until the visitor drags. */
  spin?: boolean
  className?: string
  /** What a screen reader announces. Defaults to a description of the species. */
  label?: string
  /** A gear slot to glide in on, or null for the whole figure. */
  focus?: string | null
  /** Called once the first frame of the character is on screen. */
  onReady?: () => void
}

/**
 * Live 3D character. The renderer loads only in the browser and only when this mounts, so pages
 * that never show a 3D character never download it.
 */
export function Avatar3DStage({ look, spin = false, className, label, focus = null, onReady }: Avatar3DStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<Stage | null>(null)
  const lookRef = useRef(look)
  const spinRef = useRef(spin)
  const focusRef = useRef(focus)
  lookRef.current = look
  spinRef.current = spin
  focusRef.current = focus
  const readyRef = useRef(onReady)
  readyRef.current = onReady

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    let observer: ResizeObserver | null = null
    let watcher: IntersectionObserver | null = null
    let stopReactions: (() => void) | null = null
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    void import('@/lib/avatar3d')
      .then(({ createStage }) => {
        if (cancelled) return
        // If the browser takes 3D away, the page shows the plain placeholder instead.
        // Phones and small machines get the lighter setup; the stage also adapts if frames run slow.
        const quality = window.matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency ?? 8) <= 4 ? 'low' : 'high'
        const stage = createStage(canvas, { interactive: true, reducedMotion, lighting: 'cinematic', quality, onContextLost: mark3DUnavailable })
        stage.setLook(lookRef.current)
        stage.setSpin(spinRef.current && !reducedMotion ? 0.5 : 0)
        if (focusRef.current) stage.focus(focusRef.current)
        stageRef.current = stage
        observer = new ResizeObserver(() => stage.resize())
        observer.observe(canvas)
        // Nothing is drawn while the character is scrolled out of view.
        watcher = new IntersectionObserver(([entry]) => stage.setActive(entry.isIntersecting))
        watcher.observe(canvas)
        stopReactions = onAvatarReaction((kind) => stage.react(kind))
        // The stage draws on the next animation frame; say so once that frame is up.
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (!cancelled) readyRef.current?.()
        }))
      })
      .catch(() => mark3DUnavailable())
    return () => {
      cancelled = true
      observer?.disconnect()
      watcher?.disconnect()
      stopReactions?.()
      stageRef.current?.dispose()
      stageRef.current = null
    }
  }, [])

  // The stage works out what changed: a pose blends, a colour repaints, a new shape rebuilds.
  const lookKey = JSON.stringify({ ...look, palette: look.palette.id })
  const shownKey = useRef(lookKey)
  useEffect(() => {
    const stage = stageRef.current
    if (!stage || shownKey.current === lookKey) return
    shownKey.current = lookKey
    stage.setLook(lookRef.current)
  }, [lookKey])

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    stageRef.current?.setSpin(spin && !reducedMotion ? 0.5 : 0)
  }, [spin])

  useEffect(() => {
    stageRef.current?.focus(focus)
    if (!focus) stageRef.current?.resetView()
  }, [focus])

  return (
    <canvas
      ref={canvasRef}
      data-testid="avatar-3d-stage"
      data-focus={focus ?? undefined}
      role="img"
      aria-label={label ? `${label}. Drag to turn it, tap it, or double tap to zoom.` : `3D ${look.race} character. Drag to turn it, tap it, or double tap to zoom.`}
      className={cn('block h-full w-full', className)}
    />
  )
}
