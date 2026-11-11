import React, { useEffect, useRef } from 'react'
import type { Avatar3DLook, Stage } from '@/lib/avatar3d'
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
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    void import('@/lib/avatar3d')
      .then(({ createStage }) => {
        if (cancelled) return
        // If the browser takes 3D away, the page shows the plain placeholder instead.
        const stage = createStage(canvas, { interactive: true, reducedMotion, lighting: 'cinematic', onContextLost: mark3DUnavailable })
        stage.setLook(lookRef.current)
        stage.setSpin(spinRef.current && !reducedMotion ? 0.5 : 0)
        if (focusRef.current) stage.focus(focusRef.current)
        stageRef.current = stage
        observer = new ResizeObserver(() => stage.resize())
        observer.observe(canvas)
        // Nothing is drawn while the character is scrolled out of view.
        watcher = new IntersectionObserver(([entry]) => stage.setActive(entry.isIntersecting))
        watcher.observe(canvas)
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
      stageRef.current?.dispose()
      stageRef.current = null
    }
  }, [])

  // A new pose only retargets the bones, so it blends; anything else rebuilds the character.
  const { pose, ...shape } = look
  const shapeKey = JSON.stringify(shape)
  const builtKey = useRef(shapeKey)
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    if (builtKey.current !== shapeKey) {
      builtKey.current = shapeKey
      stage.setLook(lookRef.current)
    } else {
      stage.setPose(pose)
    }
  }, [shapeKey, pose])

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    stageRef.current?.setSpin(spin && !reducedMotion ? 0.5 : 0)
  }, [spin])

  useEffect(() => {
    stageRef.current?.focus(focus)
  }, [focus])

  return (
    <canvas
      ref={canvasRef}
      data-testid="avatar-3d-stage"
      data-focus={focus ?? undefined}
      role="img"
      aria-label={label ? `${label}. Drag to turn it.` : `3D ${look.race} character. Drag to turn it.`}
      className={cn('block h-full w-full', className)}
    />
  )
}
