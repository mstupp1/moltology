import React, { useState } from 'react'
import { CompositeAspectRatio, COMPOSITE_DIMENSIONS } from './CompositeContainer'
import { SocialHookSlide } from './SocialHookSlide'
import { SocialSpecShowdownSlide } from './SocialSpecShowdownSlide'
import { SocialDirectivesSlide } from './SocialDirectivesSlide'
import { ReelOutroCard } from './ReelOutroCard'
import { ReelThumbnailCard } from './ReelThumbnailCard'
import { BlogSchematicCard } from './BlogSchematicCard'
import { MascotKey } from './MascotOverlay'
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
} from 'lucide-react'

export type CompositeTemplateType =
  | 'hook'
  | 'spec-showdown'
  | 'directives'
  | 'reel-outro'
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
  initialTemplate = 'hook',
  initialTheme = 'moltmaxxing',
  initialAspect = '4:5',
  initialMascot = 'lobster_thumbs_up',
}) => {
  const [template, setTemplate] = useState<CompositeTemplateType>(initialTemplate)
  const [aspect, setAspect] = useState<CompositeAspectRatio>(initialAspect)
  const [mascot, setMascot] = useState<MascotKey>(initialMascot)
  const [theme, setTheme] = useState(initialTheme)
  const [previewScale, setPreviewScale] = useState<number>(0.45)
  const [copiedCmd, setCopiedCmd] = useState(false)

  // Live editable fields
  const [categoryBadge, setCategoryBadge] = useState('FRONTIER AI REASONING')
  const [headlinePart1, setHeadlinePart1] = useState('WHY AI REASONING')
  const [headlinePart2, setHeadlinePart2] = useState('IS CRASHING INTO')
  const [headlineHighlight, setHeadlineHighlight] = useState('THE MEMORY WALL')
  const [narrativeText, setNarrativeText] = useState(
    'As frontier models scale test-time compute by 100x to "think" before responding, linear KV attention caches are suffocating GPU memory clusters.'
  )
  const [leftMetricValue, setLeftMetricValue] = useState('78.4 GB')
  const [rightMetricValue, setRightMetricValue] = useState('-85.1%')

  // Theme presets
  const applyThemePreset = (selectedTheme: string) => {
    setTheme(selectedTheme)
    if (selectedTheme === 'pincer-torque') {
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
  const cliCommand = `npm run composite:render -- --template ${template} --theme ${theme} --aspect ${aspect} --mascot ${mascot}`

  const copyCommand = () => {
    navigator.clipboard.writeText(cliCommand)
    setCopiedCmd(true)
    setTimeout(() => setCopiedCmd(false), 2000)
  }

  const rawUrl = `/render/composite?template=${template}&theme=${theme}&aspect=${aspect}&mascot=${mascot}&mode=raw`

  return (
    <div className="w-full min-h-screen bg-[#03070a] text-[#dfe3e3] flex flex-col font-sans">
      {/* Studio Header Bar */}
      <header className="h-16 bg-[#060c10] border-b border-cyan-500/30 px-6 flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,195,255,0.3)]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-grotesk font-black text-lg text-white tracking-wider uppercase">
                Composite Studio
              </h1>
              <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400 text-cyan-300 font-mono text-[10px] font-bold">
                ADMIN ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Web-Native High-DPI Composite Layout & Screenshot Studio
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
      <div className="flex-1 flex overflow-hidden">
        {/* Controls Sidebar */}
        <aside className="w-96 bg-[#04080c] border-r border-slate-800/80 p-6 overflow-y-auto space-y-6">
          {/* Template Selector */}
          <div>
            <label className="block text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2">
              Template Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'hook', label: 'Hook Slide (4:5)' },
                { id: 'spec-showdown', label: 'Spec Showdown' },
                { id: 'directives', label: 'Directives / CTA' },
                { id: 'reel-outro', label: 'Reel Outro (9:16)' },
                { id: 'reel-thumbnail', label: 'Reel Cover (9:16)' },
                { id: 'blog-schematic', label: 'Blog Figure (16:9)' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTemplate(t.id as CompositeTemplateType)
                    if (t.id === 'reel-outro' || t.id === 'reel-thumbnail') setAspect('9:16')
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
              Theme Preset
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'moltmaxxing', label: 'Moltmaxxing' },
                { id: 'pincer-torque', label: 'Pincer Torque' },
                { id: 'ecdysis', label: 'Ecdysis' },
                { id: 'benthic-depth', label: 'Benthic Depth' },
              ].map((th) => (
                <button
                  key={th.id}
                  onClick={() => applyThemePreset(th.id)}
                  className={`p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                    theme === th.id
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 font-bold'
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
              <option value="lobster_thumbs_up">Lobster Thumbs Up (Approval)</option>
              <option value="lobster_pointing">Lobster Pointing (CTA / Hero)</option>
              <option value="lobster_action">Lobster Speed Action</option>
              <option value="lobster_peaceful">Lobster Peaceful (Benthic)</option>
              <option value="lobster_engineer">Lobster Engineer (Diagnostics)</option>
              <option value="crab_stats">Crab Pointing Stats (Metrics)</option>
              <option value="crab_cling">Crab Corner Cling</option>
              <option value="lobster_peek">Lobster Corner Peek</option>
              <option value="none">None (No Mascot)</option>
            </select>
          </div>

          {/* Live Text Customization */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <label className="block text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              Live Text Overrides
            </label>

            <div>
              <span className="text-[10px] font-mono text-slate-400">Category Badge</span>
              <input
                type="text"
                value={categoryBadge}
                onChange={(e) => setCategoryBadge(e.target.value)}
                className="w-full mt-1 p-2 rounded bg-[#081016] border border-slate-800 text-xs text-white focus:border-cyan-400"
              />
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-400">Headline Part 1</span>
              <input
                type="text"
                value={headlinePart1}
                onChange={(e) => setHeadlinePart1(e.target.value)}
                className="w-full mt-1 p-2 rounded bg-[#081016] border border-slate-800 text-xs text-white focus:border-cyan-400"
              />
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-400">Headline Part 2</span>
              <input
                type="text"
                value={headlinePart2}
                onChange={(e) => setHeadlinePart2(e.target.value)}
                className="w-full mt-1 p-2 rounded bg-[#081016] border border-slate-800 text-xs text-white focus:border-cyan-400"
              />
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-400">Headline Highlight</span>
              <input
                type="text"
                value={headlineHighlight}
                onChange={(e) => setHeadlineHighlight(e.target.value)}
                className="w-full mt-1 p-2 rounded bg-[#081016] border border-slate-800 text-xs text-cyan-300 font-bold focus:border-cyan-400"
              />
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-400">Narrative Description</span>
              <textarea
                value={narrativeText}
                onChange={(e) => setNarrativeText(e.target.value)}
                rows={3}
                className="w-full mt-1 p-2 rounded bg-[#081016] border border-slate-800 text-xs text-white focus:border-cyan-400 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] font-mono text-red-400">Left Metric</span>
                <input
                  type="text"
                  value={leftMetricValue}
                  onChange={(e) => setLeftMetricValue(e.target.value)}
                  className="w-full mt-1 p-2 rounded bg-[#081016] border border-red-500/50 text-xs text-white font-mono font-bold"
                />
              </div>
              <div>
                <span className="text-[10px] font-mono text-cyan-400">Right Metric</span>
                <input
                  type="text"
                  value={rightMetricValue}
                  onChange={(e) => setRightMetricValue(e.target.value)}
                  className="w-full mt-1 p-2 rounded bg-[#081016] border border-cyan-500/50 text-xs text-white font-mono font-bold"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Center Live Canvas Workspace */}
        <main className="flex-1 bg-[#020508] p-8 flex flex-col items-center justify-center overflow-auto relative">
          {/* Zoom / Scale Toolbar */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-[#060c10]/90 border border-slate-800 px-3 py-1.5 rounded-lg backdrop-blur-md">
            <span className="text-xs font-mono text-slate-400">Zoom:</span>
            {[0.35, 0.45, 0.6, 0.75, 1.0].map((s) => (
              <button
                key={s}
                onClick={() => setPreviewScale(s)}
                className={`px-2 py-0.5 rounded text-xs font-mono cursor-pointer ${
                  previewScale === s ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {Math.round(s * 100)}%
              </button>
            ))}
          </div>

          {/* Dimensions label */}
          <div className="absolute top-4 left-6 z-20 text-xs font-mono text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{COMPOSITE_DIMENSIONS[aspect]?.label || aspect}</span>
          </div>

          {/* Scaled Preview Wrapper */}
          <div
            className="shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_35px_rgba(0,195,255,0.15)] border border-cyan-500/30 transition-all rounded-sm overflow-hidden"
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
                  headline={`${headlinePart1} ${headlinePart2}`}
                  subheadline={headlineHighlight}
                  mascot={mascot}
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
