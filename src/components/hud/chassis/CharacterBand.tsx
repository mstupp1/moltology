import React from 'react'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useDailyAlignment } from '@/hooks/useDailyAlignment'
import { useWalletBalances } from '@/hooks/useWalletBalances'
import { getAssetUrl } from '@/lib/assets'
import { PIPELINE_CLEARANCES, clearanceIndexForXp } from '@/lib/pipeline-explorer'
import { cn } from '@/lib/utils'
import { CharacterSectionNav, type CharacterSection } from './CharacterSectionNav'

/**
 * The one header for every Character tab (Customize, Shop, Progress). It lives in the
 * /character layout route, so switching tabs swaps only the content below it.
 * Shows the wallet (members only), XP and stage in the title row, compact on phones.
 */
export function CharacterBand({ current, className }: { current: CharacterSection; className?: string }) {
  return (
    <HudTitlePanel
      treatment="band"
      title="Character"
      sections={<CharacterSectionNav current={current} />}
      actions={<CharacterStats />}
      className={className}
      data-testid="character-band"
    />
  )
}

export function CharacterStats() {
  const { userId, isGuest, isPending } = useAuthSession()
  const member = !isPending && !isGuest && Boolean(userId)
  const wallet = useWalletBalances(member ? userId : null)
  const xp = useDailyAlignment().progression.xp
  const clearance = PIPELINE_CLEARANCES[clearanceIndexForXp(xp)]
  // Credits read "Soon" until purchases open, unless the member already holds some.
  const credits = wallet ? (wallet.creditsLive || wallet.credits > 0 ? format(wallet.credits) : 'Soon') : '—'
  return (
    <div
      role="group"
      aria-label="Your character"
      data-testid="character-stats"
      className="flex items-center gap-x-3 md:gap-x-5"
    >
      {member ? (
        <>
          <Stat label="Chitin Gems" icon="/images/chitin_gem.png" value={wallet ? format(wallet.gems) : '—'} testId="gem-balance" />
          <Stat label="Molt Credits" icon="/images/molt_credit.png" value={credits} />
        </>
      ) : null}
      <Stat label="XP" value={format(xp)} unit="XP" />
      <Stat
        label="Stage"
        value={clearance.code}
        tone="cyan"
        title={`Stage ${clearance.stageNum}, ${clearance.stage.stageTitle}. Clearance ${clearance.code}.`}
      />
    </div>
  )
}

function format(value: number): string {
  return Math.max(0, Math.floor(value)).toLocaleString('en-US')
}

/** Label then value on one line from md up; phones show only the icon or unit and the value. */
function Stat({
  label,
  value,
  icon,
  unit,
  tone = 'ink',
  title,
  testId,
}: {
  label: string
  value: string
  icon?: string
  unit?: string
  tone?: 'ink' | 'cyan'
  title?: string
  testId?: string
}) {
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap" title={title ?? label}>
      {/* The label leads on wide screens; for screen readers it always names the figure. */}
      <span className={cn('text-xs text-ink-muted', unit ? 'sr-only' : 'max-md:sr-only')}>{label}</span>
      {icon ? <img src={getAssetUrl(icon)} alt="" className="w-4 h-4 object-contain shrink-0" /> : null}
      <span
        className={cn(
          'font-grotesk text-ui md:text-md font-semibold leading-tight tabular-nums',
          tone === 'cyan' ? 'text-cyan-glow' : 'text-ink',
        )}
        data-testid={testId}
      >
        {value}
        {unit ? <span aria-hidden="true">{` ${unit}`}</span> : null}
      </span>
    </div>
  )
}
