import React from 'react'
import { Link } from '@tanstack/react-router'
import { GraduationCap } from 'lucide-react'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { ACADEMY_COPY, levelLabel } from '@/lib/academy'
import type { AcademyLevel } from '@/lib/academy-types'
import { cn } from '@/lib/utils'
import { getAssetUrl } from '@/lib/assets'

export function AcademyFrame({ children }: { children: React.ReactNode }) {
  return (
    <GuestLockGuard featureName="Molt Academy" message={ACADEMY_COPY.guestLock}>
      <div className="space-y-3.5 sm:space-y-5 font-sans relative">{children}</div>
    </GuestLockGuard>
  )
}

export function AcademyNav({ current }: { current: 'catalog' | 'certificates' }) {
  const linkClass = (active: boolean) =>
    cn(
      'px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest border chamfer-corner transition-colors',
      active
        ? 'border-[#00ffff]/70 text-[#00ffff] bg-[#00ffff]/10'
        : 'border-[#3a4a49] text-[#839493] hover:text-[#dfe3e3] hover:border-[#00c3ff]/40',
    )
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Academy">
      <Link to="/lectures" className={linkClass(current === 'catalog')}>
        Catalog
      </Link>
      <Link to="/lectures/certificates" className={linkClass(current === 'certificates')}>
        Certifications
      </Link>
    </nav>
  )
}

export function AcademyProgress({ percent }: { percent: number }) {
  const safe = Math.max(0, Math.min(100, percent))
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] uppercase tracking-widest text-[#839493]">
        <span>Progress</span>
        <span className="text-[#00ffff] font-bold">{safe}%</span>
      </div>
      <div className="h-1.5 bg-[#0b1212] border border-[#3a4a49]/70 overflow-hidden" aria-hidden="true">
        <div className="h-full bg-[#00ffff]" style={{ width: `${safe}%` }} />
      </div>
    </div>
  )
}

export function LevelMark({ level }: { level: AcademyLevel }) {
  return (
    <span className="text-[10px] uppercase tracking-widest text-[#00c3ff] font-bold">{levelLabel(level)}</span>
  )
}

export function AcademyEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="chitin-card p-4 sm:p-5 chamfer-corner text-sm text-[#b7c4c3] leading-relaxed">
      <div className="flex items-start gap-3">
        <GraduationCap className="w-5 h-5 text-[#00ffff] shrink-0 mt-0.5" />
        <p>{children}</p>
      </div>
    </div>
  )
}

export function AcademyMissing({ message }: { message: string }) {
  return (
    <AcademyFrame>
      <div className="chitin-card p-5 sm:p-6 chamfer-corner space-y-3">
        <p className="text-sm text-[#dfe3e3]">{message}</p>
        <Link to="/lectures" className="inline-flex text-xs font-bold uppercase tracking-widest text-[#00ffff] hover:text-white">
          Back to Academy
        </Link>
      </div>
    </AcademyFrame>
  )
}

export function coverSrc(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return getAssetUrl(url.replace(/^\//, ''))
}
