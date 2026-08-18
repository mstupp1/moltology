import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  PictureInPicture,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Gauge,
} from 'lucide-react'
import type { IsolationSettings } from './IsolationSettingsModal'
import { getAssetUrl } from '@/lib/assets'

export interface CameraFeed {
  id: string
  title: string
  videoUrl: string
  posterUrl: string
}

export const ISOLATION_CAMERA_FEEDS: CameraFeed[] = [
  {
    id: 'feed-01',
    title: 'CYBER-BENTHIC ASCENSION',
    videoUrl: '/videos/hero_benthic_core.mp4',
    posterUrl: getAssetUrl('/images/hero_card_benthic_core.jpg'),
  },
  {
    id: 'feed-02',
    title: 'ASSET TRANSMUTATION',
    videoUrl: '/videos/hero_asset_shedding.mp4',
    posterUrl: getAssetUrl('/images/hero_card_asset_shedding.jpg'),
  },
  {
    id: 'feed-03',
    title: 'EXOSKELETAL HARDENING',
    videoUrl: '/videos/hero_chitin_hardening.mp4',
    posterUrl: getAssetUrl('/images/hero_card_chitin_hardening.jpg'),
  },
  {
    id: 'feed-04',
    title: 'TOTAL CARCINIZATION',
    videoUrl: '/videos/hero_total_carcinization.mp4',
    posterUrl: getAssetUrl('/images/stage4_carcinization.png'),
  },
  {
    id: 'feed-05',
    title: 'VIRTUAL FARADAY SHELL',
    videoUrl: '/videos/hero_fault_isolation.mp4',
    posterUrl: getAssetUrl('/images/isolation_shell_dome.png'),
  },
  {
    id: 'feed-06',
    title: 'SYNAPTIC SANCTUARY',
    videoUrl: '/videos/hero_synaptic_path.mp4',
    posterUrl: getAssetUrl('/images/hero_family_welcoming_sanctuary.png'),
  },
  {
    id: 'feed-07',
    title: 'CRYO-STASIS CHAMBER',
    videoUrl: '/videos/benthic_cryo_chamber.mp4',
    posterUrl: getAssetUrl('/images/benthic_abyss_hero.jpg'),
  },
]

const SPEED_OPTIONS = [0.5, 1.0, 1.25, 1.5, 2.0]

interface IsolationVideoFeedProps {
  settings: IsolationSettings
  onOpenSettings: () => void
}

export const IsolationVideoFeed: React.FC<IsolationVideoFeedProps> = ({
  settings,
  onOpenSettings,
}) => {
  const [activeChannelIndex, setActiveChannelIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.85)
  const [isMuted, setIsMuted] = useState(true)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const progressBarRef = useRef<HTMLDivElement | null>(null)

  const currentFeed = ISOLATION_CAMERA_FEEDS[activeChannelIndex]

  const safePlay = (el: HTMLVideoElement | null) => {
    if (!el) return
    try {
      const playPromise = el.play()
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {})
      }
    } catch (e) {
      // Ignore headless or policy playback errors
    }
  }

  // Handle channel change
  const handleSelectChannel = useCallback((index: number) => {
    setActiveChannelIndex(index)
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      safePlay(videoRef.current)
    }
  }, [])

  const handleNextChannel = useCallback(() => {
    setActiveChannelIndex((prev) => (prev + 1) % ISOLATION_CAMERA_FEEDS.length)
  }, [])

  const handlePrevChannel = useCallback(() => {
    setActiveChannelIndex((prev) => (prev - 1 + ISOLATION_CAMERA_FEEDS.length) % ISOLATION_CAMERA_FEEDS.length)
  }, [])

  // Auto-Cycle Feeds when video ends or if autoCycleFeeds is enabled
  const handleVideoEnded = () => {
    if (settings.autoCycleFeeds) {
      handleNextChannel()
    } else if (videoRef.current) {
      videoRef.current.currentTime = 0
      safePlay(videoRef.current)
    }
  }

  // Play / Pause Toggle
  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      safePlay(videoRef.current)
      setIsPlaying(true)
    }
  }

  // Mute / Unmute
  const toggleMute = () => {
    if (!videoRef.current) return
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    videoRef.current.muted = nextMuted
  }

  // Volume slider change
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol)
    if (videoRef.current) {
      videoRef.current.volume = newVol
      if (newVol === 0) {
        setIsMuted(true)
        videoRef.current.muted = true
      } else if (isMuted) {
        setIsMuted(false)
        videoRef.current.muted = false
      }
    }
  }

  // Speed change
  const handleSpeedChange = (spd: number) => {
    setPlaybackSpeed(spd)
    if (videoRef.current) {
      videoRef.current.playbackRate = spd
    }
    setIsSpeedMenuOpen(false)
  }

  // Picture in Picture
  const togglePiP = async () => {
    if (!videoRef.current) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture()
      }
    } catch (e) {
      console.warn('PiP error:', e)
    }
  }

  // Fullscreen
  const toggleFullscreen = async () => {
    const target = containerRef.current
    if (!target) return

    try {
      if (!document.fullscreenElement) {
        if (target.requestFullscreen) {
          await target.requestFullscreen()
        }
        setIsFullscreen(true)
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
        setIsFullscreen(false)
      }
    } catch (e) {
      console.warn('Fullscreen error:', e)
    }
  }

  // Listen for fullscreen change event
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  // Progress scrubbing
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current || !duration) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, clickX / rect.width))
    const seekTime = percent * duration
    videoRef.current.currentTime = seekTime
    setCurrentTime(seekTime)
  }

  // Auto-hide controls in fullscreen or on inactivity
  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3500)
  }

  // Sync video time
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
      setDuration(videoRef.current.duration || 0)
    }
  }

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const getVisionFilterClasses = () => {
    switch (settings.visionFilter) {
      case 'nightvision':
        return 'brightness-125 contrast-125 saturate-200 hue-rotate-[90deg]'
      case 'thermal':
        return 'invert contrast-150 hue-rotate-[180deg]'
      case 'deepsea':
        return 'brightness-90 contrast-125 saturate-200 hue-rotate-[160deg]'
      case 'standard':
      default:
        return ''
    }
  }

  return (
    <div className="w-full h-full flex-1 flex flex-col font-sans min-h-0">
      {/* Full-Height Video Viewport Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        className={`relative w-full h-full flex-1 bg-black overflow-hidden flex items-center justify-center select-none ${
          isFullscreen ? 'fixed inset-0 z-50 w-screen h-screen' : ''
        }`}
      >
        {/* Minimal Top-Left Name Overlay */}
        <div className="absolute top-4 left-4 sm:top-5 sm:left-5 z-20 pointer-events-none flex items-center gap-2 select-none">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00c3ff] animate-pulse" />
          <span className="text-xs font-sans font-bold tracking-widest text-white/80 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            ISOLATION PROTOCOLS
          </span>
        </div>

        {/* HUD Telemetry OSD Overlay */}
        {settings.showTelemetryOSD && (
          <div className="absolute top-12 left-4 sm:left-5 z-20 pointer-events-none space-y-1 font-sans text-[10px] text-[#00c3ff]/90 select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] bg-black/50 p-2 border border-[#00c3ff]/30 backdrop-blur-[2px] chamfer-corner">
            <div>FREQ: {settings.submergenceFreq.toFixed(1)} kHz · NOISE_SUPPR: {settings.socialNoiseSuppression}%</div>
            <div>STAGE: {settings.anonymityStage} · EMPATHY_DAMP: {settings.empathyDampening}/10</div>
            <div>SHIELD: {settings.isForceFieldEngaged ? 'ENGAGED' : 'DORMANT'} · PRIVACY: {settings.isPrivacyShellEngaged ? 'ACTIVE' : 'EXPOSED'}</div>
          </div>
        )}

        {/* Video Element */}
        <video
          ref={videoRef}
          src={currentFeed.videoUrl}
          poster={currentFeed.posterUrl}
          autoPlay
          muted={isMuted}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlay}
          className={`w-full h-full object-contain cursor-pointer transition-all duration-200 ${getVisionFilterClasses()}`}
        />

        {/* CRT Scanlines Filter Overlay */}
        {settings.showScanlines && (
          <div className="absolute inset-0 crt-scanlines pointer-events-none z-10 opacity-70" />
        )}

        {/* Video Player Controls Toolbar */}
        <div
          className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3 sm:p-5 z-30 transition-opacity duration-300 pointer-events-auto ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Timeline Scrubber */}
          <div className="space-y-1 mb-2 sm:mb-3">
            <div
              ref={progressBarRef}
              onClick={handleSeek}
              className="relative w-full h-2 sm:h-2.5 bg-[#171c1c] border border-[#3a4a49] cursor-pointer group"
              role="slider"
              aria-label="Video timeline scrubber"
              aria-valuenow={currentTime}
              aria-valuemin={0}
              aria-valuemax={duration}
            >
              {/* Played Bar */}
              <div
                className="h-full bg-gradient-to-r from-[#00c3ff] to-[#00ffff] relative transition-all"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              >
                {/* Thumb Indicator on Hover */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border border-[#00c3ff] shadow-[0_0_8px_#00c3ff] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Timestamp & Title Display */}
            <div className="flex justify-between items-center text-[11px] text-[#839493]">
              <div className="flex items-center gap-2">
                <span className="text-[#00c3ff] font-bold font-sans">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <span className="text-white/60 hidden sm:inline">•</span>
                <span className="text-white/80 font-bold text-xs uppercase hidden sm:inline">
                  {currentFeed.title}
                </span>
              </div>
              <div className="text-[#839493] text-[10px]">
                FEED {activeChannelIndex + 1} / {ISOLATION_CAMERA_FEEDS.length}
              </div>
            </div>
          </div>

          {/* Controls Bottom Row */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 text-[#dfe3e3]">
            {/* Left Controls: Play/Pause, Channel Nav, Volume */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause feed' : 'Play feed'}
                className="p-1.5 sm:p-2 bg-[#00c3ff]/10 hover:bg-[#00c3ff]/25 border border-[#00c3ff]/60 text-[#00c3ff] transition-all active:scale-95 chamfer-corner"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              {/* Prev Video */}
              <button
                onClick={handlePrevChannel}
                aria-label="Previous video"
                className="p-1.5 sm:p-2 bg-[#171c1c] hover:bg-[#252f2f] border border-[#3a4a49] text-[#839493] hover:text-[#00c3ff] transition-all chamfer-corner"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Next Video */}
              <button
                onClick={handleNextChannel}
                aria-label="Next video"
                className="p-1.5 sm:p-2 bg-[#171c1c] hover:bg-[#252f2f] border border-[#3a4a49] text-[#839493] hover:text-[#00c3ff] transition-all chamfer-corner"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Volume & Mute */}
              <div className="flex items-center gap-1.5 pl-1 sm:pl-2">
                <button
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute stream' : 'Mute stream'}
                  className="p-1.5 text-[#839493] hover:text-[#00c3ff] transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-[#ff5540]" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-[#00c3ff]" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  aria-label="Video volume"
                  className="w-14 sm:w-24 accent-[#00c3ff] bg-[#030606] h-1.5 cursor-pointer hidden sm:inline-block"
                />
              </div>
            </div>

            {/* Right Controls: Speed, PiP, Fullscreen, Settings */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Playback Speed Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)}
                  aria-label="Playback rate"
                  className="px-2 py-1 bg-[#171c1c] hover:bg-[#252f2f] border border-[#3a4a49] text-[10px] text-[#dfe3e3] hover:text-[#00c3ff] transition-all chamfer-corner flex items-center gap-1 font-bold"
                >
                  <Gauge className="w-3 h-3 text-[#00c3ff]" />
                  <span>{playbackSpeed}x</span>
                </button>

                {isSpeedMenuOpen && (
                  <div className="absolute bottom-full right-0 mb-1 bg-[#0e1315] border border-[#00c3ff] p-1.5 shadow-hud-cyan space-y-1 z-40 min-w-[75px] chamfer-corner">
                    {SPEED_OPTIONS.map((spd) => (
                      <button
                        key={spd}
                        onClick={() => handleSpeedChange(spd)}
                        className={`w-full text-left px-2 py-1 text-[10px] transition-colors ${
                          playbackSpeed === spd
                            ? 'bg-[#00c3ff]/20 text-[#00c3ff] font-bold'
                            : 'text-[#839493] hover:text-[#dfe3e3]'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Picture-in-Picture */}
              <button
                onClick={togglePiP}
                aria-label="Picture in Picture Mode"
                className="p-1.5 sm:p-2 bg-[#171c1c] hover:bg-[#252f2f] border border-[#3a4a49] text-[#839493] hover:text-[#00c3ff] transition-all chamfer-corner"
              >
                <PictureInPicture className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                className="p-1.5 sm:p-2 bg-[#171c1c] hover:bg-[#252f2f] border border-[#3a4a49] text-[#839493] hover:text-[#00c3ff] transition-all chamfer-corner"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Settings Button */}
              <button
                onClick={onOpenSettings}
                aria-label="Open Protocol Settings"
                className="p-1.5 sm:p-2 bg-[#171c1c] hover:bg-[#252f2f] border border-[#3a4a49] text-[#839493] hover:text-[#00c3ff] transition-all chamfer-corner flex items-center gap-1 text-[10px] font-bold"
              >
                <Sliders className="w-4 h-4" />
                <span className="hidden md:inline">SETTINGS</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
