import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useHeavyVfx } from '@/hooks/useHeavyVfx'
import { getAssetUrl } from '@/lib/assets'
import type { AlignmentTaskItem } from '@/lib/alignment-tasks'
import { CHAMBER_SOCKETS, FLAME_PHASE_FRAMES, FLAME_LOOP_SECONDS, FLAME_FRAME_COUNT } from './layout'
import './chamber.css'

const CHAMBER_IMAGE = getAssetUrl('images/hud/alignment/chamber-v1.png')
const FLAME_SHEET = getAssetUrl('images/hud/alignment/synaptic-flame-loop-v3.png')

/** Detailed chamber artwork with registered synaptic flame loops. No canvas or GPU scene. */
export function AlignmentChamber({ tasks }: { tasks: AlignmentTaskItem[] }) {
  const { heavyVfxDisabled } = useHeavyVfx()
  const hostRef = useRef<HTMLDivElement>(null)
  const [motionAllowed, setMotionAllowed] = useState(false)
  const completed = tasks.filter((task) => task.completed).length

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let visible = typeof IntersectionObserver === 'undefined'
    const sync = () => setMotionAllowed(visible && !document.hidden && !motion.matches)
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      sync()
    })
    if (hostRef.current) observer?.observe(hostRef.current)
    sync()
    motion.addEventListener('change', sync)
    document.addEventListener('visibilitychange', sync)
    return () => {
      observer?.disconnect()
      motion.removeEventListener('change', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])

  return (
    <div ref={hostRef} className="alignment-chamber rounded-control border border-line-subtle bg-abyss overflow-hidden" data-motion={!heavyVfxDisabled && motionAllowed ? 'animated' : 'static'}>
      <div role="img" aria-label={`Alignment chamber: ${completed} of ${tasks.length} ritual flames lit.`} className="alignment-chamber-art">
        <div className="alignment-chamber-scene">
          <img src={CHAMBER_IMAGE} alt="" draggable={false} className="alignment-chamber-background" />
          {CHAMBER_SOCKETS.map((socket, index) => {
            const task = tasks[index]
            return (
              <span key={task?.key ?? index} data-socket={task?.key ?? index} data-completed={task?.completed ?? false}
                className="alignment-chamber-socket" style={{ left: `${socket.x}%`, top: `${socket.y}%` }} aria-hidden="true">
                {task?.completed && <span className="alignment-chamber-flame" style={{ backgroundImage: `url("${FLAME_SHEET}")`, '--flame-delay': `${-FLAME_PHASE_FRAMES[index] * FLAME_LOOP_SECONDS / FLAME_FRAME_COUNT}s` } as CSSProperties} />}
              </span>
            )
          })}
        </div>
      </div>
      <div className="alignment-chamber-caption border-t border-line-subtle px-3 py-2 flex items-center justify-between gap-3 text-[11px] text-ink-muted">
        <span>Today’s ritual</span>
        <span className="tabular-nums">{completed} of {tasks.length} completed</span>
      </div>
    </div>
  )
}
