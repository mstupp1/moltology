import React from 'react'
import { Link } from '@tanstack/react-router'
import { Atom, BookOpen, FlaskConical, LayoutGrid, Scroll, ShoppingCart, Sliders, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DASHBOARD_FOCUS, DashboardPanel } from './DashboardPanel'

export interface DashboardShortcut {
  id: string
  label: string
  description: string
  to: string
  icon: LucideIcon
}

/** Same names and order as the sidebar, so the dashboard and the nav never disagree. */
export const DASHBOARD_SHORTCUTS: DashboardShortcut[] = [
  { id: 'oracle', label: 'Oracle', description: 'Ask for doctrine, calibration or molt advice.', to: '/oracle', icon: Atom },
  { id: 'codex', label: 'Codex', description: 'Read the scriptures, one stage at a time.', to: '/codex', icon: Scroll },
  { id: 'academy', label: 'Academy', description: 'Courses and lectures for the next shed.', to: '/lectures', icon: BookOpen },
  { id: 'science', label: 'Science', description: 'How the stages and clearances work.', to: '/pipeline', icon: FlaskConical },
  { id: 'chassis', label: 'Gear', description: 'Equip your gear and cosmetics.', to: '/chassis', icon: Sliders },
  { id: 'market', label: 'Market', description: 'Molt Credits, shed exchange and cosmetics.', to: '/market', icon: ShoppingCart },
]

export function DashboardShortcuts() {
  return (
    <DashboardPanel
      icon={<LayoutGrid />}
      title="Explore"
      subtitle="The rest of the facility, one step away."
      data-testid="dashboard-shortcuts"
    >
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-2">
        {DASHBOARD_SHORTCUTS.map(({ id, label, description, to, icon: Icon }) => (
          <li key={id} className="min-w-0">
            <Link
              to={to}
              data-testid={`dashboard-shortcut-${id}`}
              className={cn(
                'group h-full flex items-start gap-3 rounded-control border border-line-subtle bg-abyss/40 p-3',
                'transition-[background-color,border-color,box-shadow] duration-200 hover:bg-surface-3 hover:border-transparent hover:shadow-nav-current',
                'focus-visible:bg-surface-3 focus-visible:shadow-nav-current',
                DASHBOARD_FOCUS,
              )}
            >
              <span
                className="w-8 h-8 shrink-0 rounded-control bg-surface-3 flex items-center justify-center text-ink-muted group-hover:text-cyan-glow group-focus-visible:text-cyan-glow transition-colors"
                aria-hidden="true"
              >
                <Icon className="w-4 h-4" />
              </span>
              <span className="min-w-0 flex flex-col gap-0.5">
                <span className="text-sm font-bold text-ink leading-snug">{label}</span>
                <span className="text-xs text-ink-muted leading-snug">{description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </DashboardPanel>
  )
}
