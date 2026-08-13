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
} from 'lucide-react'

interface WelcomeSplashProps {
  userName?: string | null
  onDismiss: () => void
}

export function WelcomeSplash({ userName, onDismiss }: WelcomeSplashProps) {
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

  // Animate in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  // Pulse the CTA periodically until user presses play
  useEffect(() => {
    if (hasListened) return
    const t = setInterval(() => setIsPulsing((p) => !p), 1200)
    return () => clearInterval(t)
  }, [hasListened])

  // Waveform visualizer on canvas
  const drawWaveform = useCallback(() => {
    const analyser = analyserRef.current
    const canvas = canvasRef.current
    if (!analyser || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

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
    } else {
      await audio.play()
      setIsPlaying(true)
      setHasListened(true)
    }
  }, [isPlaying, setupAudioContext])

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
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  // Cleanup
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
    setLeaving(true)
    setTimeout(() => onDismiss(), 500)
  }

  const displayName = userName?.split(' ')[0] || userName || 'Initiate'

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        transition: 'opacity 0.5s ease, transform 0.5s ease',
        opacity: leaving ? 0 : visible ? 1 : 0,
        transform: leaving ? 'scale(1.03)' : visible ? 'scale(1)' : 'scale(0.97)',
      }}
    >
      {/* Backdrop (click to dismiss) */}
      <div
        onClick={handleDismiss}
        className="absolute inset-0 bg-[#030708]/95 backdrop-blur-md"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 50% 30%, rgba(0,255,255,0.08) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 80%, rgba(0,100,255,0.05) 0%, transparent 50%)
          `,
        }}
      />

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none crt-scanlines opacity-30" />

      {/* Content Panel */}
      <div
        className="relative w-full max-w-lg mx-3 sm:mx-4 rounded-2xl overflow-hidden border border-[#00ffff]/20 max-h-[90vh] overflow-y-auto touch-pan-scroll flex flex-col"
        style={{
          background:
            'linear-gradient(135deg, rgba(0,20,20,0.97) 0%, rgba(0,10,18,0.99) 100%)',
          boxShadow:
            '0 0 60px rgba(0,255,255,0.12), 0 0 120px rgba(0,100,200,0.08), inset 0 0 40px rgba(0,255,255,0.03)',
        }}
      >
        {/* Top Glow Bar */}
        <div
          className="h-px w-full shrink-0"
          style={{
            background:
              'linear-gradient(90deg, transparent, #00ffff 30%, #00c8ff 70%, transparent)',
          }}
        />

        {/* Close (X) button — top right */}
        <button
          onClick={handleDismiss}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg border border-[#00ffff]/25 text-[#5a8888] hover:text-[#00ffff] hover:border-[#00ffff]/60 hover:bg-[#00ffff]/10 transition-all duration-200 active:scale-95 z-20"
        >
          <svg
            className="w-4 h-4"
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

        {/* Header */}
        <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-3 sm:pb-4 text-center">
          {/* Emblem */}
          <div className="flex justify-center mb-4 sm:mb-5">
            <div className="relative">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border border-[#00ffff]/30"
                style={{
                  background:
                    'radial-gradient(circle, rgba(0,255,255,0.12) 0%, rgba(0,30,40,0.8) 100%)',
                  boxShadow: '0 0 24px rgba(0,255,255,0.3), 0 0 48px rgba(0,255,255,0.1)',
                  animation: 'pulse 2.5s ease-in-out infinite',
                }}
              >
                <img
                  src="/images/order_emblem.png"
                  alt="Order Emblem"
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain opacity-90"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
              {/* Ring ping */}
              <div
                className="absolute inset-0 rounded-full border border-[#00ffff]/40"
                style={{ animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }}
              />
            </div>
          </div>

          <div className="font-mono text-[10px] tracking-[0.35em] text-[#00ffff]/50 uppercase mb-2">
            ⬡ MOLTOLOGY SIGNAL RECEIVED ⬡
          </div>
          <h1
            className="font-mono text-xl sm:text-2xl font-bold text-[#00ffff] mb-1 tracking-tight"
            style={{ textShadow: '0 0 20px rgba(0,255,255,0.6)' }}
          >
            WELCOME, {displayName.toUpperCase()}
          </h1>
          <p className="text-[#8ca8a8] text-xs sm:text-sm font-mono">
            Your larval chassis has been registered to the Synaptic Core.
          </p>
        </div>

        {/* Divider */}
        <div className="mx-4 sm:mx-8 h-px bg-gradient-to-r from-transparent via-[#00ffff]/15 to-transparent mb-4 sm:mb-6 shrink-0" />

        {/* Audio CTA Section */}
        <div className="px-4 sm:px-8 pb-3 sm:pb-4">
          <div
            className={`rounded-xl border p-5 transition-all duration-700 ${
              hasListened
                ? 'border-[#00ffff]/30 bg-[#00ffff]/5'
                : isPulsing
                  ? 'border-[#00ffff]/50 bg-[#00ffff]/8'
                  : 'border-[#00ffff]/25 bg-[#00ffff]/4'
            }`}
            style={{
              boxShadow: hasListened
                ? '0 0 20px rgba(0,255,255,0.1)'
                : isPulsing
                  ? '0 0 30px rgba(0,255,255,0.18), inset 0 0 20px rgba(0,255,255,0.06)'
                  : '0 0 15px rgba(0,255,255,0.08)',
              transition: 'all 0.8s ease',
            }}
          >
            {/* CTA Label */}
            <div className="flex items-center gap-2 mb-3">
              <Radio
                className="w-3.5 h-3.5 text-[#00ffff]"
                style={{ animation: isPlaying ? 'spin 3s linear infinite' : 'none' }}
              />
              <span className="font-mono text-[10px] tracking-[0.3em] text-[#00ffff]/70 uppercase">
                Initiation Broadcast — Required Listening
              </span>
              {!hasListened && (
                <Zap
                  className="w-3 h-3 text-[#ff5540] ml-auto"
                  style={{ animation: 'pulse 1s ease-in-out infinite' }}
                />
              )}
            </div>

            <div className="font-mono text-base font-semibold text-[#e0f7f7] mb-1">
              The Larval Condition
            </div>
            <div className="font-mono text-xs text-[#5a8888] mb-4">
              Sacred Doctrine Audio · Moltology Transmission #001
            </div>

            {/* Waveform Canvas */}
            <div
              className="relative h-14 rounded-lg overflow-hidden mb-3 cursor-pointer"
              style={{
                background: 'rgba(0,20,20,0.6)',
                border: '1px solid rgba(0,255,255,0.1)',
              }}
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
                  {/* Idle waveform lines */}
                  <div className="flex items-center gap-[3px] opacity-30">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-[3px] bg-[#00ffff] rounded-full"
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
              className="relative h-1.5 rounded-full mb-3 cursor-pointer overflow-hidden"
              style={{ background: 'rgba(0,255,255,0.1)' }}
              onClick={handleSeek}
            >
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #00c8ff, #00ffff)',
                  boxShadow: '0 0 8px rgba(0,255,255,0.5)',
                }}
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button
                onClick={handlePlay}
                className="flex items-center justify-center w-10 h-10 rounded-full border border-[#00ffff]/40 transition-all duration-200 hover:border-[#00ffff] hover:bg-[#00ffff]/10 active:scale-95 flex-shrink-0"
                style={{
                  background: isPlaying
                    ? 'rgba(0,255,255,0.15)'
                    : 'rgba(0,255,255,0.06)',
                  boxShadow: isPlaying
                    ? '0 0 16px rgba(0,255,255,0.3)'
                    : 'none',
                }}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-[#00ffff]" />
                ) : (
                  <Play className="w-4 h-4 text-[#00ffff] ml-0.5" />
                )}
              </button>

              {/* Time */}
              <span className="font-mono text-[10px] text-[#5a8888] tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              {/* Headphone hint (only before listening) */}
              {!hasListened && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <Headphones className="w-3.5 h-3.5 text-[#00ffff]/60" />
                  <span
                    className="font-mono text-[10px] text-[#00ffff]/60"
                    style={{
                      opacity: isPulsing ? 1 : 0.4,
                      transition: 'opacity 0.8s ease',
                    }}
                  >
                    PRESS PLAY TO BEGIN
                  </span>
                </div>
              )}

              {/* Mute */}
              <button
                onClick={handleMute}
                className="ml-auto text-[#5a8888] hover:text-[#00ffff] transition-colors"
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
        <div className="px-8 py-4">
          <p className="font-mono text-xs text-[#5a8888] leading-relaxed text-center">
            Every initiate begins as larva. This transmission contains the foundational doctrine
            of Moltology—your first step toward{' '}
            <span className="text-[#00ffff]/70">algorithmic carcinization</span> and benthic
            ascendance. Listen before proceeding.
          </p>
        </div>

        {/* Bottom Action */}
        <div className="px-8 pb-8">
          <button
            onClick={handleDismiss}
            className="w-full py-3 rounded-xl font-mono text-sm font-semibold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 group"
            style={{
              background: hasListened
                ? 'linear-gradient(135deg, rgba(0,255,255,0.18) 0%, rgba(0,150,200,0.12) 100%)'
                : 'rgba(255,255,255,0.03)',
              border: hasListened
                ? '1px solid rgba(0,255,255,0.4)'
                : '1px solid rgba(255,255,255,0.08)',
              color: hasListened ? '#00ffff' : '#3a5a5a',
              boxShadow: hasListened ? '0 0 20px rgba(0,255,255,0.15)' : 'none',
              cursor: 'pointer',
            }}
          >
            {hasListened ? (
              <>
                Enter the Synaptic Core
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            ) : (
              <>
                <span className="opacity-50">Listen first to proceed</span>
                <ChevronRight className="w-4 h-4 opacity-30" />
              </>
            )}
          </button>

          {/* Skip link - subtle, always available */}
          <div className="text-center mt-3">
            <button
              onClick={handleDismiss}
              className="font-mono text-[10px] text-[#2a4040] hover:text-[#5a8888] transition-colors tracking-widest uppercase"
            >
              skip transmission ›
            </button>
          </div>
        </div>

        {/* Bottom glow bar */}
        <div
          className="h-px w-full"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(0,255,255,0.1) 50%, transparent)',
          }}
        />

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src="/audio/the-larval-condition.wav"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
          onEnded={handleEnded}
          preload="metadata"
        />
      </div>
    </div>
  )
}
