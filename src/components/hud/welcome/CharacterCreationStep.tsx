import React, { useState, useMemo, useCallback } from 'react'
import {
  Dices,
  RotateCw,
  Sparkles,
  ChevronLeft,
  CheckCircle2,
} from 'lucide-react'
import {
  LOBSTER_AVATAR_STYLE,
  lockAvatarConfig,
  randomLobsterSeed,
  type LobsterAvatarConfig,
} from '@/lib/lobster-avatar'
import { AvatarCreatorPanel } from '../avatar/AvatarCreatorPanel'
import { AvatarCreatorPreview } from '../avatar/AvatarCreatorPreview'
import {
  adjustStat,
  calculateStatSum,
  DEFAULT_BASE_STATS,
  getDominantArchetype,
  rollBaseStats,
  STAT_KEYS,
  STAT_MAX,
  STAT_METAS,
  STAT_MIN,
  TOTAL_STAT_POINTS,
  type BaseStats,
  type StatKey,
} from '@/lib/stats-roller'
import { parseMemberHandle } from '@/lib/member-handle'
import { DesignationField } from '../DesignationField'

export interface CharacterCreationStepProps {
  initialSeed?: string
  /** A saved or in-progress character to keep editing. */
  initialConfig?: LobsterAvatarConfig | null
  initialStats?: BaseStats
  initialHandle?: string
  requireHandle?: boolean
  onBack: () => void
  onComplete: (config: LobsterAvatarConfig, stats: BaseStats, handle: string | null) => void
  isSubmitting?: boolean
}

export const CharacterCreationStep: React.FC<CharacterCreationStepProps> = ({
  initialSeed,
  initialConfig,
  initialStats,
  initialHandle = '',
  requireHandle = true,
  onBack,
  onComplete,
  isSubmitting = false,
}) => {
  const [avatarConfig, setAvatarConfig] = useState<LobsterAvatarConfig>(
    () => initialConfig ?? { style: LOBSTER_AVATAR_STYLE, seed: initialSeed || randomLobsterSeed() }
  )
  const [handle, setHandle] = useState(initialHandle)

  const [stats, setStats] = useState<BaseStats>(() => initialStats || DEFAULT_BASE_STATS)
  const [displayStats, setDisplayStats] = useState<BaseStats>(() => initialStats || DEFAULT_BASE_STATS)
  const [isRolling, setIsRolling] = useState(false)

  // Handle dice stat rolling with cyber rolling animation
  const handleRollStats = useCallback(() => {
    if (isRolling) return
    setIsRolling(true)

    const finalRoll = rollBaseStats()

    // Fluctuating numbers animation for ~500ms
    let ticks = 0
    const interval = setInterval(() => {
      ticks++
      setDisplayStats(rollBaseStats())
      if (ticks >= 6) {
        clearInterval(interval)
        setStats(finalRoll)
        setDisplayStats(finalRoll)
        setIsRolling(false)
      }
    }, 80)
  }, [isRolling])

  // Nudge individual stat
  const handleNudgeStat = useCallback((key: StatKey, delta: number) => {
    if (isRolling) return
    setStats((prev) => {
      const updated = adjustStat(prev, key, delta)
      setDisplayStats(updated)
      return updated
    })
  }, [isRolling])

  const archetype = useMemo(() => getDominantArchetype(displayStats), [displayStats])
  const totalSum = useMemo(() => calculateStatSum(displayStats), [displayStats])

  const parsedHandle = useMemo(() => parseMemberHandle(handle), [handle])
  const handleReady = !requireHandle || parsedHandle.ok

  const handleFinish = useCallback(() => {
    if (requireHandle && !parsedHandle.ok) return
    onComplete(lockAvatarConfig(avatarConfig), stats, parsedHandle.ok ? parsedHandle.handle : handle.trim() || null)
  }, [avatarConfig, stats, onComplete, requireHandle, parsedHandle, handle])

  return (
    <div className="flex flex-col h-full font-sans text-[#dfe3e3]">
      {/* Header Banner */}
      <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-3 text-center border-b border-[#00ffff]/15 bg-[#030a0d]/60">
        <div className="font-sans text-[10px] tracking-[0.3em] text-[#00ffff]/60 uppercase mb-1">
          Step 2 · Character and biometrics
        </div>
        <h2
          className="font-grotesk text-lg sm:text-2xl font-bold text-[#00ffff] tracking-tight"
          style={{ textShadow: '0 0 20px rgba(0,255,255,0.4)' }}
        >
          Build your crustacean
        </h2>
        <p className="text-[#7ea6a6] text-xs max-w-md mx-auto mt-0.5">
          Pick a lobster or a crab, dress the shell, then roll your base biometrics. You can change your look later in Settings.
        </p>
      </div>

      {/* Main Two-Column Layout */}
      <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 overflow-y-auto flex-1">
        {/* LEFT COLUMN: Character creator (6 cols) */}
        <div className="lg:col-span-6 flex flex-col items-center gap-3">
          <AvatarCreatorPreview config={avatarConfig} className="max-w-[300px]" />
          <AvatarCreatorPanel value={avatarConfig} onChange={setAvatarConfig} disabled={isSubmitting} />
        </div>

        {/* RIGHT COLUMN: Designation and base stats (6 cols) */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          <DesignationField value={handle} onChange={setHandle} disabled={isSubmitting} />

          {/* Top Bar: Rolling Action & Pool Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-[#04111a]/80 border border-[#00ffff]/20">
            <div>
              <div className="flex items-center gap-1.5">
                <Dices className="w-4 h-4 text-[#00ffff]" />
                <span className="font-grotesk text-xs font-bold text-[#dfe3e3] uppercase tracking-wider">
                  Base Biometrics Roller
                </span>
              </div>
              <div className="text-[10px] font-mono text-[#5a8888]">
                TOTAL POOL:{' '}
                <span className="text-[#00ffff] font-semibold">
                  {totalSum} / {TOTAL_STAT_POINTS} PTS
                </span>{' '}
                (STRICT SUM)
              </div>
            </div>

            <button
              onClick={handleRollStats}
              disabled={isRolling}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gradient-to-r from-[#00ffff]/20 to-[#00c8ff]/20 hover:from-[#00ffff]/30 hover:to-[#00c8ff]/30 border border-[#00ffff]/50 text-[#00ffff] text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_15px_rgba(0,255,255,0.2)] disabled:opacity-60"
            >
              <Dices className={`w-4 h-4 ${isRolling ? 'animate-bounce text-[#ff5540]' : ''}`} />
              {isRolling ? 'Rolling Dice...' : 'Roll Base Stats'}
            </button>
          </div>

          {/* Dynamic Archetype Banner */}
          <div
            className="p-3 rounded-xl border flex items-start gap-3 transition-all duration-300"
            style={{
              borderColor: `${archetype.color}55`,
              background: `linear-gradient(135deg, ${archetype.color}12 0%, rgba(2,10,16,0.9) 100%)`,
              boxShadow: `0 0 20px ${archetype.color}15`,
            }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
              style={{
                borderColor: `${archetype.color}60`,
                background: `${archetype.color}20`,
                color: archetype.color,
              }}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="font-grotesk text-xs sm:text-sm font-bold uppercase tracking-wider"
                  style={{ color: archetype.color }}
                >
                  {archetype.title}
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-black/40 text-[#8ca8a8] border border-white/10 uppercase">
                  PRIMARY SPEC
                </span>
              </div>
              <p className="text-[11px] text-[#9bbbbb] mt-0.5 leading-snug">
                {archetype.description}
              </p>
            </div>
          </div>

          {/* 5 Chassis Hardpoint Stat Bars */}
          <div className="space-y-2.5">
            {STAT_KEYS.map((key) => {
              const meta = STAT_METAS[key]
              const val = displayStats[key]
              const percent = Math.round(((val - 30) / (90 - 30)) * 100)
              const isDominant = archetype.dominantStat === key

              return (
                <div
                  key={key}
                  className={`p-2.5 rounded-lg border transition-all ${
                    isDominant
                      ? 'bg-[#00ffff]/5 border-[#00ffff]/30'
                      : 'bg-[#030d14]/60 border-[#00ffff]/10'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-grotesk text-[11px] font-bold tracking-wider text-[#dfe3e3]">
                        {meta.label}
                      </span>
                      <span className="text-[9px] font-mono text-[#00ffff]/70 uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#00ffff]/10 border border-[#00ffff]/20">
                        {meta.slotLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Nudge - Button */}
                      <button
                        onClick={() => handleNudgeStat(key, -1)}
                        disabled={val <= STAT_MIN || isRolling}
                        className="w-5 h-5 rounded flex items-center justify-center text-[11px] font-mono bg-[#051824] hover:bg-[#00ffff]/20 border border-[#00ffff]/20 text-[#8ca8a8] hover:text-[#00ffff] disabled:opacity-30 disabled:pointer-events-none"
                        title="Deduct 1 point"
                      >
                        -
                      </button>

                      {/* Stat Numerical Value */}
                      <span
                        className="font-mono text-xs font-bold tabular-nums min-w-[2.2rem] text-right"
                        style={{ color: meta.color }}
                      >
                        {val}
                      </span>

                      {/* Nudge + Button */}
                      <button
                        onClick={() => handleNudgeStat(key, 1)}
                        disabled={val >= STAT_MAX || isRolling}
                        className="w-5 h-5 rounded flex items-center justify-center text-[11px] font-mono bg-[#051824] hover:bg-[#00ffff]/20 border border-[#00ffff]/20 text-[#8ca8a8] hover:text-[#00ffff] disabled:opacity-30 disabled:pointer-events-none"
                        title="Add 1 point"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Progress Meter Bar */}
                  <div className="relative h-2 rounded-full bg-[#02080d] border border-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(0, percent))}%`,
                        backgroundColor: meta.color,
                        boxShadow: `0 0 10px ${meta.color}80`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="px-4 sm:px-8 py-3 sm:py-4 border-t border-[#00ffff]/15 bg-[#030a0d]/90 flex items-center justify-between gap-3 mt-auto">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-xl border border-[#00ffff]/30 bg-[#00ffff]/5 hover:bg-[#00ffff]/15 text-[#8ca8a8] hover:text-[#00ffff] text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5 transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          Transmission
        </button>

        <button
          onClick={handleFinish}
          disabled={isSubmitting || isRolling || !handleReady}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00ffff]/25 via-[#00e5ff]/20 to-[#00c8ff]/25 hover:from-[#00ffff]/40 hover:to-[#00c8ff]/40 border border-[#00ffff]/60 text-[#00ffff] text-xs sm:text-sm font-bold tracking-widest uppercase flex items-center gap-2 transition-all duration-200 active:scale-95 shadow-[0_0_25px_rgba(0,255,255,0.25)] disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin" />
              Synchronizing...
            </>
          ) : (
            <>
              Confirm & Enter Synaptic Core
              <CheckCircle2 className="w-4 h-4 text-[#00ffff]" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
