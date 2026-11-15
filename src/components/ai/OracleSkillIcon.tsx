import {
  Anchor,
  CalendarCheck,
  CalendarClock,
  CircleOff,
  Grid2x2,
  ListTree,
  MoonStar,
  ScrollText,
  ShieldHalf,
  Target,
  Timer,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { OracleSkillIconName } from '@/lib/oracle-skills'

const ICONS: Record<OracleSkillIconName, LucideIcon> = {
  anchor: Anchor,
  wind: Wind,
  'list-tree': ListTree,
  'moon-star': MoonStar,
  timer: Timer,
  target: Target,
  'calendar-clock': CalendarClock,
  'shield-half': ShieldHalf,
  'circle-off': CircleOff,
  zap: Zap,
  'grid-2x2': Grid2x2,
  'calendar-check': CalendarCheck,
}

/** A skill's own icon, or the scroll used for skills in general when it has none. */
export function OracleSkillIcon({ icon, className }: { icon?: string | null; className?: string }) {
  const Icon = (icon && ICONS[icon as OracleSkillIconName]) || ScrollText
  return <Icon className={className} aria-hidden="true" />
}
