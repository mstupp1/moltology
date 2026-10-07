import React from 'react'
import { AlertTriangle, Check, Copy, Download, RotateCcw, Save, Share2, Sparkles } from 'lucide-react'
import { ChromaElement, HudBadge, RollingNumber } from '@/components/ui'
import { getAssetUrl } from '@/lib/assets'
import { type MoltmaxResult, type QuizDimension } from '@/lib/moltmax-quiz'
import { QuizRadarChart } from './QuizRadarChart'

interface QuizResultsRevealProps {
  result: MoltmaxResult
  isCopied: boolean
  isGeneratingImage: boolean
  isSaved: boolean
  isAuthenticated: boolean
  onShare: () => void
  onCopy: () => void
  onDownload: () => void
  onSave: () => void
  onReset: () => void
}

// Labels match the five vectors described on the landing page
const dimensions: Array<{ key: QuizDimension; label: string; color: string }> = [
  { key: 'shellHardness', label: 'Carapace resilience', color: '#00ffcc' },
  { key: 'pincerTorque', label: 'Pincer torque', color: '#ffd700' },
  { key: 'neuralLatency', label: 'Synaptic speed', color: '#38bdf8' },
  { key: 'ecdysisDiscipline', label: 'Ecdysis shedding', color: '#00c3ff' },
  { key: 'depthTolerance', label: 'Depth composure', color: '#ff7b72' },
]

const secondaryButton = 'flex min-h-[44px] items-center justify-center gap-2 rounded-md border border-white/15 bg-white/[0.06] px-3 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:border-white/30 hover:bg-white/[0.12] disabled:opacity-50'

export const QuizResultsReveal: React.FC<QuizResultsRevealProps> = ({
  result,
  isCopied,
  isGeneratingImage,
  isSaved,
  isAuthenticated,
  onShare,
  onCopy,
  onDownload,
  onSave,
  onReset,
}) => (
  <section className="relative mx-auto w-full max-w-7xl pb-10" aria-label="Moltmax clearance results">
    <div className="absolute left-1/2 top-20 h-[28rem] w-[28rem] max-w-full -translate-x-1/2 rounded-full bg-[#00c3ff]/10 blur-[110px]" aria-hidden="true" />
    <div className="relative mb-8 text-center">
      <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#00ffcc]"><Sparkles className="h-4 w-4" /> Your profile is ready</div>
      <h1 className="font-grotesk text-[2.5rem] font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">Your shell has spoken.</h1>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#9ab0af] sm:text-base">Here is your score, how your five traits stack up, and three small upgrades to try next.</p>
    </div>

    <div className="relative grid gap-5 sm:gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      {/* Scorecard */}
      <div className="relative overflow-hidden rounded-2xl border border-[#00c3ff]/40 bg-[#050b0e]/95 p-5 shadow-[0_0_50px_rgba(0,195,255,0.14)] sm:p-8">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,195,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,195,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" aria-hidden="true" />
        <div className="relative z-10 flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00c3ff]">Your scorecard</div>
            <div className="mt-1 text-xs text-[#9ab0af]">15 questions · 5 traits</div>
          </div>
          <HudBadge variant="emerald" className={`shrink-0 whitespace-nowrap ${result.badgeColor}`}>{result.clearance}</HudBadge>
        </div>

        <div className="relative z-10 grid items-center gap-4 py-6 sm:grid-cols-[auto_1fr] sm:gap-8 sm:py-8">
          <div className="relative mx-auto flex h-44 w-44 items-center justify-center rounded-full border border-[#00c3ff]/30 bg-[#020608] shadow-[0_0_30px_rgba(0,195,255,0.18)] sm:h-52 sm:w-52">
            <div className="absolute inset-2 rounded-full border border-[#00c3ff]/20" />
            <div className="absolute inset-7 rounded-full border border-[#00ffcc]/25" />
            <ChromaElement src={getAssetUrl('/images/extracted/cyber_lobster_3d_chroma.jpg')} alt="Cyber lobster clearance emblem" glowColor="cyan" pulse={false} className="h-28 w-28 sm:h-36 sm:w-36" />
            <div className="absolute -bottom-3 whitespace-nowrap rounded-full border border-[#00ffcc]/40 bg-[#020608] px-3 py-1 text-[10px] font-bold tracking-widest text-[#00ffcc]">CARCINIZED {result.carcinizationPercent}%</div>
          </div>
          <div className="text-center sm:text-left">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9ab0af]">Moltmax score</div>
            <div className="mt-1 bg-gradient-to-r from-[#00c3ff] to-[#00ffcc] bg-clip-text font-grotesk text-8xl font-black leading-none text-transparent sm:text-9xl"><RollingNumber value={result.score} triggerOnView={false} /></div>
            <div className="mt-2 text-xs font-bold uppercase tracking-widest text-[#00ffcc]">out of 100</div>
          </div>
        </div>

        <div className="relative z-10 rounded-lg border border-[#00ffcc]/25 bg-[#00ffcc]/5 p-4 text-center">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9ab0af]">Archetype and stage</div>
          <div className="mt-1 font-grotesk text-xl font-bold uppercase tracking-wide text-[#00ffcc] sm:text-2xl">{result.tierName}</div>
          <div className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/65">{result.stage} · {result.archetype}</div>
        </div>
        {result.isMeltRisk && <div className="relative z-10 mt-4 flex gap-3 rounded-lg border border-[#ff453a]/50 bg-[#ff453a]/10 p-3 text-left"><AlertTriangle className="h-5 w-5 shrink-0 text-[#ff453a]" /><div><div className="text-xs font-bold uppercase tracking-wider text-[#ff453a]">{result.meltPercentage}% recovery needed</div><p className="mt-1 text-xs leading-relaxed text-[#dfe3e3]">Your shell is asking for rest and boundary reinforcement. Take time to recover before pushing new limits.</p></div></div>}
        {result.varianceDetected && <div className="relative z-10 mt-4 rounded-lg border border-[#ffd700]/40 bg-[#ffd700]/10 p-3 text-xs leading-relaxed text-[#ffd700]">Your answers show a healthy balance between protective caution and decisive action.</div>}
      </div>

      {/* Trait profile */}
      <div className="rounded-2xl border border-white/10 bg-[#071114]/90 p-5 sm:p-8">
        <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#00c3ff]">Five-trait profile</div>
        <h2 className="font-grotesk text-2xl font-bold uppercase text-white">The shape of your strengths</h2>
        <div className="my-4 sm:my-6"><QuizRadarChart scores={result.dimensionScores} /></div>
        <div className="space-y-3.5">
          {dimensions.map(({ key, label, color }) => (
            <div key={key}>
              <div className="mb-1.5 flex justify-between gap-3 text-xs font-bold uppercase tracking-wider">
                <span className="text-[#dfe3e3]">{label}</span>
                <span className="tabular-nums" style={{ color }}>{result.dimensionScores[key]}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${result.dimensionScores[key]}%`, backgroundColor: color, boxShadow: `0 0 12px ${color}` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="relative mt-5 grid gap-5 sm:mt-6 sm:gap-6 lg:grid-cols-[1fr_0.8fr]">
      {/* Action plan */}
      <div className="rounded-2xl border border-white/10 bg-[#071114]/80 p-5 sm:p-8">
        <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#ffd700]"><Sparkles className="h-4 w-4" /> Your next three molts</div>
        <ol className="grid gap-3 sm:grid-cols-3">
          {result.prescription.map((item, index) => (
            <li key={item} className="flex gap-3 rounded-lg border border-white/10 bg-[#020608]/65 p-4 sm:block">
              <div className="font-grotesk text-lg font-black text-[#00c3ff] sm:mb-2">0{index + 1}</div>
              <p className="text-sm leading-relaxed text-[#dfe3e3]">{item}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Save and share */}
      <div className="rounded-2xl border border-[#00c3ff]/30 bg-gradient-to-br from-[#00c3ff]/10 to-[#00ffcc]/5 p-5 sm:p-8">
        <div className="text-sm font-bold uppercase tracking-wider text-white">Save and share your scorecard</div>
        <p className="mt-1.5 text-xs leading-relaxed text-[#9ab0af]">Post your score, download the scorecard image, or save it to your profile.</p>
        <div className="mt-5 space-y-2.5">
          <button type="button" onClick={onShare} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md bg-[#1d9bf0] px-4 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#168ad4]"><Share2 className="h-4 w-4" /> Post score to X</button>
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" onClick={onDownload} disabled={isGeneratingImage} className={secondaryButton}><Download className="h-4 w-4 text-[#00ffcc]" /> {isGeneratingImage ? 'Rendering' : 'Export PNG'}</button>
            <button type="button" onClick={onCopy} className={secondaryButton}>{isCopied ? <Check className="h-4 w-4 text-[#00ffcc]" /> : <Copy className="h-4 w-4 text-[#00c3ff]" />} {isCopied ? 'Copied' : 'Share link'}</button>
          </div>
          {isAuthenticated
            ? <button type="button" onClick={onSave} disabled={isSaved} className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md border border-[#00ffcc]/40 bg-[#00ffcc]/10 px-4 text-xs font-bold uppercase tracking-wide text-[#00ffcc] transition-colors hover:bg-[#00ffcc]/20 disabled:opacity-70"><Save className="h-4 w-4" /> {isSaved ? 'Results saved to profile' : 'Save to profile'}</button>
            : <button type="button" onClick={onSave} className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md border border-white/15 px-3 text-xs text-[#c6dad9] transition-colors hover:border-[#00ffcc]/40 hover:text-white"><Save className="h-4 w-4 text-[#00ffcc]" /> Create a free account to save your results</button>}
        </div>
      </div>
    </div>

    <div className="relative mt-8 flex flex-col items-center gap-3">
      <button type="button" onClick={onReset} className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-white/15 px-5 text-xs font-bold uppercase tracking-wider text-[#c6dad9] transition-colors hover:border-[#00c3ff]/60 hover:text-white"><RotateCcw className="h-4 w-4" /> Retake the quiz</button>
      <span className="text-[11px] uppercase tracking-wider text-[#6b7f7e]">Clearance {result.clearance} · every shell can molt</span>
    </div>
  </section>
)
