import React, { useEffect, useRef } from 'react'
import type { Avatar3DLook, Stage } from '@/lib/avatar3d'
import { cn } from '@/lib/utils'

export interface Avatar3DStageProps {
  look: Avatar3DLook
  /** Turn slowly on its own until the visitor drags. */
  spin?: boolean
  className?: string
  /** What a screen reader announces. Defaults to a description of the species. */
  label?: string
}

/**
 * Live 3D character. The renderer loads only in the browser and only when this mounts, so pages
 * that never show a 3D character never download it.
 */
export function Avatar3DStage({ look, spin = false, className, label }: Avatar3DStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<Stage | null>(null)
  const lookRef = useRef(look)
  const spinRef = useRef(spin)
  lookRef.current = look
  spinRef.current = spin

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    let observer: ResizeObserver | null = null
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    void import('@/lib/avatar3d').then(({ createStage }) => {
      if (cancelled) return
      const stage = createStage(canvas, { interactive: true, reducedMotion })
      stage.setLook(lookRef.current)
      stage.setSpin(spinRef.current && !reducedMotion ? 0.5 : 0)
      stageRef.current = stage
      observer = new ResizeObserver(() => stage.resize())
      observer.observe(canvas)
    })
    return () => {
      cancelled = true
      observer?.disconnect()
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

  return (
    <canvas
      ref={canvasRef}
      data-testid="avatar-3d-stage"
      role="img"
      aria-label={label ? `${label}. Drag to turn it.` : `3D ${look.race} character. Drag to turn it.`}
      className={cn('block h-full w-full', className)}
    />
  )
}
