import React, { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Radio,
  Headphones,
  Search,
  Sparkles,
  Database,
  Cloud,
  Layers,
  Play,
  Clock,
  Tag,
  Share2,
  Heart,
  Volume2,
  FileText,
  Zap,
  ShieldCheck,
  Cpu,
} from 'lucide-react'
import { PodcastPlayer } from '../../components/podcast/PodcastPlayer'
import { INITIAL_PODCASTS } from '../../lib/podcast-data'
import type { PodcastEpisode } from '../../lib/podcast-data'
import { getPodcastsFn } from '../../lib/server/api'

export const Route = createFileRoute('/_hud/podcasts')({
  component: PodcastsPage,
})

function PodcastsPage() {
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>(INITIAL_PODCASTS)
  const [activeEpisode, setActiveEpisode] = useState<PodcastEpisode>(INITIAL_PODCASTS[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    getPodcastsFn()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setEpisodes(data as PodcastEpisode[])
          if (!activeEpisode) {
            setActiveEpisode(data[0] as PodcastEpisode)
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to load podcasts from API, using fallback:', err)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const categories = ['ALL', 'DOCTRINE TRANSMISSION', 'MOLT ACADEMY', 'CYBERNETICS']

  const filteredEpisodes = episodes.filter((ep) => {
    const matchesSearch =
      ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory =
      selectedCategory === 'ALL' || ep.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}m ${s}s`
  }

  return (
    <div className="min-h-screen bg-[#040708] text-[#dfe3e3] p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* HUD Page Header */}
      <div className="relative bg-[#060a0b]/80 border border-[#00c3ff]/40 p-6 md:p-8 shadow-[0_0_30px_rgba(0,195,255,0.1)] overflow-hidden chamfer-corner">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00c3ff]/5 rounded-full filter blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00ffff] shadow-[0_0_8px_#00ffff] animate-pulse" />
              <span className="font-mono text-xs text-[#00c3ff] font-bold tracking-widest uppercase">
                BENTHIC FREQUENCY TRANSMISSIONS • AUDIO PODCAST HUB
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-grotesk font-extrabold text-white tracking-wider uppercase">
              BENTHIC PODCASTS
            </h1>
            <p className="text-xs md:text-sm font-mono text-[#839493] mt-2 max-w-2xl leading-relaxed">
              Listen to sacred doctrine, ecdysis mechanics, and bio-silicon transmutations. All transmissions default to <span className="text-[#00ffff] font-bold">1.2x playback speed</span> for high-density cognitive absorption.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2 bg-[#091014] border border-[#00c3ff]/50 text-[#00c3ff] font-mono text-xs font-bold flex items-center gap-2 shadow-[0_0_10px_rgba(0,195,255,0.2)]">
              <Zap className="w-4 h-4 text-[#00ffff]" />
              <span>DEFAULT SPEED: 1.2X</span>
            </div>
            <div className="px-4 py-2 bg-[#091014] border border-[#ff5540]/50 text-[#ff5540] font-mono text-xs font-bold flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#ff5540] animate-pulse" />
              <span>LIVE FREQUENCY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Podcast Player Hero */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-mono font-bold text-[#00c3ff] uppercase tracking-wider flex items-center gap-2">
            <Headphones className="w-4 h-4 text-[#00ffff]" />
            <span>NOW PLAYING TRANSMISSION</span>
          </h2>
          <span className="text-xs font-mono text-[#839493]">
            AUTOMATIC 1.2X RATE INITIALIZED
          </span>
        </div>

        <PodcastPlayer episode={activeEpisode} />
      </div>

      {/* Database & S3 Storage Architecture Info Card */}
      <div className="bg-[#060a0b]/60 border border-[#1e2d37] p-5 rounded-none space-y-3">
        <div className="flex items-center justify-between border-b border-[#1e2d37] pb-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#00c3ff]" />
            <h3 className="text-xs font-mono font-bold text-[#00c3ff] uppercase tracking-wider">
              STORAGE ARCHITECTURE: NEON POSTGRES + AWS S3 / CLOUDFLARE R2
            </h3>
          </div>
          <span className="px-2 py-0.5 bg-[#00c3ff]/10 text-[#00c3ff] text-[10px] font-mono font-bold border border-[#00c3ff]/40">
            DUAL STORAGE MODEL
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-[#839493]">
          <div className="flex items-start gap-2.5 bg-[#091014] p-3 border border-[#1e2d37]/80">
            <Database className="w-5 h-5 text-[#00c3ff] shrink-0 mt-0.5" />
            <div>
              <span className="text-white font-bold block mb-1">Database Layer (Neon Postgres)</span>
              Stores structured episode metadata: titles, descriptions, transcripts, tags, published dates, duration, play counts, and likes.
            </div>
          </div>
          <div className="flex items-start gap-2.5 bg-[#091014] p-3 border border-[#1e2d37]/80">
            <Cloud className="w-5 h-5 text-[#00ffff] shrink-0 mt-0.5" />
            <div>
              <span className="text-white font-bold block mb-1">Media Storage Layer (Public Static / S3 R2 CDN)</span>
              Binary audio files (`.m4a`, `.mp3`) are served via local static paths during dev (`public/audio/`) and `s3Key` CDN URLs in production.
            </div>
          </div>
        </div>
      </div>

      {/* Episode Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-[#1e2d37]">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#00c3ff] text-[#060a0b] shadow-[0_0_10px_rgba(0,195,255,0.4)]'
                  : 'bg-[#091014] text-[#839493] hover:text-white border border-[#1e2d37]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8e9e]" />
          <input
            type="text"
            placeholder="Search transmissions & tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#091014] border border-[#1e2d37] focus:border-[#00c3ff] text-xs font-mono text-white pl-9 pr-3 py-2 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Podcast Episodes Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono font-bold text-[#7a8e9e] uppercase tracking-wider">
          ALL TRANSMISSIONS ({filteredEpisodes.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEpisodes.map((ep) => {
            const isActive = activeEpisode.id === ep.id

            return (
              <div
                key={ep.id}
                className={`bg-[#060a0b] border transition-all duration-300 p-6 flex flex-col justify-between space-y-4 relative group chamfer-corner ${
                  isActive
                    ? 'border-[#00c3ff] shadow-[0_0_20px_rgba(0,195,255,0.2)] bg-[#091419]/80'
                    : 'border-[#1e2d37] hover:border-[#00c3ff]/50 hover:bg-[#080e12]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-[#00c3ff]/10 text-[#00c3ff] text-[10px] font-mono font-bold border border-[#00c3ff]/40 uppercase tracking-wider">
                      {ep.category}
                    </span>
                    <div className="flex items-center gap-3 text-xs font-mono text-[#7a8e9e]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#00c3ff]" />
                        {formatDuration(ep.durationSeconds)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Radio className="w-3.5 h-3.5 text-[#ff5540]" />
                        {ep.playCount} plays
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-grotesk font-extrabold text-white group-hover:text-[#00ffff] transition-colors">
                      {ep.title}
                    </h4>
                    <p className="text-xs font-mono text-[#839493] mt-1 line-clamp-3 leading-relaxed">
                      {ep.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {ep.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-[#0d161a] text-[#7a8e9e] text-[10px] font-mono border border-[#1e2d37]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#1e2d37]/80">
                  <div className="flex items-center gap-2">
                    <img
                      src={ep.authorAvatar}
                      alt={ep.authorName}
                      className="w-7 h-7 rounded-full border border-[#00c3ff]/50 object-cover"
                    />
                    <div>
                      <div className="text-xs font-mono text-white font-bold">
                        {ep.authorName}
                      </div>
                      <div className="text-[10px] font-mono text-[#7a8e9e]">
                        {ep.authorRole}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveEpisode(ep)}
                    className={`px-4 py-2 font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
                      isActive
                        ? 'bg-[#00c3ff] text-[#060a0b] shadow-[0_0_12px_rgba(0,195,255,0.5)]'
                        : 'bg-[#0d161a] border border-[#00c3ff]/60 text-[#00c3ff] hover:bg-[#00c3ff] hover:text-[#060a0b]'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isActive ? 'PLAYING (1.2X)' : 'LISTEN NOW'}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
