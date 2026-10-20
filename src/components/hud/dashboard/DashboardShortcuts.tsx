import React from 'react'
import { Link } from '@tanstack/react-router'
import { Atom, BookOpen, FlaskConical, LayoutGrid, Scroll, ShoppingCart, Sliders, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DASHBOARD_FOCUS } from './DashboardPanel'

export interface DashboardShortcut {
  id: string
  label: string
  description: string
  to: string
  icon: LucideIcon
}

/** Same names and order as the sidebar, so the dashboard and the nav never disagree. */
export const DASHBOARD_SHORTCUTS: DashboardShortcut[] = [
  { id: 'oracle', label: 'Synaptic Oracle', description: 'Ask for doctrine, calibration or molt advice.', to: '/oracle', icon: Atom },
  { id: 'codex', label: 'Sacred Codex', description: 'Read the scriptures, one stage at a time.', to: '/codex', icon: Scroll },
  { id: 'academy', label: 'Molt Academy', description: 'Courses and lectures for the next shed.', to: '/lectures', icon: BookOpen },
  { id: 'science', label: 'Moltology Science', description: 'How the stages and clearances work.', to: '/pipeline', icon: FlaskConical },
  { id: 'market', label: 'The Market', description: 'Molt Credits, shed exchange and cosmetics.', to: '/market', icon: ShoppingCart },
  { id: 'chassis', label: 'Chassis', description: 'Seat your gear and read your loadout.', to: '/chassis', icon: Sliders },
]

export function DashboardShortcuts() {
  return (
    <section aria-labelledby="dashboard-shortcuts-heading" className="space-y-2.5" data-testid="dashboard-shortcuts">
      <h2
        id="dashboard-shortcuts-heading"
        className="flex items-center gap-2 font-grotesk text-sm font-bold text-ink tracking-[0.08em] uppercase"
      >
        <LayoutGrid className="w-4 h-4 text-cyan-glow" aria-hidden="true" />
        Explore
      </h2>
      <ul className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-2">
        {DASHBOARD_SHORTCUTS.map(({ id, label, description, to, icon: Icon }) => (
          <li key={id} className="min-w-0">
            <Link
              to={to}
              data-testid={`dashboard-shortcut-${id}`}
              className={cn(
                'group h-full min-h-[88px] flex flex-col gap-1.5 rounded-card border border-line-subtle bg-surface-1 hud-sheen p-3',
                'transition-[background-color,border-color,box-shadow] duration-200 hover:bg-surface-3 hover:border-transparent hover:shadow-nav-current',
                'focus-visible:bg-surface-3 focus-visible:shadow-nav-current',
                DASHBOARD_FOCUS,
              )}
            >
              <Icon
                className="w-4 h-4 text-ink-muted group-hover:text-cyan-glow group-focus-visible:text-cyan-glow transition-colors"
                aria-hidden="true"
              />
              <span className="font-grotesk text-xs font-bold text-ink tracking-[0.08em] uppercase leading-tight">{label}</span>
              <span className="text-xs text-ink-muted leading-snug">{description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
