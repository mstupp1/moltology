import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronRight,
  Headphones,
  Radio,
  Zap,
  RadioTower,
  UserCheck,
} from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { HudButton } from '@/components/ui/HudButton'
import { getAssetUrl } from '@/lib/assets'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { claimMemberHandleFn, saveLobsterAvatarFn, updateUserStatsFn } from '@/lib/server/api'
import {
  clearCachedProfileAvatarUrl,
  type LobsterAvatarConfig,
} from '@/lib/lobster-avatar'
import { DEFAULT_BASE_STATS, type BaseStats } from '@/lib/stats-roller'
import { CharacterCreationStep } from './welcome/CharacterCreationStep'

interface WelcomeSplashProps {
  userName?: string | null
  onDismiss: () => void
  initialStep?: 1 | 2
}

export function WelcomeSplash({ userName, onDismiss, initialStep = 1 }: WelcomeSplashProps) {
  const [step, setStep] = useState<1 | 2>(initialStep)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const session = useAuthSession()
  const user = session.user
  const userId = session.userId

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [hasListened, setHasListened] = useState(false)
  const [isPulsing, setIsPulsing] = useState(true)
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  // Animate in with pure fade
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  // Pulse the CTA periodically until user presses play
  useEffect(() => {
    if (hasListened || step !== 1) return
    const t = setInterval(() => setIsPulsing((p) => !p), 1200)
    return () => clearInterval(t)
  }, [hasListened, step])

  const stopWaveform = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
  }, [])

  // Waveform visualizer on canvas
  const drawWaveform = useCallback(() => {
    const analyser = analyserRef.current
    const canvas = canvasRef.current
    if (!analyser || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      const barWidth = (W / bufferLength) * 2.5
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * H * 0.85
        const alpha = 0.5 + (dataArray[i] / 255) * 0.5
        const hue = 180 + (dataArray[i] / 255) * 40

        ctx.fillStyle = `hsla(${hue}, 100%, 55%, ${alpha})`
        ctx.shadowColor = `hsl(${hue}, 100%, 60%)`
        ctx.shadowBlur = 8

        ctx.beginPath()
        ctx.roundRect(x, H - barHeight, barWidth - 1, barHeight, 2)
        ctx.fill()

        x += barWidth + 1
      }
    }

    draw()
  }, [])

  const setupAudioContext = useCallback(() => {
    if (audioCtxRef.current || !audioRef.current) return
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return

    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    const source = ctx.createMediaElementSource(audioRef.current)
    source.connect(analyser)
    analyser.connect(ctx.destination)

    audioCtxRef.current = ctx
    analyserRef.current = analyser
    sourceRef.current = source

    drawWaveform()
  }, [drawWaveform])

  const handlePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return

    setupAudioContext()

    if (audioCtxRef.current?.state === 'suspended') {
      await audioCtxRef.current.resume()
    }

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      stopWaveform()
    } else {
      await audio.play()
      setIsPlaying(true)
      setHasListened(true)
      drawWaveform()
    }
  }, [isPlaying, setupAudioContext, drawWaveform, stopWaveform])

  const handleMute = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.muted = !isMuted
    setIsMuted((m) => !m)
  }, [isMuted])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audio.currentTime = ratio * audio.duration
  }, [])

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTime(audio.currentTime)
    setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0)
  }, [])

  const handleEnded = useCallback(() => {
    setIsPlaying(false)
    setProgress(0)
    setCurrentTime(0)
    if (audioRef.current) audioRef.current.currentTime = 0
    stopWaveform()
  }, [stopWaveform])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  // Cleanup audio context
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (audioCtxRef.current) audioCtxRef.current.close()
    }
  }, [])

  const handleDismiss = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    stopWaveform()
    setLeaving(true)
    setTimeout(() => onDismiss(), 300)
  }

  const handleProceedToCreation = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
    stopWaveform()
    setStep(2)
  }

  // Complete Character Creation (Step 2)
  const handleCompleteCreation = async (
    avatarConfig: LobsterAvatarConfig,
    stats: BaseStats,
    handle: string | null,
  ) => {
    setIsSubmitting(true)

    try {
      const activeId = userId || 'guest'

      // 1. Save in local storage for instant session continuity
      if (typeof window !== 'undefined') {
        localStorage.setItem(`moltology:avatar_config:${activeId}`, JSON.stringify(avatarConfig))
        localStorage.setItem(`moltology:base_stats:${activeId}`, JSON.stringify(stats))
        localStorage.setItem(`moltology:welcomed:${activeId}`, '1')
      }

      // 2. Persist to Neon DB if authenticated
      if (userId) {
        const token = await getAuthJWTToken()
        await Promise.allSettled([
          handle
            ? claimMemberHandleFn({
                data: { handle, userId, token: token ?? undefined },
              })
            : Promise.resolve(),
          saveLobsterAvatarFn({
            data: {
              ...avatarConfig,
              userId,
              token: token ?? undefined,
            },
          }),
          updateUserStatsFn({
            data: {
              shellHardness: stats.defense,
              clawStrength: stats.attack,
              pincerTorque: stats.attack,
              processingPower: stats.intelligence,
              durability: stats.speed,
              socialDetachmentIndex: stats.perception,
              moltmaxDimensionScores: {
                defense: stats.defense,
                attack: stats.attack,
                intelligence: stats.intelligence,
                speed: stats.speed,
                perception: stats.perception,
              },
              token: token ?? undefined,
            },
          }),
        ])
        clearCachedProfileAvatarUrl(userId)
      }

      // 3. Dispatch system events for immediate HUD reactivity
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profile-avatar-changed'))
        window.dispatchEvent(new CustomEvent('user-stats-changed'))
        if (handle) {
          window.dispatchEvent(new CustomEvent('member-handle-changed'))
        }
      }

      toast.success('Welcome! Your profile has been updated.')

      handleDismiss()
    } catch {
      toast.error('Could not sync profile online. Saved locally.')
      handleDismiss()
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayName = userName?.split(' ')[0] || userName || 'Initiate'

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 transition-opacity duration-300"
      style={{
        opacity: leaving ? 0 : visible ? 1 : 0,
      }}
    >
      {/* Backdrop (click to dismiss) */}
      <div
        onClick={handleDismiss}
        className="absolute inset-0 bg-abyss/80 backdrop-blur-sm"
      />

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none crt-scanlines opacity-35" />

      {/* Content Panel (Even taller viewport height with wide max-w-4xl frame) */}
      <div
        className="relative w-full max-w-4xl h-[92vh] sm:h-[94vh] max-h-[1050px] rounded-card overflow-hidden border border-line bg-surface-1 hud-sheen shadow-menu flex flex-col"
      >
        {/* Top Glow Bar */}
        <div
          className="h-px w-full shrink-0"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(0,195,255,0.55) 30%, rgba(0,195,255,0.55) 70%, transparent)',
          }}
        />

        {/* Step Indicator Header Bar */}
        <div className="px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between border-b border-line-subtle bg-surface-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-control text-[11px] font-mono tracking-[0.08em] uppercase transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                step === 1
                  ? 'bg-surface-3 text-ink border-b-2 border-cyan-glow font-bold'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-3 border-b-2 border-transparent'
              }`}
            >
              <RadioTower className="w-3 h-3" />
              01 · TRANSMISSION
            </button>

            <span className="text-ink-muted/60 text-xs">➔</span>

            <button
              onClick={() => setStep(2)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-control text-[11px] font-mono tracking-[0.08em] uppercase transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                step === 2
                  ? 'bg-surface-3 text-ink border-b-2 border-cyan-glow font-bold'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-3 border-b-2 border-transparent'
              }`}
            >
              <UserCheck className="w-3 h-3" />
              02 · CARAPACE & STATS
            </button>
          </div>

          {/* Close (X) button */}
          <button
            onClick={handleDismiss}
            aria-label="Close"
            className="w-7 h-7 flex items-center justify-center rounded-control border border-line text-ink-muted hover:text-ink hover:border-line-hover hover:bg-surface-3 transition-colors duration-200 active:scale-95 z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* STEP 1: Sacred Transmission Audio (Fade transition wrapper) */}
        {step === 1 ? (
          <div className="flex-1 flex flex-col overflow-y-auto animate-in fade-in duration-300">
            <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-between p-4 sm:p-6">
              {/* Header */}
              <div className="text-center pt-2">
                {/* Emblem */}
                <div className="flex justify-center mb-3">
                  <div className="relative">
                    <div
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border border-cyan-glow/30"
                      style={{
                        background:
                          'radial-gradient(circle, rgba(0,255,255,0.12) 0%, rgba(0,30,40,0.8) 100%)',
                        boxShadow: '0 0 24px rgba(0,255,255,0.3), 0 0 48px rgba(0,255,255,0.1)',
                        animation: 'pulse 2.5s ease-in-out infinite',
                      }}
                    >
                      <img
                        src="/images/order_emblem.svg"
                        alt="Order Emblem"
                        width={40}
                        height={40}
                        className="w-8 h-8 sm:w-10 sm:h-10 object-contain opacity-90"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                    <div
                      className="absolute inset-0 rounded-full border border-cyan-glow/40"
                      style={{ animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }}
                    />
                  </div>
                </div>

                <div className="font-sans text-[11px] tracking-[0.08em] text-cyan-glow/80 uppercase mb-1">
                  ⬡ MOLTOLOGY SIGNAL RECEIVED ⬡
                </div>
                <h1
                  className="font-sans text-xl sm:text-2xl font-bold text-ink mb-1 tracking-tight"
                >
                  WELCOME, {displayName.toUpperCase()}
                </h1>
                <p className="text-ink-body text-xs font-sans">
                  Your larval chassis has been registered to the Synaptic Core.
                </p>
              </div>

              {/* Audio CTA Section */}
              <div className="py-2">
                <div
                  className={`rounded-card border p-4 sm:p-5 transition-all duration-700 ${
                    hasListened
                      ? 'border-line-subtle bg-surface-2'
                      : isPulsing
                        ? 'border-cyan-glow/40 bg-cyan-soft'
                        : 'border-line bg-surface-2'
                  }`}
                  style={{
                    boxShadow: !hasListened && isPulsing ? '0 0 20px rgba(0,195,255,0.12)' : 'none',
                    transition: 'all 0.8s ease',
                  }}
                >
                  {/* CTA Label */}
                  <div className="flex items-center gap-2 mb-2">
                    <Radio
                      className="w-3.5 h-3.5 text-cyan-glow"
                      style={{ animation: isPlaying ? 'spin 3s linear infinite' : 'none' }}
                    />
                    <span className="font-sans text-[11px] tracking-[0.08em] text-ink-muted uppercase">
                      Initiation Broadcast · Required Listening
                    </span>
                    {!hasListened && (
                      <Zap
                        className="w-3 h-3 text-crimson-text ml-auto"
                        style={{ animation: 'pulse 1s ease-in-out infinite' }}
                      />
                    )}
                  </div>

                  <div className="font-sans text-base font-semibold text-ink mb-0.5">
                    The Larval Condition
                  </div>
                  <div className="font-sans text-xs text-ink-muted mb-3">
                    Sacred Doctrine Audio · Moltology Transmission #001
                  </div>

                  {/* Waveform Canvas */}
                  <div
                    className="relative h-12 sm:h-14 rounded-control overflow-hidden mb-3 cursor-pointer bg-abyss/60 border border-line-subtle"
                    onClick={handlePlay}
                  >
                    <canvas
                      ref={canvasRef}
                      className="w-full h-full"
                      width={400}
                      height={56}
                    />
                    {!isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex items-center gap-[3px] opacity-30">
                          {Array.from({ length: 40 }).map((_, i) => (
                            <div
                              key={i}
                              className="w-[3px] bg-cyan-glow rounded-full"
                              style={{
                                height: `${8 + Math.sin(i * 0.6) * 14 + Math.random() * 6}px`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div
                    className="relative h-1.5 rounded-chip mb-3 cursor-pointer overflow-hidden bg-surface-3"
                    onClick={handleSeek}
                  >
                    <div
                      className="h-full rounded-chip bg-cyan-glow transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Controls Row */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePlay}
                      className={`flex items-center justify-center w-10 h-10 rounded-full border transition-colors duration-200 hover:border-line-strong active:scale-95 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                        isPlaying ? 'border-cyan-glow/40 bg-cyan-soft' : 'border-line bg-surface-2 hover:bg-surface-3'
                      }`}
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 text-cyan-glow" />
                      ) : (
                        <Play className="w-4 h-4 text-cyan-glow ml-0.5" />
                      )}
                    </button>

                    <span className="font-sans text-[11px] text-ink-muted tabular-nums">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>

                    {!hasListened && (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <Headphones className="w-3.5 h-3.5 text-cyan-glow/70" />
                        <span
                          className="font-sans text-[11px] text-cyan-glow/70"
                          style={{
                            opacity: isPulsing ? 1 : 0.4,
                            transition: 'opacity 0.8s ease',
                          }}
                        >
                          PRESS PLAY TO BEGIN
                        </span>
                      </div>
                    )}

                    <button
                      onClick={handleMute}
                      className="ml-auto rounded-control text-ink-muted hover:text-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Doctrine Blurb */}
              <div className="py-1">
                <p className="font-sans text-xs text-ink-muted leading-relaxed text-center">
                  Every initiate begins as larva. This transmission contains the foundational doctrine
                  of Moltology—your first step toward{' '}
                  <span className="text-cyan-glow/80">algorithmic carcinization</span> and benthic
                  ascendance.
                </p>
              </div>

              {/* Bottom Action: Proceed to Step 2 */}
              <div className="pt-2">
                <HudButton
                  type="button"
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleProceedToCreation}
                  iconPosition="right"
                  icon={<ChevronRight className="w-4 h-4 group-hover/hudbtn:translate-x-0.5 transition-transform" />}
                >
                  Proceed to Carapace Registration
                </HudButton>

                <div className="text-center mt-2.5">
                  <button
                    onClick={handleProceedToCreation}
                    className="font-sans text-[11px] text-ink-muted hover:text-ink transition-colors tracking-[0.08em] uppercase rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                  >
                    Skip Transmission
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: Character Creation (Avatar Selector + Base Stats Roller) */
          <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-300">
            <CharacterCreationStep
              onBack={() => setStep(1)}
              onComplete={handleCompleteCreation}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {/* Bottom glow bar */}
        <div
          className="h-px w-full shrink-0"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(0,195,255,0.15) 50%, transparent)',
          }}
        />

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src={getAssetUrl('podcasts/the-larval-condition.m4a')}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
          onEnded={handleEnded}
          preload="metadata"
        />
      </div>
    </div>
  )
}
