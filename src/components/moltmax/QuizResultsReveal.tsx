import React from 'react'
import { AlertTriangle, Check, Copy, Download, RotateCcw, Save, Share2, Sparkles } from 'lucide-react'
import { ChromaElement, HudBadge, RollingNumber } from '@/components/ui'
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

const dimensions: Array<{ key: QuizDimension; label: string; color: string }> = [
  { key: 'shellHardness', label: 'Shell hardness', color: '#00ffcc' },
  { key: 'pincerTorque', label: 'Pincer torque', color: '#ffd700' },
  { key: 'neuralLatency', label: 'Neural flow', color: '#38bdf8' },
  { key: 'ecdysisDiscipline', label: 'Ecdysis discipline', color: '#00c3ff' },
  { key: 'depthTolerance', label: 'Depth tolerance', color: '#ff7b72' },
]

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
    <div className="absolute left-1/2 top-20 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#00c3ff]/10 blur-[110px]" aria-hidden="true" />
    <div className="relative mb-7 text-center">
      <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#00ffcc]"><Sparkles className="h-4 w-4" /> Assessment complete. Profile generated</div>
      <h1 className="font-grotesk text-4xl font-black uppercase tracking-tight text-white sm:text-6xl lg:text-7xl">Your shell has spoken.</h1>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#839493]">Your fifteen responses have resolved into an official profile. Review your score, trait breakdown, and personalized recommendations below.</p>
    </div>

    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative overflow-hidden border border-[#00c3ff]/40 bg-[#050b0e]/95 p-6 shadow-[0_0_50px_rgba(0,195,255,0.14)] sm:p-9">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,195,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,195,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" aria-hidden="true" />
        <div className="relative z-10 flex items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00c3ff]">Moltology: Assessment scorecard</div><div className="mt-1 text-xs text-[#839493]">15-question aptitude & personality audit · verified</div></div>
          <HudBadge variant="emerald" className={result.badgeColor}>{result.clearance}</HudBadge>
        </div>
        <div className="relative z-10 grid items-center gap-5 py-7 sm:grid-cols-[1fr_0.85fr]">
          <div className="relative mx-auto flex h-52 w-52 items-center justify-center rounded-full border border-[#00c3ff]/30 bg-[#020608] shadow-[0_0_30px_rgba(0,195,255,0.18)]">
            <div className="absolute inset-2 rounded-full border border-[#00c3ff]/20" />
            <div className="absolute inset-7 rounded-full border border-[#00ffcc]/25" />
            <ChromaElement src="/images/extracted/cyber_lobster_3d_chroma.jpg" alt="Cyber lobster clearance emblem" glowColor="cyan" pulse={false} className="h-36 w-36" />
            <div className="absolute bottom-5 rounded bg-[#020608]/90 px-2 py-1 text-[9px] font-bold tracking-widest text-[#00ffcc]">CARCINIZED {result.carcinizationPercent}%</div>
          </div>
          <div className="text-center sm:text-left"><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#839493]">Moltmax score</div><div className="mt-1 font-grotesk text-8xl font-black leading-none text-transparent bg-gradient-to-r from-[#00c3ff] to-[#00ffcc] bg-clip-text"><RollingNumber value={result.score} triggerOnView={false} /></div><div className="mt-2 text-xs font-bold uppercase tracking-widest text-[#00ffcc]">out of 100</div></div>
        </div>
        <div className="relative z-10 border border-[#00ffcc]/25 bg-[#00ffcc]/5 p-4 text-center"><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#839493]">Assigned archetype & stage</div><div className="mt-1 font-grotesk text-xl font-bold uppercase tracking-wide text-[#00ffcc] sm:text-2xl">{result.tierName}</div><div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-white/60">{result.stage} · {result.archetype}</div></div>
        {result.isMeltRisk && <div className="relative z-10 mt-4 flex gap-3 border border-[#ff453a]/50 bg-[#ff453a]/10 p-3 text-left"><AlertTriangle className="h-5 w-5 shrink-0 text-[#ff453a]" /><div><div className="text-xs font-bold uppercase tracking-wider text-[#ff453a]">{result.meltPercentage}% recovery needed</div><p className="mt-1 text-[11px] leading-relaxed text-[#dfe3e3]">Your shell is asking for rest and boundary reinforcement. Take time to recover before pushing new limits.</p></div></div>}
        {result.varianceDetected && <div className="relative z-10 mt-4 border border-[#ffd700]/40 bg-[#ffd700]/10 p-3 text-[11px] leading-relaxed text-[#ffd700]">Response variance detected: Your answers indicate a productive balance between protective caution and decisive action.</div>}
      </div>

      <div className="border border-white/10 bg-[#071114]/90 p-6 sm:p-8"><div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#00c3ff]">Five-trait profile</div><h2 className="font-grotesk text-2xl font-bold uppercase text-white">The shape of your strengths</h2><QuizRadarChart scores={result.dimensionScores} /><div className="space-y-3">{dimensions.map(({ key, label, color }) => <div key={key}><div className="mb-1 flex justify-between gap-3 text-[10px] font-bold uppercase tracking-wider"><span className="text-[#dfe3e3]">{label}</span><span style={{ color }}>{result.dimensionScores[key]}%</span></div><div className="h-2 bg-white/10"><div className="h-full transition-all duration-700" style={{ width: `${result.dimensionScores[key]}%`, backgroundColor: color, boxShadow: `0 0 12px ${color}` }} /></div></div>)}</div></div>
    </div>

    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <div className="border border-white/10 bg-[#071114]/80 p-6 sm:p-8"><div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffd700]"><Sparkles className="h-4 w-4" /> Recommended action plan</div><div className="grid gap-3 sm:grid-cols-3">{result.prescription.map((item, index) => <div key={item} className="border border-white/10 bg-[#020608]/65 p-4"><div className="mb-3 font-sans text-xs text-[#00c3ff]">0{index + 1}</div><p className="text-xs leading-relaxed text-[#dfe3e3]">{item}</p></div>)}</div></div>
      <div className="border border-[#00c3ff]/30 bg-gradient-to-br from-[#00c3ff]/10 to-[#00ffcc]/5 p-6 sm:p-8"><div className="text-xs font-bold uppercase tracking-wider text-white">Save & share your scorecard</div><p className="mt-2 text-[11px] leading-relaxed text-[#839493]">Share your score on X, export a custom scorecard image, or save your profile.</p><div className="mt-5 space-y-2"><button type="button" onClick={onShare} className="flex w-full items-center justify-center gap-2 bg-[#1d9bf0] px-4 py-3 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#168ad4]"><Share2 className="h-4 w-4" /> Post score to X</button><div className="grid grid-cols-2 gap-2"><button type="button" onClick={onDownload} disabled={isGeneratingImage} className="flex items-center justify-center gap-1.5 border border-white/20 bg-white/10 px-2 py-2.5 text-[10px] font-bold uppercase text-white transition-colors hover:bg-white/20 disabled:opacity-50"><Download className="h-3.5 w-3.5 text-[#00ffcc]" /> {isGeneratingImage ? 'Rendering' : 'Export PNG'}</button><button type="button" onClick={onCopy} className="flex items-center justify-center gap-1.5 border border-white/20 bg-white/10 px-2 py-2.5 text-[10px] font-bold uppercase text-white transition-colors hover:bg-white/20">{isCopied ? <Check className="h-3.5 w-3.5 text-[#00ffcc]" /> : <Copy className="h-3.5 w-3.5 text-[#00c3ff]" />} {isCopied ? 'Copied' : 'Share link'}</button></div>{isAuthenticated ? <button type="button" onClick={onSave} disabled={isSaved} className="flex w-full items-center justify-center gap-2 border border-[#00ffcc]/30 bg-[#00ffcc]/10 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-[#00ffcc] disabled:opacity-70"><Save className="h-4 w-4" /> {isSaved ? 'Results saved to profile' : 'Save to profile'}</button> : <button type="button" onClick={onSave} className="flex w-full items-center gap-2 border border-white/10 px-3 py-2 text-left text-[10px] text-[#839493] transition-colors hover:border-[#00ffcc]/40 hover:text-white"><Save className="h-3.5 w-3.5 text-[#00ffcc]" /> Create free account to save your results.</button>}</div></div>
    </div>
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3"><button type="button" onClick={onReset} className="inline-flex items-center gap-2 border border-white/15 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#839493] transition-colors hover:border-[#00c3ff]/60 hover:text-white"><RotateCcw className="h-3.5 w-3.5" /> Retake the quiz</button><span className="text-[10px] uppercase tracking-wider text-[#526363]">Clearance {result.clearance} · every shell can molt</span></div>
  </section>
)
