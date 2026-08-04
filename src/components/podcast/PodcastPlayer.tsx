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
}

const SPEED_OPTIONS = [0.8, 1.0, 1.2, 1.5, 1.75, 2.0]

export const PodcastPlayer: React.FC<PodcastPlayerProps> = ({
  episode,
  onClose,
  isSticky = false,
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

      {/* Main HUD Podcast Player Card */}
      <div
        className={`bg-[#060a0b]/90 backdrop-blur-md border border-[#00c3ff]/40 shadow-[0_0_25px_rgba(0,195,255,0.15)] relative overflow-hidden transition-all duration-300 ${
          isSticky
            ? 'fixed bottom-0 left-0 right-0 z-50 md:left-72 p-4 border-t-2 border-t-[#00c3ff]'
            : 'p-6 rounded-none chamfer-corner'
        }`}
      >
        {/* Subtle Ambient HUD Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00c3ff]/5 rounded-full filter blur-3xl pointer-events-none" />

        {/* Player Header Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded bg-[#0a1215] border border-[#00c3ff]/60 flex items-center justify-center relative shrink-0 shadow-[0_0_12px_rgba(0,195,255,0.3)]">
              <Radio
                className={`w-6 h-6 ${
                  isPlaying ? 'text-[#00ffff] animate-pulse' : 'text-[#7a8e9e]'
                }`}
              />
              {isPlaying && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#ff3b30] rounded-full shadow-[0_0_8px_#ff3b30] animate-ping" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2 py-0.5 bg-[#00c3ff]/10 border border-[#00c3ff]/50 text-[#00c3ff] text-[10px] font-mono font-bold uppercase tracking-wider">
                  {episode.category}
                </span>
                <span className="text-[11px] font-mono text-[#ff5540] font-bold">
                  1.2x DEFAULTRATE
                </span>
              </div>
              <h3 className="text-base md:text-lg font-grotesk font-extrabold text-white truncate tracking-wide">
                {episode.title}
              </h3>
              <p className="text-xs font-mono text-[#839493] truncate">
                {episode.subtitle} • {episode.authorName}
              </p>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={toggleLike}
              className={`p-2 border transition-all text-xs font-mono flex items-center gap-1.5 ${
                isLiked
                  ? 'bg-[#ff3b30]/20 border-[#ff3b30] text-[#ff5555]'
                  : 'bg-[#091014] border-[#1e2d37] text-[#839493] hover:text-white hover:border-[#00c3ff]/50'
              }`}
              title="Endorse Transmission"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#ff5555]' : ''}`} />
              <span>{likeCount}</span>
            </button>

            <button
              onClick={() => setIsTranscriptOpen(true)}
              className="p-2 bg-[#091014] border border-[#1e2d37] hover:border-[#00c3ff]/60 text-[#839493] hover:text-[#00c3ff] transition-all text-xs font-mono flex items-center gap-1.5"
              title="View Transcript"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">TRANSCRIPT</span>
            </button>

            <button
              onClick={handleShare}
              className="p-2 bg-[#091014] border border-[#1e2d37] hover:border-[#00c3ff]/60 text-[#839493] hover:text-[#00ffff] transition-all text-xs font-mono relative"
              title="Share Transmission Link"
            >
              <Share2 className="w-4 h-4" />
              {copiedLink && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#00c3ff] text-[#060a0b] text-[10px] font-mono font-bold whitespace-nowrap shadow-lg">
                  COPIED!
                </span>
              )}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 bg-[#091014] border border-[#1e2d37] hover:border-[#ff5540] text-[#7a8e9e] hover:text-[#ff5540] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Audio Waveform Canvas */}
        <div className="w-full h-10 bg-[#040708] border border-[#1e2d37]/80 mb-4 relative overflow-hidden flex items-center">
          <canvas
            ref={canvasRef}
            width={600}
            height={40}
            className="w-full h-full object-cover opacity-80"
          />
        </div>

        {/* Main Controls & Progress Bar */}
        <div className="space-y-3 relative z-10">
          {/* Progress Scrubber */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#00c3ff] font-bold w-12 text-right">
              {formatTime(currentTime)}
            </span>

            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-[#0b1216] border border-[#1e2d37] appearance-none cursor-pointer accent-[#00c3ff] focus:outline-none"
              />
            </div>

            <span className="text-xs font-mono text-[#7a8e9e] w-12">
              {formatTime(duration)}
            </span>
          </div>

          {/* Primary Controls Row */}
          <div className="flex items-center justify-between gap-4 pt-1">
            {/* Play/Pause & Skip Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => skipTime(-15)}
                className="p-2 bg-[#091014] border border-[#1e2d37] hover:border-[#00c3ff]/60 text-[#7a8e9e] hover:text-[#00c3ff] transition-all active:scale-95"
                title="Rewind 15 seconds"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="w-12 h-12 bg-gradient-to-r from-[#00c3ff] to-[#00ffff] hover:from-[#00ffff] hover:to-[#00c3ff] text-[#060a0b] font-bold flex items-center justify-center shadow-[0_0_15px_rgba(0,195,255,0.5)] active:scale-95 transition-all chamfer-corner"
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
                className="p-2 bg-[#091014] border border-[#1e2d37] hover:border-[#00c3ff]/60 text-[#7a8e9e] hover:text-[#00c3ff] transition-all active:scale-95"
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
                  className="px-3 py-1.5 bg-[#0d161a] border border-[#00c3ff]/70 hover:border-[#00ffff] text-[#00c3ff] font-mono font-bold text-xs flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,195,255,0.2)] active:scale-95 transition-all"
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
                  <div className="absolute bottom-full right-0 mb-2 w-32 bg-[#060a0b] border border-[#00c3ff] shadow-xl z-50 p-1 divide-y divide-[#1e2d37]">
                    <div className="px-2 py-1 text-[10px] font-mono text-[#7a8e9e] font-bold uppercase">
                      PLAYBACK SPEED
                    </div>
                    <div className="py-1 space-y-0.5">
                      {SPEED_OPTIONS.map((speed) => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedSelect(speed)}
                          className={`w-full text-left px-2.5 py-1 text-xs font-mono flex items-center justify-between transition-colors ${
                            playbackSpeed === speed
                              ? 'bg-[#00c3ff]/20 text-[#00ffff] font-bold'
                              : 'text-[#839493] hover:bg-[#121c22] hover:text-white'
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
              <div className="hidden sm:flex items-center gap-2 bg-[#091014] border border-[#1e2d37] px-2.5 py-1">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-[#7a8e9e] hover:text-[#00c3ff] transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-[#ff5540]" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-[#00c3ff]" />
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
                  className="w-16 h-1.5 bg-[#0b1216] appearance-none cursor-pointer accent-[#00c3ff]"
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

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 font-mono text-xs text-[#b8c9c8] leading-relaxed whitespace-pre-wrap">
              {episode.transcript || 'No transcript available for this episode.'}
            </div>

            <div className="mt-4 pt-3 border-t border-[#1e2d37] flex items-center justify-between text-[11px] font-mono text-[#7a8e9e]">
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
