import React, { useState, useEffect, useId } from 'react'
import {
  Dices,
  RotateCw,
  Sparkles,
  Shield,
  Zap,
  Activity,
  Anchor,
  Crosshair,
  Sliders,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react'
import {
  generateLobsterAvatarDataUri,
  LOBSTER_AVATAR_STYLE,
  randomLobsterSeed,
  type LobsterAvatarConfig,
} from '@/lib/lobster-avatar'
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

export interface CharacterCreationStepProps {
  initialSeed?: string
  initialStats?: BaseStats
  onBack: () => void
  onComplete: (config: LobsterAvatarConfig, stats: BaseStats) => void
  isSubmitting?: boolean
}

const PRESET_SEEDS = [
  { name: 'Crimson Vanguard', seed: 'larva-crimson-vanguard' },
  { name: 'Deep Abyssal', seed: 'larva-deep-abyssal' },
  { name: 'Subterranean', seed: 'larva-subterranean-hydro' },
  { name: 'Solar Coral', seed: 'larva-solar-coral' },
  { name: 'Cyber Apex', seed: 'larva-cyber-apex' },
]

export const CharacterCreationStep: React.FC<CharacterCreationStepProps> = ({
  initialSeed,
  initialStats,
  onBack,
  onComplete,
  isSubmitting = false,
}) => {
  const seedInputId = useId()
  const [seed, setSeed] = useState(() => initialSeed || randomLobsterSeed())
  const [avatarDataUri, setAvatarDataUri] = useState<string | null>(null)
  const [isSpinningSeed, setIsSpinningSeed] = useState(false)

  const [stats, setStats] = useState<BaseStats>(() => initialStats || DEFAULT_BASE_STATS)
  const [displayStats, setDisplayStats] = useState<BaseStats>(() => initialStats || DEFAULT_BASE_STATS)
  const [isRolling, setIsRolling] = useState(false)

  // Update avatar data URI whenever seed changes
  useEffect(() => {
    const config: LobsterAvatarConfig = {
      style: LOBSTER_AVATAR_STYLE,
      seed: seed.trim() || 'larva-initiate',
    }
    const uri = generateLobsterAvatarDataUri(config, 320)
    setAvatarDataUri(uri)
  }, [seed])

  // Handle avatar re-roll
  const handleRandomizeCarapace = () => {
    setIsSpinningSeed(true)
    const newSeed = randomLobsterSeed()
    setSeed(newSeed)
    setTimeout(() => setIsSpinningSeed(false), 400)
  }

  // Handle dice stat rolling with cyber rolling animation
  const handleRollStats = () => {
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
  }

  // Nudge individual stat
  const handleNudgeStat = (key: StatKey, delta: number) => {
    if (isRolling) return
    const updated = adjustStat(stats, key, delta)
    setStats(updated)
    setDisplayStats(updated)
  }

  const archetype = getDominantArchetype(displayStats)
  const totalSum = calculateStatSum(displayStats)

  const handleFinish = () => {
    const avatarConfig: LobsterAvatarConfig = {
      style: LOBSTER_AVATAR_STYLE,
      seed: seed.trim() || 'larva-initiate',
    }
    onComplete(avatarConfig, stats)
  }

  return (
    <div className="flex flex-col h-full font-sans text-[#dfe3e3]">
      {/* Header Banner */}
      <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-3 text-center border-b border-[#00ffff]/15 bg-[#030a0d]/60">
        <div className="font-sans text-[10px] tracking-[0.3em] text-[#00ffff]/60 uppercase mb-1">
          ⬡ STEP 02 · CARAPACE REGISTRATION & BIOMETRICS ⬡
        </div>
        <h2
          className="font-grotesk text-lg sm:text-2xl font-bold text-[#00ffff] tracking-tight"
          style={{ textShadow: '0 0 20px rgba(0,255,255,0.4)' }}
        >
          CALIBRATE LARVAL CHASSIS
        </h2>
        <p className="text-[#7ea6a6] text-xs max-w-md mx-auto mt-0.5">
          Select your cyber-crustacean carapace avatar and roll base biometrics before entering the Synaptic Core.
        </p>
      </div>

      {/* Main Two-Column Layout */}
      <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 overflow-y-auto flex-1">
        {/* LEFT COLUMN: Avatar Selection (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center space-y-4">
          {/* Avatar Hologram Card */}
          <div
            className="relative w-full aspect-square max-w-[260px] sm:max-w-[290px] rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center border border-[#00ffff]/30 bg-[#020b12]/90 overflow-hidden group shrink-0"
            style={{
              boxShadow:
                '0 0 30px rgba(0,255,255,0.12), inset 0 0 25px rgba(0,255,255,0.06)',
            }}
          >
            {/* Tech Corner Reticles */}
            <div className="absolute top-2 left-2 text-[10px] text-[#00ffff]/40 font-mono">┌</div>
            <div className="absolute top-2 right-2 text-[10px] text-[#00ffff]/40 font-mono">┐</div>
            <div className="absolute bottom-2 left-2 text-[10px] text-[#00ffff]/40 font-mono">└</div>
            <div className="absolute bottom-2 right-2 text-[10px] text-[#00ffff]/40 font-mono">┘</div>

            {/* Glowing Reticle Rings in background */}
            <div className="absolute w-52 h-52 rounded-full border border-[#00ffff]/10 pointer-events-none animate-pulse" />
            <div className="absolute w-36 h-36 rounded-full border border-[#00ffff]/15 pointer-events-none" />

            {/* Live Avatar Preview */}
            {avatarDataUri ? (
              <img
                src={avatarDataUri}
                alt="Carapace Avatar Preview"
                className="relative z-10 w-40 h-40 sm:w-48 sm:h-48 object-contain transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-40 h-40 rounded-full bg-[#051520] animate-pulse" />
            )}

            {/* Badge Tag */}
            <div className="absolute bottom-2.5 z-10 px-2.5 py-0.5 rounded-full bg-[#00ffff]/15 border border-[#00ffff]/40 text-[9px] font-mono tracking-widest text-[#00ffff] uppercase">
              CHASSIS VERIFIED
            </div>
          </div>

          {/* Avatar Actions */}
          <div className="w-full max-w-[290px] space-y-2.5">
            {/* Re-Roll Carapace Button */}
            <button
              onClick={handleRandomizeCarapace}
              className="w-full py-2.5 px-3 rounded-xl border border-[#00ffff]/40 bg-[#00ffff]/10 hover:bg-[#00ffff]/20 hover:border-[#00ffff] text-[#00ffff] text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-[0_0_15px_rgba(0,255,255,0.15)]"
            >
              <RotateCw
                className={`w-3.5 h-3.5 ${isSpinningSeed ? 'animate-spin' : ''}`}
              />
              Re-Roll Carapace Look
            </button>

            {/* Preset Quick Swatches */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#5a8888] uppercase tracking-wider block">
                Quick Chassis Variations:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SEEDS.map((preset) => (
                  <button
                    key={preset.seed}
                    onClick={() => setSeed(preset.seed)}
                    className={`px-2 py-1 rounded text-[10px] font-sans border transition-all ${
                      seed === preset.seed
                        ? 'border-[#00ffff] bg-[#00ffff]/20 text-[#00ffff] font-semibold'
                        : 'border-[#00ffff]/20 bg-[#051520]/50 text-[#8ca8a8] hover:border-[#00ffff]/50 hover:text-[#dfe3e3]'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Seed Input */}
            <div className="pt-1">
              <label htmlFor={seedInputId} className="text-[10px] font-mono text-[#5a8888] uppercase tracking-wider block mb-1">
                Custom Seed Designation:
              </label>
              <input
                id={seedInputId}
                type="text"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                maxLength={64}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#040f17] border border-[#00ffff]/25 text-xs text-[#00ffff] font-mono focus:outline-none focus:border-[#00ffff] transition-colors"
                placeholder="larva-designation..."
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Base Stats Dice Roller (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
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
          disabled={isSubmitting || isRolling}
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
