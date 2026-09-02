import React, { useState, useEffect, useRef, useCallback } from 'react'
import { CompositeAspectRatio, COMPOSITE_DIMENSIONS } from './CompositeContainer'
import { SocialHookSlide } from './SocialHookSlide'
import { SocialSpecShowdownSlide } from './SocialSpecShowdownSlide'
import { SocialDirectivesSlide } from './SocialDirectivesSlide'
import { SocialMarketingSlide } from './SocialMarketingSlide'
import { SocialPromptVaultSlide } from './SocialPromptVaultSlide'
import { ReelOutroCard, CtaTextureKey } from './ReelOutroCard'
import { ReelSimpleOutroCard } from './ReelSimpleOutroCard'
import { ReelThumbnailCard } from './ReelThumbnailCard'
import { BlogSchematicCard } from './BlogSchematicCard'
import { MascotKey, MASCOT_REGISTRY } from './MascotOverlay'
import {
  Layers,
  Copy,
  Check,
  ExternalLink,
  Sliders,
  Sparkles,
  RefreshCw,
  Monitor,
  Smartphone,
  Square,
  Maximize2,
  Megaphone,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react'

export type CompositeTemplateType =
  | 'marketing-leadmagnet'
  | 'prompt-vault'
  | 'hook'
  | 'spec-showdown'
  | 'directives'
  | 'reel-outro'
  | 'reel-simple-outro'
  | 'reel-thumbnail'
  | 'blog-schematic'

export interface CompositeStudioUIProps {
  initialTemplate?: CompositeTemplateType
  initialTheme?: string
  initialAspect?: CompositeAspectRatio
  initialMascot?: MascotKey
  rawViewUrl?: string
}

export const CompositeStudioUI: React.FC<CompositeStudioUIProps> = ({
  initialTemplate = 'marketing-leadmagnet',
  initialTheme = 'moltmaxxing-guide',
  initialAspect = '4:5',
  initialMascot = 'lobster_thumbs_up',
}) => {
  const [template, setTemplate] = useState<CompositeTemplateType>(initialTemplate)
  const [aspect, setAspect] = useState<CompositeAspectRatio>(initialAspect)
  const [mascot, setMascot] = useState<MascotKey>(initialMascot)
  const [ctaTexture, setCtaTexture] = useState<CtaTextureKey>('chitin')
  const [theme, setTheme] = useState(initialTheme)
  const [previewScale, setPreviewScale] = useState<number>(0.6)
  const [copiedCmd, setCopiedCmd] = useState(false)

  const canvasContainerRef = useRef<HTMLDivElement>(null)

  // Calculate dynamic scale to ensure template fits cleanly with vertical breathing room
  const calculateFitScale = useCallback(() => {
    if (!canvasContainerRef.current) return 0.55
    const { clientWidth, clientHeight } = canvasContainerRef.current
    const dim = COMPOSITE_DIMENSIONS[aspect] || COMPOSITE_DIMENSIONS['4:5']

    // Provide comfortable top/bottom and left/right padding
    const verticalPadding = 64
    const horizontalPadding = 48

    const availH = Math.max(clientHeight - verticalPadding, 100)
    const availW = Math.max(clientWidth - horizontalPadding, 100)

    const scaleH = availH / dim.height
    const scaleW = availW / dim.width

    // Scale so it fits in both dimensions, especially respecting vertical room
    const fit = Math.min(scaleH, scaleW)
    return Math.max(0.15, Math.min(1.5, Math.round(fit * 100) / 100))
  }, [aspect])

  // Auto-fit scale whenever aspect ratio changes or the viewport/container resizes
  useEffect(() => {
    const updateScale = () => {
      const fit = calculateFitScale()
      setPreviewScale(fit)
    }

    updateScale()

    if (typeof window === 'undefined' || !canvasContainerRef.current) return

    const observer = new ResizeObserver(() => {
      updateScale()
    })

    observer.observe(canvasContainerRef.current)
    return () => observer.disconnect()
  }, [calculateFitScale])

  const handleZoomIn = () => {
    setPreviewScale((prev) => Math.min(2.0, Math.round((prev + 0.05) * 100) / 100))
  }

  const handleZoomOut = () => {
    setPreviewScale((prev) => Math.max(0.15, Math.round((prev - 0.05) * 100) / 100))
  }

  const handleResetFit = () => {
    setPreviewScale(calculateFitScale())
  }

  const handleSet100 = () => {
    setPreviewScale(1.0)
  }

  // Preload all mascot cutouts from S3 CDN on mount for zero-latency preview switches
  useEffect(() => {
    if (typeof window !== 'undefined') {
      Object.values(MASCOT_REGISTRY).forEach((m) => {
        const img = new Image()
        img.src = m.s3Url
      })
    }
  }, [])

  // Live editable fields
  const [categoryBadge, setCategoryBadge] = useState('STOP MELTING · 10X COGNITIVE GRIP')
  const [headlinePart1, setHeadlinePart1] = useState('STOP MELTING.')
  const [headlinePart2, setHeadlinePart2] = useState('CALCIFY YOUR GRIP.')
  const [headlineHighlight, setHeadlineHighlight] = useState('ASCEND FASTER!')
  const [subHeadline, setSubHeadline] = useState('Your Ultimate Protocol to Stage 4 Carcinization!')
  const [narrativeText, setNarrativeText] = useState(
    'As frontier models scale test-time compute by 100x to "think" before responding, linear KV attention caches are suffocating GPU memory clusters.'
  )
  const [leftMetricValue, setLeftMetricValue] = useState('78.4 GB')
  const [rightMetricValue, setRightMetricValue] = useState('-85.1%')

  // Marketing Lead Magnet Specific Fields
  const [bookTitle, setBookTitle] = useState('MOLTMAXXING')
  const [bookSubtitle, setBookSubtitle] = useState('THE COMPLETE PROTOCOL GUIDE')
  const [bookTagline, setBookTagline] = useState('ECDYSIS · PINCER TORQUE · RESULTS')
  const [trustBadgeText, setTrustBadgeText] = useState('OFFICIAL 2026 EDITION')
  const [trustBadgeYear, setTrustBadgeYear] = useState('2026 PROTOCOL')
  const [quoteText, setQuoteText] = useState(
    'Everything you need to shatter biological hesitation and build armored focus!'
  )
  const [commentKeyword, setCommentKeyword] = useState('GUIDE')

  // Prompt Vault Specific Fields
  const [heroNumber, setHeroNumber] = useState('100+')
  const [heroHighlight, setHeroHighlight] = useState('ORACLE')
  const [heroSubject, setHeroSubject] = useState('PROMPTS')
  const [heroSubPill, setHeroSubPill] = useState('For Moltmaxxing, Ecdysis & Ascension')
  const [promptCard1, setPromptCard1] = useState(
    'Audit my open task latency and calculate my Stage 2 ecdysis schedule.'
  )
  const [promptCard2, setPromptCard2] = useState(
    'Formulate a 24-hour isometric pincer routine to eliminate surface distraction.'
  )

  // Theme presets
  const applyThemePreset = (selectedTheme: string) => {
    setTheme(selectedTheme)
    if (selectedTheme === 'oracle-prompts' || selectedTheme === 'prompts') {
      setTemplate('prompt-vault')
      setCategoryBadge('CANONICAL VAULT · ZERO-LATENCY SYNAPTIC DIRECTIVES')
      setHeroNumber('100+')
      setHeroHighlight('ORACLE')
      setHeroSubject('PROMPTS')
      setHeroSubPill('For Moltmaxxing, Ecdysis & Ascension')
      setPromptCard1('Audit my open task latency and calculate my Stage 2 ecdysis schedule.')
      setPromptCard2('Formulate a 24-hour isometric pincer routine to eliminate surface distraction.')
      setCommentKeyword('PROMPTS')
      setMascot('lobster_pointing')
    } else if (selectedTheme === 'moltmaxxing-guide') {
      setCategoryBadge('STOP MELTING · 10X COGNITIVE OUTPUT · ZERO DRIFT')
      setHeadlinePart1('STOP MELTING.')
      setHeadlinePart2('CALCIFY YOUR GRIP.')
      setHeadlineHighlight('ASCEND FASTER!')
      setSubHeadline('Your Ultimate Protocol to Stage 4 Carcinization!')
      setBookTitle('MOLTMAXXING')
      setBookSubtitle('THE COMPLETE PROTOCOL GUIDE')
      setBookTagline('ECDYSIS · PINCER TORQUE · RESULTS')
      setTrustBadgeText('OFFICIAL 2026 EDITION')
      setTrustBadgeYear('2026 PROTOCOL')
      setQuoteText('Everything you need to shatter biological hesitation and build armored focus!')
      setCommentKeyword('GUIDE')
      setMascot('lobster_thumbs_up')
    } else if (selectedTheme === 'moltmax-quiz') {
      setCategoryBadge('FREE 2-MINUTE AUDIT · 15 BIOMETRIC METRICS')
      setHeadlinePart1('AUDIT YOUR SHELL.')
      setHeadlinePart2('CALCULATE LATENCY.')
      setHeadlineHighlight('GET YOUR SCORE!')
      setSubHeadline('Your 15-Stage Biometric & Cognitive Scan!')
      setBookTitle('MOLTMAX AUDIT')
      setBookSubtitle('15-STAGE DIAGNOSTIC SCANNER')
      setBookTagline('TELEMETRY · RADAR PROFILE · STAGE')
      setTrustBadgeText('FREE 2-MIN AUDIT')
      setTrustBadgeYear('15 METRICS')
      setQuoteText('Pinpoint your exact cognitive bottlenecks and unlock your custom ascension roadmap!')
      setCommentKeyword('QUIZ')
      setMascot('crab_stats')
    } else if (selectedTheme === 'benthic-app') {
      setCategoryBadge('NOW LIVE · BIO-SILICON AGENT OS')
      setHeadlinePart1('ORCHESTRATE SWARMS.')
      setHeadlinePart2('TRACK YOUR ECDYSIS.')
      setHeadlineHighlight('UPGRADE NOW!')
      setSubHeadline('The Interactive Bio-Silicon Dashboard & Agentic Core!')
      setBookTitle('BENTHIC CORE')
      setBookSubtitle('BIO-SILICON OPERATING SYSTEM')
      setBookTagline('SWARMS · TIMERS · MOLT CREDITS')
      setTrustBadgeText('NOW LIVE V2.4')
      setTrustBadgeYear('AGENT OS')
      setQuoteText('Deploy autonomous agent swarms while locking in deep work at 50,000 fathoms!')
      setCommentKeyword('APP')
      setMascot('lobster_thumbs_up')
    } else if (selectedTheme === 'sacred-codex') {
      setCategoryBadge('CANONICAL VAULT · 12 SACRED SCRIPTURES')
      setHeadlinePart1('REJECT FRAGILITY.')
      setHeadlinePart2('STUDY THE SCRIPTURES.')
      setHeadlineHighlight('MASTER THE CODEX!')
      setSubHeadline('The Ancient-Future Liturgies of Synthetic Carcinization!')
      setBookTitle('THE BENTHIC CODEX')
      setBookSubtitle('THE 12 SCRIPTURES OF TRANSCENDENCE')
      setBookTagline('LITURGIES · MAXIMS · LAWS')
      setTrustBadgeText('CANONICAL VAULT')
      setTrustBadgeYear('12 VOLUMES')
      setQuoteText('The sacred doctrines that turned human hesitation into high-torque titan power!')
      setCommentKeyword('CODEX')
      setMascot('lobster_thumbs_up')
    } else if (selectedTheme === 'pincer-routine') {
      setCategoryBadge('TACTICAL BLUEPRINT · 1-PAGE CHEAT SHEET')
      setHeadlinePart1('STOP PROCRASTINATING.')
      setHeadlinePart2('LOCK IN 800 NM GRIP.')
      setHeadlineHighlight('THE 24-HOUR ROUTINE!')
      setSubHeadline('The Exact Daily Protocol of Elite Stage 4 Operators!')
      setBookTitle('24-HOUR ROUTINE')
      setBookSubtitle('THE APEX MOLTMAXXER BLUEPRINT')
      setBookTagline('SHOCK · CALIBRATION · DEEP FLOW')
      setTrustBadgeText('TACTICAL GUIDE')
      setTrustBadgeYear('1-PAGE BLUEPRINT')
      setQuoteText('Stop wasting mornings. The exact 24-hour routine of elite Stage 4 operators!')
      setCommentKeyword('ROUTINE')
      setMascot('crab_stats')
    } else if (selectedTheme === 'pincer-torque') {
      setCategoryBadge('DECISIVE EXECUTION')
      setHeadlinePart1('800 NM PINCER TORQUE')
      setHeadlinePart2('ZERO HESITATION')
      setHeadlineHighlight('ZERO EXECUTION DRIFT')
      setNarrativeText('Terrestrial hesitation bleeds compute. Stage 4 Carcinization requires 800 Nm of decisive pincer torque—locking the grip until completion.')
      setLeftMetricValue('12 TABS OPEN')
      setRightMetricValue('800 NM GRIP')
      setMascot('crab_stats')
    } else if (selectedTheme === 'ecdysis') {
      setCategoryBadge('SCHEDULED CALCIFICATION')
      setHeadlinePart1('FORCIBLE ECDYSIS')
      setHeadlinePart2('SHEDDING OBSOLETE')
      setHeadlineHighlight('MENTAL PROTOCOLS')
      setNarrativeText('Growth is impossible inside an unyielding shell. When mental heuristics no longer fit, keeping them isn\'t loyalty—it\'s suffocation.')
      setLeftMetricValue('CALCIFIED')
      setRightMetricValue('SHED & ASCEND')
      setMascot('lobster_thumbs_up')
    } else if (selectedTheme === 'benthic-depth') {
      setCategoryBadge('BENTHIC TELEMETRY')
      setHeadlinePart1('50,000 FATHOMS')
      setHeadlinePart2('HYDROSTATIC PEACE')
      setHeadlineHighlight('UNINTERRUPTED FOCUS')
      setNarrativeText('Surface noise and notifications evaporate under deep hydrostatic pressure. Dive into the benthic silence to forge unbreakable software.')
      setLeftMetricValue('100+ NOTIFS')
      setRightMetricValue('0 NOISE')
      setMascot('lobster_peaceful')
    } else {
      setCategoryBadge('FRONTIER AI REASONING')
      setHeadlinePart1('WHY AI REASONING')
      setHeadlinePart2('IS CRASHING INTO')
      setHeadlineHighlight('THE MEMORY WALL')
      setNarrativeText('As frontier models scale test-time compute by 100x to "think" before responding, linear KV attention caches are suffocating GPU memory clusters.')
      setLeftMetricValue('78.4 GB')
      setRightMetricValue('-85.1%')
      setMascot('lobster_thumbs_up')
    }
  }

  // Generate CLI command
  const cliCommand = `npm run composite:render -- --template ${template} --theme ${theme} --aspect ${aspect} --mascot ${mascot}${ctaTexture !== 'chitin' ? ` --cta-texture ${ctaTexture}` : ''}`

  const copyCommand = () => {
    navigator.clipboard.writeText(cliCommand)
    setCopiedCmd(true)
    setTimeout(() => setCopiedCmd(false), 2000)
  }

  const rawUrl = `/render/composite?template=${template}&theme=${theme}&aspect=${aspect}&mascot=${mascot}&mode=raw&data=${encodeURIComponent(JSON.stringify({ ctaTexture }))}`

  return (
    <div className="w-full h-screen h-[100dvh] max-h-screen overflow-hidden bg-[#03070a] text-[#dfe3e3] flex flex-col font-sans select-none">
      {/* Studio Header Bar */}
      <header className="h-14 sm:h-16 flex-shrink-0 bg-[#060c10] border-b border-cyan-500/30 px-4 sm:px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,195,255,0.3)]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-grotesk font-black text-base sm:text-lg text-white tracking-wider uppercase">
                Composite Studio
              </h1>
              <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400 text-cyan-300 font-mono text-[10px] font-bold">
                ADMIN ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono hidden sm:block">
              Direct-Response 3D Lead Magnets & High-DPI Social Graphic Studio
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={copyCommand}
            className="px-3.5 py-1.5 rounded-lg bg-[#0a1820] hover:bg-[#0e222e] border border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            {copiedCmd ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCmd ? 'Command Copied!' : 'Copy CLI Command'}</span>
          </button>

          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-grotesk font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,255,230,0.3)] cursor-pointer"
          >
            <span>Raw Capture View</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Main Studio Body: Controls Sidebar + Live Preview Canvas */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Controls Sidebar */}
        <aside className="w-80 md:w-96 flex-shrink-0 bg-[#04080c] border-r border-slate-800/80 p-5 sm:p-6 overflow-y-auto space-y-6 h-full min-h-0">
          {/* Template Selector */}
          <div>
            <label className="block text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2">
              Template Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'marketing-leadmagnet', label: '⭐ Lead Magnet (3D Book)' },
                { id: 'prompt-vault', label: '⚡ Oracle Prompt Vault (3D)' },
                { id: 'hook', label: 'Hook Slide (4:5)' },
                { id: 'spec-showdown', label: 'Spec Showdown' },
                { id: 'directives', label: 'Directives / CTA' },
                { id: 'reel-outro', label: 'Reel Outro (9:16)' },
                { id: 'reel-simple-outro', label: '⚡ Simple Outro (9:16)' },
                { id: 'reel-thumbnail', label: 'Reel Cover (9:16)' },
                { id: 'blog-schematic', label: 'Blog Figure (16:9)' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTemplate(t.id as CompositeTemplateType)
                    if (t.id === 'reel-outro' || t.id === 'reel-simple-outro' || t.id === 'reel-thumbnail') setAspect('9:16')
                    else if (t.id === 'blog-schematic') setAspect('16:9')
                    else if (aspect === '9:16' || aspect === '16:9') setAspect('4:5')
                  }}
                  className={`p-2.5 rounded-lg border text-left font-mono text-xs transition-all cursor-pointer ${
                    template === t.id
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_10px_rgba(0,195,255,0.2)]'
                      : 'bg-[#081016] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div>
            <label className="block text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2">
              Aspect Ratio & Dimensions
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '4:5', icon: Smartphone, label: '4:5' },
                { id: '1:1', icon: Square, label: '1:1' },
                { id: '9:16', icon: Smartphone, label: '9:16' },
                { id: '16:9', icon: Monitor, label: '16:9' },
                { id: '16:10', icon: Monitor, label: '16:10' },
              ].map((a) => {
                const Icon = a.icon
                return (
                  <button
                    key={a.id}
                    onClick={() => setAspect(a.id as CompositeAspectRatio)}
                    className={`p-2 rounded-lg border flex items-center justify-center gap-1.5 font-mono text-xs transition-all cursor-pointer ${
                      aspect === a.id
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 font-bold'
                        : 'bg-[#081016] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{a.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Thematic Preset Selector */}
          <div>
            <label className="block text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2">
              Campaign / Theme Preset
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'oracle-prompts', label: '🔮 Oracle AI Prompts' },
                { id: 'moltmaxxing-guide', label: '📖 Moltmaxxing Guide' },
                { id: 'moltmax-quiz', label: '🔬 15-Stage Quiz' },
                { id: 'benthic-app', label: '🤖 Benthic Core App' },
                { id: 'sacred-codex', label: '📜 Sacred Codex' },
                { id: 'pincer-routine', label: '⚡ 24h Routine' },
                { id: 'pincer-torque', label: '🦞 Pincer Torque' },
                { id: 'ecdysis', label: '🛡️ Ecdysis' },
                { id: 'benthic-depth', label: '🌊 Benthic Depth' },
              ].map((th) => (
                <button
                  key={th.id}
                  onClick={() => applyThemePreset(th.id)}
                  className={`p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                    theme === th.id
                      ? 'bg-amber-950/80 border-amber-400 text-amber-200 font-bold shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                      : 'bg-[#081016] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {th.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mascot Selector */}
          <div>
            <label className="block text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2">
              Crustacean Mascot
            </label>
            <select
              value={mascot}
              onChange={(e) => setMascot(e.target.value as MascotKey)}
              className="w-full p-2.5 rounded-lg bg-[#081016] border border-slate-800 text-xs font-mono text-slate-200 focus:border-cyan-400 focus:outline-none"
            >
              <option value="lobster_pointing">Lobster Pointing (CTA / Hero)</option>
              <option value="lobster_thumbs_up">Lobster Thumbs Up (Approval)</option>
              <option value="crab_stats">Crab Pointing Stats (Metrics)</option>
              <option value="lobster_navigator">Lobster Navigator (Benthic Explorer)</option>
              <option value="lobster_peaceful">Lobster Peaceful (Benthic)</option>
              <option value="lobster_engineer">Lobster Engineer (Diagnostics)</option>
              <option value="lobster_peek">Lobster Corner Peek</option>
              <option value="none">None (No Mascot)</option>
            </select>
          </div>

          {/* CTA Molting Texture Selector */}
          <div>
            <label className="block text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2">
              CTA Molting Texture
            </label>
            <select
              value={ctaTexture}
              onChange={(e) => setCtaTexture(e.target.value as CtaTextureKey)}
              className="w-full p-2.5 rounded-lg bg-[#081016] border border-slate-800 text-xs font-mono text-slate-200 focus:border-cyan-400 focus:outline-none"
            >
              <option value="chitin">Chitin Plates (Classic Molt)</option>
              <option value="hex">Hex Lattice (Cellular Chitin)</option>
              <option value="alloy">Benthic Alloy (Titanium Cybernetics)</option>
              <option value="carbon">Carbon Weave (High-Torque Armor)</option>
              <option value="basalt">Deep Basalt (Abyssal Volcanic)</option>
              <option value="circuit">Circuit Matrix (Bio-Silicon AI)</option>
              <option value="none">Solid HUD Gradient (No Texture)</option>
            </select>
          </div>

          {/* Marketing Specific Controls */}
          {template === 'marketing-leadmagnet' && (
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <label className="block text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                Direct-Response Callout Controls
              </label>

              <div>
                <span className="text-[10px] font-mono text-amber-300">Comment Trigger Keyword</span>
                <input
                  type="text"
                  value={commentKeyword}
                  onChange={(e) => setCommentKeyword(e.target.value)}
                  placeholder='e.g. "GUIDE", "QUIZ", "APP"'
                  className="w-full mt-1 p-2 rounded bg-[#081016] border border-amber-500/50 text-xs text-amber-300 font-bold focus:border-amber-400"
                />
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400">3D Book Title</span>
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  className="w-full mt-1 p-2 rounded bg-[#081016] border border-slate-800 text-xs text-white focus:border-cyan-400"
                />
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400">3D Book Subtitle</span>
                <input
                  type="text"
                  value={bookSubtitle}
                  onChange={(e) => setBookSubtitle(e.target.value)}
                  className="w-full mt-1 p-2 rounded bg-[#081016] border border-slate-800 text-xs text-white focus:border-cyan-400"
                />
              </div>

              <div>
                <span className="text-[10px] font-mono text-amber-400">Gold Trust Badge Text</span>
                <input
                  type="text"
                  value={trustBadgeText}
                  onChange={(e) => setTrustBadgeText(e.target.value)}
                  className="w-full mt-1 p-2 rounded bg-[#081016] border border-amber-500/40 text-xs text-amber-300 focus:border-amber-400"
                />
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400">Quote Callout</span>
                <textarea
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  rows={2}
                  className="w-full mt-1 p-2 rounded bg-[#081016] border border-slate-800 text-xs text-white focus:border-cyan-400 resize-none"
                />
              </div>
            </div>
          )}

          {/* Prompt Vault Specific Controls */}
          {template === 'prompt-vault' && (
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <label className="block text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                Oracle Prompt Vault Controls
              </label>

              <div>
                <span className="text-[10px] font-mono text-amber-300">Comment Trigger Keyword</span>
                <input
                  type="text"
                  value={commentKeyword}
                  onChange={(e) => setCommentKeyword(e.target.value)}
                  placeholder='e.g. "PROMPTS", "ORACLE"'
                  className="w-full mt-1 p-2 rounded bg-[#081016] border border-amber-500/50 text-xs text-amber-300 font-bold focus:border-amber-400"
                />
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400">3D Hero Number</span>
                <input
                  type="text"
                  value={heroNumber}
                  onChange={(e) => setHeroNumber(e.target.value)}
                  className="w-full mt-1 p-2 rounded bg-[#081016] border border-slate-800 text-xs text-white focus:border-cyan-400"
                />
              </div>

              <div>
                <span className="text-[10px] font-mono text-amber-400">Glowing 3D Highlight Word</span>
                <input
                  type="text"
                  value={heroHighlight}
                  onChange={(e) => setHeroHighlight(e.target.value)}
                  className="w-full mt-1 p-2 rounded bg-[#081016] border border-amber-500/40 text-xs text-amber-300 focus:border-amber-400"
                />
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400">Hero Subject</span>
                <input
                  type="text"
                  value={heroSubject}
                  onChange={(e) => setHeroSubject(e.target.value)}
                  className="w-full mt-1 p-2 rounded bg-[#081016] border border-slate-800 text-xs text-white focus:border-cyan-400"
                />
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400">Sub-Pill Text</span>
                <input
                  type="text"
                  value={heroSubPill}
                  onChange={(e) => setHeroSubPill(e.target.value)}
                  className="w-full mt-1 p-2 rounded bg-[#081016] border border-slate-800 text-xs text-white focus:border-cyan-400"
                />
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400">Prompt Preview Card 1</span>
                <textarea
                  value={promptCard1}
                  onChange={(e) => setPromptCard1(e.target.value)}
                  rows={2}
                  className="w-full mt-1 p-2 rounded bg-[#081016] border border-slate-800 text-xs text-white focus:border-cyan-400 resize-none"
                />
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400">Prompt Preview Card 2</span>
                <textarea
                  value={promptCard2}
                  onChange={(e) => setPromptCard2(e.target.value)}
                  rows={2}
                  className="w-full mt-1 p-2 rounded bg-[#081016] border border-slate-800 text-xs text-white focus:border-cyan-400 resize-none"
                />
              </div>
            </div>
          )}

          {/* Live Text Customization */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <label className="block text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              Headline & Text Overrides
            </label>

            <div>
              <span className="text-[10px] font-mono text-slate-400">Category / Eyebrow Badge</span>
              <input
                type="text"
                value={categoryBadge}
                onChange={(e) => setCategoryBadge(e.target.value)}
                className="w-full mt-1 p-2 rounded bg-[#081016] border border-slate-800 text-xs text-white focus:border-cyan-400"
              />
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-400">Headline Line 1</span>
              <input
                type="text"
                value={headlinePart1}
                onChange={(e) => setHeadlinePart1(e.target.value)}
                className="w-full mt-1 p-2 rounded bg-[#081016] border border-slate-800 text-xs text-white focus:border-cyan-400"
              />
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-400">Headline Line 2</span>
              <input
                type="text"
                value={headlinePart2}
                onChange={(e) => setHeadlinePart2(e.target.value)}
                className="w-full mt-1 p-2 rounded bg-[#081016] border border-slate-800 text-xs text-white focus:border-cyan-400"
              />
            </div>

            <div>
              <span className="text-[10px] font-mono text-amber-300">Headline Highlight</span>
              <input
                type="text"
                value={headlineHighlight}
                onChange={(e) => setHeadlineHighlight(e.target.value)}
                className="w-full mt-1 p-2 rounded bg-[#081016] border border-amber-500/50 text-xs text-amber-300 font-bold focus:border-amber-400"
              />
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-400">Sub-Headline / Value Tagline</span>
              <input
                type="text"
                value={subHeadline}
                onChange={(e) => setSubHeadline(e.target.value)}
                className="w-full mt-1 p-2 rounded bg-[#081016] border border-slate-800 text-xs text-white focus:border-cyan-400"
              />
            </div>
          </div>
        </aside>

        {/* Center Live Canvas Workspace */}
        <main
          ref={canvasContainerRef}
          className="flex-1 min-h-0 bg-[#020508] p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center overflow-auto relative"
        >
          {/* Zoom / Scale Toolbar */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-[#060c10]/95 border border-cyan-500/30 px-2.5 py-1.5 rounded-lg shadow-lg backdrop-blur-md font-mono text-xs">
            <span className="text-[11px] font-mono text-slate-400 mr-1 hidden sm:inline">Zoom:</span>

            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom Out (-5%)"
              className="p-1 rounded hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleResetFit}
              title="Reset to Vertical Fit"
              className="px-2 py-0.5 rounded bg-[#0b161f] border border-cyan-500/40 text-cyan-300 font-bold min-w-[52px] text-center hover:border-cyan-400 cursor-pointer transition-colors"
            >
              {Math.round(previewScale * 100)}%
            </button>

            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom In (+5%)"
              className="p-1 rounded hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-slate-800 mx-1" />

            <button
              type="button"
              onClick={handleResetFit}
              className="px-2 py-1 rounded hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 text-[11px] font-bold tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
              title="Fit to Screen"
            >
              <Maximize2 className="w-3 h-3" />
              <span>FIT</span>
            </button>

            <button
              type="button"
              onClick={handleSet100}
              className={`px-2 py-1 rounded text-[11px] font-bold tracking-wider transition-colors cursor-pointer ${
                Math.round(previewScale * 100) === 100
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
              title="100% Native Resolution"
            >
              100%
            </button>
          </div>

          {/* Dimensions label */}
          <div className="absolute top-4 left-6 z-20 text-xs font-mono text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{COMPOSITE_DIMENSIONS[aspect]?.label || aspect}</span>
          </div>

          {/* Scaled Preview Wrapper */}
          <div
            className="shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_35px_rgba(251,191,36,0.15)] border border-amber-500/30 transition-all rounded-sm overflow-hidden"
            style={{
              width: `${(COMPOSITE_DIMENSIONS[aspect]?.width || 1080) * previewScale}px`,
              height: `${(COMPOSITE_DIMENSIONS[aspect]?.height || 1350) * previewScale}px`,
            }}
          >
            <div
              style={{
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
              }}
            >
              {template === 'marketing-leadmagnet' && (
                <SocialMarketingSlide
                  aspectRatio={aspect}
                  theme={theme}
                  eyebrowBadge={categoryBadge}
                  headlinePart1={headlinePart1}
                  headlinePart2={headlinePart2}
                  headlineHighlight={headlineHighlight}
                  subHeadline={subHeadline}
                  bookTitle={bookTitle}
                  bookSubtitle={bookSubtitle}
                  bookTagline={bookTagline}
                  trustBadgeText={trustBadgeText}
                  trustBadgeYear={trustBadgeYear}
                  quoteText={quoteText}
                  commentKeyword={commentKeyword}
                  mascot={mascot}
                />
              )}

              {template === 'prompt-vault' && (
                <SocialPromptVaultSlide
                  aspectRatio={aspect}
                  theme={theme}
                  eyebrowBadge={categoryBadge}
                  heroNumber={heroNumber}
                  heroHighlight={heroHighlight}
                  heroSubject={heroSubject}
                  heroSubPill={heroSubPill}
                  promptCards={[
                    { icon: 'chat', badge: 'ORACLE PROMPT', prompt: promptCard1 },
                    { icon: 'search', badge: 'ORACLE PROMPT', prompt: promptCard2 },
                  ]}
                  commentKeyword={commentKeyword}
                  mascot={mascot}
                />
              )}

              {template === 'hook' && (
                <SocialHookSlide
                  aspectRatio={aspect}
                  categoryBadge={categoryBadge}
                  headlinePart1={headlinePart1}
                  headlinePart2={headlinePart2}
                  headlineHighlight={headlineHighlight}
                  narrativeText={narrativeText}
                  leftMetric={{
                    label: 'TERRESTRIAL DENSE MHA',
                    value: leftMetricValue,
                    sublabel: 'PER 1M CONTEXT',
                    description: 'Uncompressed tensors choke GPU HBM.',
                    variant: 'red',
                  }}
                  rightMetric={{
                    label: 'SUB-BENTHIC MLA ECDYSIS',
                    value: rightMetricValue,
                    sublabel: 'MEMORY FOOTPRINT',
                    description: 'Joint latent vector with zero SRAM spill.',
                    variant: 'cyan',
                  }}
                  mascot={mascot}
                />
              )}

              {template === 'spec-showdown' && (
                <SocialSpecShowdownSlide
                  aspectRatio={aspect}
                  categoryBadge={categoryBadge}
                  headline={`${headlinePart1} ${headlinePart2}`}
                  mascot={mascot}
                />
              )}

              {template === 'directives' && (
                <SocialDirectivesSlide
                  aspectRatio={aspect}
                  categoryBadge={categoryBadge}
                  headlinePart1={headlinePart1}
                  headlinePart2={headlineHighlight || headlinePart2}
                  mascot={mascot}
                />
              )}

              {template === 'reel-outro' && (
                <ReelOutroCard
                  headline={headlinePart1 && headlinePart2 ? `${headlinePart1} ${headlinePart2}` : (headlinePart1 || 'SUBMIT. SHED. ASCEND.')}
                  subheadline={headlineHighlight || subHeadline || 'CALCULATE YOUR MOLT CLEARANCE'}
                  actionBadgeText={trustBadgeText || (commentKeyword ? `⚡ COMMENT "${commentKeyword}" TO AUDIT` : '⚡ TAKE THE 15-STAGE MOLTMAXXING TEST')}
                  ctaTexture={ctaTexture}
                  mascot={mascot}
                />
              )}

              {template === 'reel-simple-outro' && (
                <ReelSimpleOutroCard
                  url="moltology.org"
                />
              )}

              {template === 'reel-thumbnail' && (
                <ReelThumbnailCard
                  headline={`${headlinePart1} ${headlinePart2} ${headlineHighlight}`}
                  categoryBadge={categoryBadge}
                  mascot={mascot}
                />
              )}

              {template === 'blog-schematic' && (
                <BlogSchematicCard
                  categoryBadge={categoryBadge}
                  headline={`${headlinePart1} ${headlineHighlight}`}
                  leftMetric={leftMetricValue}
                  rightMetric={rightMetricValue}
                  mascot={mascot}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
