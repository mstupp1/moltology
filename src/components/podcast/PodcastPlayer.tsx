import React, { useState, useEffect, useRef } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Gauge,
  FileText,
  Share2,
  Heart,
  Radio,
  Sparkles,
  Download,
  X,
  Sliders,
} from 'lucide-react'
import type { PodcastEpisode } from '../../lib/podcast-data'

interface PodcastPlayerProps {
  episode: PodcastEpisode
  onClose?: () => void
  isSticky?: boolean
  theme?: 'hud' | 'moltnation'
}

const SPEED_OPTIONS = [0.8, 1.0, 1.2, 1.5, 1.75, 2.0]

export const PodcastPlayer: React.FC<PodcastPlayerProps> = ({
  episode,
  onClose,
  isSticky = false,
  theme = 'moltnation',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(episode.durationSeconds || 0)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.2) // DEFAULT SPEED 1.2X
  const [volume, setVolume] = useState<number>(0.85)
  const [isMuted, setIsMuted] = useState(false)
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false)
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(episode.likes)
  const [copiedLink, setCopiedLink] = useState(false)

  // Ensure default speed of 1.2x is applied when audio is loaded or changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed
    }
  }, [episode.audioUrl])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed
    }
  }, [playbackSpeed])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  // Canvas visualizer animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let angle = 0
    const renderWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const bars = 48
      const width = canvas.width / bars

      for (let i = 0; i < bars; i++) {
        const heightMultiplier = isPlaying
          ? Math.sin(angle + i * 0.25) * 0.4 + 0.6
          : 0.15
        const barHeight = (canvas.height - 10) * heightMultiplier * (0.3 + Math.random() * 0.7)

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0)
        if (isPlaying) {
          gradient.addColorStop(0, '#00c3ff')
          gradient.addColorStop(0.5, '#00ffff')
          gradient.addColorStop(1, '#ff5540')
        } else {
          gradient.addColorStop(0, '#1e2d37')
          gradient.addColorStop(1, '#3a4a49')
        }

        ctx.fillStyle = gradient
        ctx.fillRect(i * width + 2, canvas.height - barHeight, width - 4, barHeight)
      }

      angle += 0.08
      animationFrameRef.current = requestAnimationFrame(renderWave)
    }

    renderWave()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true)
          if (audioRef.current) {
            audioRef.current.playbackRate = playbackSpeed
          }
        })
        .catch((err) => console.error('Audio play failed:', err))
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration)
      }
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration)
      }
      audioRef.current.playbackRate = playbackSpeed
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value)
    setCurrentTime(targetTime)
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime
    }
  }

  const skipTime = (seconds: number) => {
    if (!audioRef.current) return
    const newTime = Math.min(Math.max(audioRef.current.currentTime + seconds, 0), duration)
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleSpeedSelect = (speed: number) => {
    setPlaybackSpeed(speed)
    setIsSpeedMenuOpen(false)
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const toggleLike = () => {
    if (isLiked) {
      setIsLiked(false)
      setLikeCount((prev) => prev - 1)
    } else {
      setIsLiked(true)
      setLikeCount((prev) => prev + 1)
    }
  }

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    }
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={episode.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />

      {/* Main Command Hub Podcast Player Card */}
      <div
        className={`bg-gradient-to-r from-[#0b1011] via-[#0f1616] to-[#0b1011] border-l-4 border-l-[#00ffff] border border-[#3a4a49] p-4 sm:p-5 chamfer-corner shadow-2xl relative transition-all duration-300 ${
          isSticky
            ? 'fixed bottom-0 left-0 right-0 z-50 md:left-72 border-t-2 border-t-[#00ffff]'
            : ''
        }`}
      >
        {/* Ambient Subtle Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00ffff]/5 rounded-full filter blur-3xl pointer-events-none" />

        {/* Player Header Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded bg-[#030606] border border-[#3a4a49] flex items-center justify-center relative shrink-0 chamfer-corner shadow-md">
              <Radio
                className={`w-6 h-6 ${
                  isPlaying ? 'text-[#00ffff] animate-pulse' : 'text-[#839493]'
                }`}
              />
              {isPlaying && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#ff5540] rounded-full shadow-[0_0_8px_#ff5540] animate-ping" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#00ffff]/15 text-[#00ffff] px-2 py-0.5 border border-[#00ffff]/40 text-[10px] font-sans font-bold uppercase tracking-wider chamfer-corner">
                  {theme === 'moltnation' ? '★ MOLTNATION RADIO ★' : episode.category}
                </span>
              </div>
              <h3 className="font-grotesk font-extrabold text-base sm:text-lg text-[#dfe3e3] truncate tracking-wider uppercase">
                {episode.title}
              </h3>
              <p className="text-xs font-sans text-[#839493] truncate">
                {episode.subtitle} • {episode.authorName}
              </p>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={toggleLike}
              className={`px-3 py-1.5 border transition-all text-xs font-sans flex items-center gap-1.5 chamfer-corner ${
                isLiked
                  ? 'bg-[#ff5540]/20 border-[#ff5540] text-[#ff5550]'
                  : 'bg-[#070b0b] border-[#3a4a49] text-[#839493] hover:text-[#dfe3e3] hover:border-[#00ffff]'
              }`}
              title="Endorse Transmission"
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#ff5550]' : ''}`} />
              <span>{likeCount}</span>
            </button>

            <button
              onClick={() => setIsTranscriptOpen(true)}
              className="px-3 py-1.5 bg-[#070b0b] border border-[#3a4a49] hover:border-[#00ffff] text-[#839493] hover:text-[#00ffff] text-xs font-sans flex items-center gap-1.5 chamfer-corner transition-all"
              title="View Transcript"
            >
              <FileText className="w-3.5 h-3.5 text-[#00ffff]" />
              <span className="hidden sm:inline">TRANSCRIPT</span>
            </button>

            <button
              onClick={handleShare}
              className="p-2 bg-[#070b0b] border border-[#3a4a49] hover:border-[#00ffff] text-[#839493] hover:text-[#00ffff] text-xs font-sans relative chamfer-corner transition-all"
              title="Share Transmission Link"
            >
              <Share2 className="w-3.5 h-3.5 text-[#00ffff]" />
              {copiedLink && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#00ffff] text-[#060a0b] text-[10px] font-sans font-bold whitespace-nowrap chamfer-corner shadow-lg">
                  COPIED!
                </span>
              )}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 bg-[#070b0b] border border-[#3a4a49] hover:border-[#ff5540] text-[#839493] hover:text-[#ff5540] chamfer-corner transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Audio Waveform Canvas Box */}
        <div className="w-full h-10 bg-[#030606] border border-[#3a4a49] chamfer-corner mb-3 relative overflow-hidden flex items-center">
          <canvas
            ref={canvasRef}
            width={600}
            height={40}
            className="w-full h-full object-cover opacity-85"
          />
        </div>

        {/* Main Controls & Progress Bar */}
        <div className="space-y-3 relative z-10">
          {/* Progress Scrubber */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-sans text-[#00c3ff] font-bold w-12 text-right">
              {formatTime(currentTime)}
            </span>

            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-[#030606] border border-[#3a4a49] appearance-none cursor-pointer accent-[#00ffff] focus:outline-none chamfer-corner"
              />
            </div>

            <span className="text-xs font-sans text-[#7a8e9e] w-12">
              {formatTime(duration)}
            </span>
          </div>

          {/* Primary Controls Row */}
          <div className="flex items-center justify-between gap-4 pt-1">
            {/* Play/Pause & Skip Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => skipTime(-15)}
                className="p-2 bg-[#070b0b] hover:bg-[#0f1616] border border-[#3a4a49] hover:border-[#00ffff] text-[#839493] hover:text-[#dfe3e3] text-xs font-sans font-bold chamfer-corner transition-all active:scale-95 shadow-md"
                title="Rewind 15 seconds"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="w-12 h-12 bg-gradient-to-r from-[#00c3ff] to-[#00ffff] hover:from-[#00ffff] hover:to-[#00c3ff] text-[#060a0b] font-bold flex items-center justify-center chamfer-corner shadow-[0_0_15px_rgba(0,195,255,0.4)] active:scale-95 transition-all"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-[#060a0b]" />
                ) : (
                  <Play className="w-6 h-6 fill-[#060a0b] ml-0.5" />
                )}
              </button>

              <button
                onClick={() => skipTime(15)}
                className="p-2 bg-[#070b0b] hover:bg-[#0f1616] border border-[#3a4a49] hover:border-[#00ffff] text-[#839493] hover:text-[#dfe3e3] text-xs font-sans font-bold chamfer-corner transition-all active:scale-95 shadow-md"
                title="Forward 15 seconds"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Playback Speed Control & Volume */}
            <div className="flex items-center gap-4">
              {/* Playback Speed Selector (DEFAULT 1.2x HIGHLIGHTED) */}
              <div className="relative">
                <button
                  onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)}
                  className="px-3 py-1.5 bg-[#070b0b] hover:bg-[#0f1616] border border-[#3a4a49] hover:border-[#00ffff] text-[#00ffff] font-sans font-bold text-xs flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,195,255,0.2)] chamfer-corner active:scale-95 transition-all"
                  title="Select Playback Speed"
                >
                  <Gauge className="w-3.5 h-3.5 text-[#00ffff]" />
                  <span>{playbackSpeed}x</span>
                  {playbackSpeed === 1.2 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ffff] shadow-[0_0_6px_#00ffff]" />
                  )}
                </button>

                {/* Speed Menu Dropdown */}
                {isSpeedMenuOpen && (
                  <div className="absolute bottom-full right-0 mb-2 w-36 bg-[#030606] border border-[#00ffff] shadow-2xl z-50 p-1.5 divide-y divide-[#3a4a49] chamfer-corner">
                    <div className="px-2 py-1 text-[10px] font-sans text-[#00ffff] font-bold uppercase tracking-wider">
                      PLAYBACK SPEED
                    </div>
                    <div className="py-1 space-y-0.5">
                      {SPEED_OPTIONS.map((speed) => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedSelect(speed)}
                          className={`w-full text-left px-2.5 py-1 text-xs font-sans flex items-center justify-between chamfer-corner transition-colors ${
                            playbackSpeed === speed
                              ? 'bg-[#00ffff]/20 text-[#00ffff] font-bold border border-[#00ffff]/50'
                              : 'text-[#839493] hover:bg-[#0f1616] hover:text-[#dfe3e3]'
                          }`}
                        >
                          <span>{speed}x</span>
                          {speed === 1.2 && (
                            <span className="text-[9px] text-[#ff5540] font-bold">
                              DEFAULT
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Volume Slider */}
              <div className="hidden sm:flex items-center gap-2 bg-[#070b0b] border border-[#3a4a49] px-3 py-1 chamfer-corner">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-[#839493] hover:text-[#00ffff] transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-[#ff5540]" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-[#00ffff]" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value))
                    setIsMuted(false)
                  }}
                  className="w-16 h-1.5 bg-[#030606] appearance-none cursor-pointer accent-[#00ffff]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript Drawer Modal */}
      {isTranscriptOpen && (
        <div className="fixed inset-0 z-50 bg-[#040708]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#060a0b] border border-[#00c3ff] shadow-[0_0_30px_rgba(0,195,255,0.3)] p-6 relative max-h-[80vh] flex flex-col chamfer-corner">
            <div className="flex items-center justify-between border-b border-[#1e2d37] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#00c3ff]" />
                <h4 className="text-base font-grotesk font-extrabold text-white uppercase">
                  TRANSMISSION TRANSCRIPT
                </h4>
              </div>
              <button
                onClick={() => setIsTranscriptOpen(false)}
                className="p-1 hover:bg-[#121c22] text-[#7a8e9e] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 font-sans text-xs text-[#b8c9c8] leading-relaxed whitespace-pre-wrap">
              {episode.transcript || 'No transcript available for this episode.'}
            </div>

            <div className="mt-4 pt-3 border-t border-[#1e2d37] flex items-center justify-between text-[11px] font-sans text-[#7a8e9e]">
              <span>EPISODE: {episode.title}</span>
              <button
                onClick={() => setIsTranscriptOpen(false)}
                className="px-4 py-1.5 bg-[#00c3ff]/20 border border-[#00c3ff] text-[#00ffff] font-bold hover:bg-[#00c3ff]/30 transition-all"
              >
                CLOSE TRANSCRIPT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
