import React from 'react'
import {
  LayoutDashboard,
  Scroll,
  BookOpen,
  ShoppingBag,
  Sparkles,
  Layers,
  Users,
  MessagesSquare,
  LifeBuoy,
  CircleUser,
  Shell,
  Activity,
  Flame,
  Atom,
  ShieldAlert,
  Newspaper,
  Eye,
  ShieldCheck,
  Settings,
} from 'lucide-react'
import type { CommandIconId } from '@/lib/command-catalog'

const ICON_CLASS = 'w-4 h-4'

export function CommandCatalogIcon({ icon }: { icon: CommandIconId }) {
  switch (icon) {
    case 'dashboard':
      return <LayoutDashboard className={`${ICON_CLASS} text-cyan-glow`} />
    case 'codex':
      return <Scroll className={`${ICON_CLASS} text-[#ffd700]`} />
    case 'lectures':
      return <BookOpen className={`${ICON_CLASS} text-cyan-glow`} />
    case 'market':
      return <ShoppingBag className={`${ICON_CLASS} text-emerald-400`} />
    case 'premium':
      return <Sparkles className={`${ICON_CLASS} text-cyan-glow`} />
    case 'pipeline':
      return <Layers className={`${ICON_CLASS} text-purple-400`} />
    case 'forum':
      return <MessagesSquare className={`${ICON_CLASS} text-cyan-glow`} />
    case 'stream':
      return <Activity className={`${ICON_CLASS} text-cyan-glow`} />
    case 'landing':
      return <Flame className={`${ICON_CLASS} text-red-500`} />
    case 'support':
      return <LifeBuoy className={`${ICON_CLASS} text-cyan-400`} />
    case 'oracle':
      return <Atom className={`${ICON_CLASS} text-cyan-glow`} />
    case 'connections':
      return <Users className={`${ICON_CLASS} text-cyan-glow`} />
    case 'chassis':
      return <Shell className={`${ICON_CLASS} text-cyan-300`} />
    case 'isolation':
      return <ShieldAlert className={`${ICON_CLASS} text-[#39ff14]`} />
    case 'news':
      return <Newspaper className={`${ICON_CLASS} text-cyan-glow`} />
    case 'watch':
      return <Eye className={`${ICON_CLASS} text-cyan-glow`} />
    case 'admin':
      return <ShieldCheck className={`${ICON_CLASS} text-cyan-glow`} />
    case 'settings':
      return <Settings className={`${ICON_CLASS} text-cyan-400`} />
    case 'profile':
      return <CircleUser className={`${ICON_CLASS} text-cyan-glow`} />
    default:
      return <LayoutDashboard className={`${ICON_CLASS} text-cyan-400`} />
  }
}
