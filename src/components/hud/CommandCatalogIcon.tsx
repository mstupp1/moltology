import React from 'react'
import {
  LayoutDashboard,
  Scroll,
  BookOpen,
  ShoppingBag,
  Biohazard,
  Layers,
  Microscope,
  Users,
  Flame,
  Terminal,
  Zap,
} from 'lucide-react'
import type { CommandIconId } from '@/lib/command-catalog'

const ICON_CLASS = 'w-4 h-4'

export function CommandCatalogIcon({ icon }: { icon: CommandIconId }) {
  switch (icon) {
    case 'dashboard':
      return <LayoutDashboard className={`${ICON_CLASS} text-[#00ffff]`} />
    case 'codex':
      return <Scroll className={`${ICON_CLASS} text-[#ffd700]`} />
    case 'lectures':
      return <BookOpen className={`${ICON_CLASS} text-[#00ffff]`} />
    case 'market':
      return <ShoppingBag className={`${ICON_CLASS} text-emerald-400`} />
    case 'subterranean':
      return <Biohazard className={`${ICON_CLASS} text-[#39ff14]`} />
    case 'pipeline':
      return <Layers className={`${ICON_CLASS} text-purple-400`} />
    case 'journal':
      return <Microscope className={`${ICON_CLASS} text-[#00ffff]`} />
    case 'forum':
      return <Users className={`${ICON_CLASS} text-[#00ffff]`} />
    case 'landing':
      return <Flame className={`${ICON_CLASS} text-red-500`} />
    case 'support':
      return <Terminal className={`${ICON_CLASS} text-cyan-400`} />
    case 'purge':
      return <Zap className={`${ICON_CLASS} text-yellow-400`} />
    case 'scan':
      return <Terminal className={`${ICON_CLASS} text-cyan-400`} />
    default:
      return <Terminal className={`${ICON_CLASS} text-cyan-400`} />
  }
}
