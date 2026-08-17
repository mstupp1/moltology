/**
 * MOLTMAX // BENTHIC APTITUDE AUDIT
 *
 * The public assessment is intentionally client-led: the questions are safe to
 * render during SSR, while canvas export, sharing, and persistence stay inside
 * user actions.
 */
import React, { useRef, useState } from 'react'
import { Activity, ArrowDown, ArrowRight, Brain, ChevronRight, Compass, Layers3, Shield, Zap } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { PublicHeader } from '@/components/PublicHeader'
import { AuthModal } from '@/components/AuthModal'
import { MoltNationFooter } from '@/components/news/MoltNationFooter'
import { UnderwaterBubblesCanvas } from '@/components/hud/UnderwaterBubblesCanvas'
import { authClient } from '@/lib/auth-client'
import { updateUserStatsFn } from '@/lib/server/api'
import { useToast } from '@/components/ui/ToastProvider'
import { type QuizAnswers, computeMoltmaxResult, MOLTMAX_QUESTIONS, type MoltmaxResult, type QuizDimension } from '@/lib/moltmax-quiz'
import { QuizQuestionCard } from './moltmax/QuizQuestionCard'
import { QuizProgressHUD } from './moltmax/QuizProgressHUD'
import { QuizResultsReveal } from './moltmax/QuizResultsReveal'

type PageMode = 'hero' | 'quiz' | 'results'

const vectorCards: Array<{ icon: React.ReactNode; label: string; detail: string; color: string }> = [
  { icon: <Shield className="h-5 w-5" />, label: 'Carapace', detail: 'Boundary integrity', color: '#00ffcc' },
  { icon: <Zap className="h-5 w-5" />, label: 'Pincer', detail: 'Decisive torque', color: '#ffd700' },
  { icon: <Brain className="h-5 w-5" />, label: 'Synapse', detail: 'Response latency', color: '#38bdf8' },
  { icon: <Layers3 className="h-5 w-5" />, label: 'Ecdysis', detail: 'Shed discipline', color: '#00c3ff' },
  { icon: <Compass className="h-5 w-5" />, label: 'Depth', detail: 'Pressure tolerance', color: '#ff7b72' },
]

const dimensionForQuestion = (index: number): QuizDimension => MOLTMAX_QUESTIONS[index].dimension

export const MoltMaxPage: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [mode, setMode] = useState<PageMode>('hero')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [result, setResult] = useState<MoltmaxResult | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const quizRef = useRef<HTMLElement>(null)

  const beginAudit = () => {
    setAnswers({})
    setQuestionIndex(0)
    setResult(null)
    setIsSaved(false)
    setMode('quiz')
    setTimeout(() => quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const handleAnswer = (answer: string) => {
    const question = MOLTMAX_QUESTIONS[questionIndex]
    setAnswers((current) => ({ ...current, [question.id]: answer }))
  }

  const handleNext = () => {
    if (!answers[MOLTMAX_QUESTIONS[questionIndex].id]) return
    if (questionIndex === MOLTMAX_QUESTIONS.length - 1) {
      setResult(computeMoltmaxResult(answers))
      setMode('results')
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0)
      return
    }
    setQuestionIndex((current) => current + 1)
  }

  const handleBack = () => {
    if (questionIndex === 0) {
      setMode('hero')
      return
    }
    setQuestionIndex((current) => current - 1)
  }

  const handleShare = () => {
    if (!result) return
    const text = encodeURIComponent(`My Moltmax clearance is ${result.score}/100: ${result.tierName}. Stage ${result.clearance}. Run the 15-vector benthic aptitude audit:`)
    const url = encodeURIComponent('https://moltology.org/moltmax')
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=Moltmaxxing,Moltology`, '_blank', 'noopener,noreferrer')
  }

  const handleCopy = () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    navigator.clipboard.writeText('https://moltology.org/moltmax').then(() => {
      setIsCopied(true)
      toast.success('Moltmax audit link copied to clipboard.')
      window.setTimeout(() => setIsCopied(false), 2500)
    }).catch(() => toast.error('The signal could not reach your clipboard.'))
  }

  const handleSave = async () => {
    if (!result || !user) return
    try {
      await updateUserStatsFn({
        data: {
          pincerTorque: result.dimensionScores.pincerTorque,
          shellHardness: result.dimensionScores.shellHardness,
          clawStrength: result.score,
          moltmaxScore: result.score,
          moltmaxClearance: result.clearance,
          moltmaxStage: result.stage,
          moltmaxDimensionScores: result.dimensionScores,
        },
      })
      setIsSaved(true)
      toast.success('Clearance signal saved to your Benthic Core.')
    } catch {
      toast.error('The Benthic Core could not receive this signal. Try again.')
    }
  }

  const handleDownload = () => {
    if (!result) return
    setIsGeneratingImage(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1200
      canvas.height = 675
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = '#03070d'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = 'rgba(0, 195, 255, 0.1)'
      for (let x = 0; x < canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke() }
      for (let y = 0; y < canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke() }
      ctx.strokeStyle = '#00c3ff'
      ctx.lineWidth = 2
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60)
      ctx.fillStyle = '#00ffcc'
      ctx.font = 'bold 22px monospace'
      ctx.fillText('MOLTOLOGY // BENTHIC APTITUDE AUDIT', 60, 82)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 42px sans-serif'
      ctx.fillText('OFFICIAL MOLTMAX CLEARANCE', 60, 140)
      ctx.fillStyle = '#00ffcc'
      ctx.font = 'bold 20px monospace'
      ctx.fillText(`${result.tierName.toUpperCase()} // ${result.clearance}`, 60, 190)
      ctx.fillStyle = '#00ffcc'
      ctx.font = 'bold 100px monospace'
      ctx.fillText(String(result.score), 820, 280)
      ctx.fillStyle = '#839493'
      ctx.font = '16px monospace'
      ctx.fillText('MOLTMAX INDEX / 100', 820, 315)
      const stats = [
        ['SHELL HARDNESS', `${result.biometrics.shellHardness} HP`, result.dimensionScores.shellHardness],
        ['PINCER TORQUE', `${result.biometrics.pincerTorque} Nm`, result.dimensionScores.pincerTorque],
        ['NEURAL LATENCY', `${result.biometrics.promptLatency} ms`, result.dimensionScores.neuralLatency],
        ['ECDYSIS INTERVAL', `${result.biometrics.ecdysisInterval} DAYS`, result.dimensionScores.ecdysisDiscipline],
        ['SUBMERGENCE DEPTH', `${result.biometrics.submergenceDepth.toLocaleString()} FATHOMS`, result.dimensionScores.depthTolerance],
      ] as Array<[string, string, number]>
      stats.forEach(([label, value, percent], index) => {
        const y = 270 + index * 55
        ctx.fillStyle = '#839493'
        ctx.font = 'bold 15px monospace'
        ctx.fillText(label, 60, y)
        ctx.fillStyle = '#ffffff'
        ctx.fillText(value, 320, y)
        ctx.fillStyle = 'rgba(255,255,255,0.1)'
        ctx.fillRect(60, y + 10, 400, 8)
        ctx.fillStyle = '#00c3ff'
        ctx.fillRect(60, y + 10, 400 * percent / 100, 8)
      })
      ctx.fillStyle = '#00c3ff'
      ctx.font = '16px monospace'
      ctx.fillText('MOLTLOGY.ORG/MOLTMAX // NO SHELL IS FINAL', 60, 620)
      const link = document.createElement('a')
      link.download = `moltmax-clearance-${result.score}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Clearance PNG exported successfully.')
    } catch {
      toast.error('Could not export the clearance. Try taking a screenshot.')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#020608] font-mono text-[#dfe3e3] selection:bg-[#00c3ff]/30 selection:text-white">
      <PublicHeader activePage="moltmax" onOpenAuth={(auth) => { setAuthMode(auth); setIsAuthModalOpen(true) }} />
      {mode === 'hero' && <main>
        <section className="relative flex min-h-[calc(100svh-5rem)] items-center overflow-hidden border-b border-[#00c3ff]/20 px-4 pb-16 pt-28 sm:px-8 lg:px-16">
          <UnderwaterBubblesCanvas bubbleCount={34} className="absolute inset-0 opacity-50" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,rgba(0,195,255,0.14),transparent_32%),radial-gradient(circle_at_25%_75%,rgba(255,69,58,0.1),transparent_28%),linear-gradient(180deg,rgba(2,6,8,0.3),#020608)]" aria-hidden="true" />
          <div className="absolute right-[-12%] top-1/2 h-[38rem] w-[38rem] -translate-y-1/2 rounded-full border border-[#00c3ff]/10 [transform:rotateX(65deg)_rotateZ(-18deg)]" aria-hidden="true" />
          <div className="absolute right-[-7%] top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full border border-dashed border-[#00ffcc]/20 animate-spin-slow" aria-hidden="true" />
          <div className="relative z-10 mx-auto grid w-full max-w-[1600px] items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="max-w-4xl">
              <div className="mb-6 inline-flex items-center gap-2 border border-[#00c3ff]/40 bg-[#00c3ff]/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#00c3ff]"><Activity className="h-4 w-4 animate-pulse" /> Protocol 03.15 // live audit chamber</div>
              <h1 className="font-grotesk text-[clamp(3.25rem,9vw,8.75rem)] font-black uppercase leading-[0.84] tracking-[-0.07em] text-white">Measure the shell.<br /><span className="text-transparent bg-gradient-to-r from-[#00c3ff] via-[#00ffcc] to-[#38bdf8] bg-clip-text">Meet the depth.</span></h1>
              <p className="mt-8 max-w-2xl text-sm leading-relaxed text-[#a2b2b1] sm:text-base">The official Moltmax clearance is a 15-vector behavioral audit for boundary integrity, decisive motion, neural flow, shedding discipline, and pressure tolerance.</p>
              <div className="mt-9 flex flex-wrap items-center gap-4"><button type="button" onClick={beginAudit} className="group inline-flex items-center gap-3 bg-[#00c3ff] px-6 py-4 font-grotesk text-sm font-bold uppercase tracking-wider text-[#020408] shadow-[0_0_30px_rgba(0,195,255,0.35)] transition-all hover:bg-[#00ffcc] hover:shadow-[0_0_40px_rgba(0,255,204,0.4)]">Initiate biometric audit <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></button><div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#839493]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#00ffcc]" /> 3-4 minutes · no wrong answers</div></div>
              <div className="mt-12 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-5">{vectorCards.map((card) => <div key={card.label} className="border border-white/10 bg-[#071114]/70 p-3 backdrop-blur-sm"><div style={{ color: card.color }}>{card.icon}</div><div className="mt-3 font-grotesk text-xs font-bold uppercase text-white">{card.label}</div><div className="mt-1 text-[9px] leading-relaxed text-[#839493]">{card.detail}</div></div>)}</div>
            </div>
            <div className="relative hidden min-h-[34rem] lg:block"><div className="absolute inset-10 rounded-full bg-[#00c3ff]/10 blur-[90px]" /><div className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#00c3ff]/20 [transform:translate(-50%,-50%)_rotateX(65deg)]" /><div className="absolute left-1/2 top-1/2 h-[21rem] w-[21rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#00ffcc]/20 [transform:translate(-50%,-50%)_rotateY(65deg)] animate-spin-slow" /><div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rotate-12 border border-[#00c3ff]/40 bg-[#071114]/60 shadow-[0_0_60px_rgba(0,195,255,0.2)] [transform:translate(-50%,-50%)_rotateX(12deg)_rotateY(-22deg)_rotateZ(12deg)]"><div className="absolute inset-3 border border-dashed border-[#00ffcc]/35" /><div className="flex h-full flex-col items-center justify-center text-center"><div className="font-cinzel text-5xl text-[#00ffcc]">M</div><div className="mt-4 text-[9px] font-bold uppercase tracking-[0.3em] text-[#00c3ff]">Benthic<br />clearance</div></div></div><div className="absolute bottom-5 right-4 border border-[#ff453a]/40 bg-[#ff453a]/10 px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-[#ff7b72]">Signal integrity: active</div></div>
          </div>
          <div className="absolute bottom-7 left-1/2 -translate-x-1/2 text-[#839493]"><ArrowDown className="h-5 w-5 animate-bounce" /></div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8"><div className="grid gap-8 border-y border-white/10 py-10 md:grid-cols-3"><div><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00c3ff]">01 // Observe</div><p className="mt-3 text-sm leading-relaxed text-[#839493]">Answer from the behavior you actually repeat, not the creature you think you should be.</p></div><div><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00c3ff]">02 // Calibrate</div><p className="mt-3 text-sm leading-relaxed text-[#839493]">The rubric weighs five complementary vectors and checks for signal tension.</p></div><div><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00c3ff]">03 // Descend</div><p className="mt-3 text-sm leading-relaxed text-[#839493]">Receive a canonical Stage, micro-clearance, and a useful next-cycle prescription.</p></div></div></section>
      </main>}

      {mode === 'quiz' && <main ref={quizRef} className="min-h-screen px-4 pb-20 pt-32 sm:px-8"><QuizProgressHUD current={questionIndex} total={MOLTMAX_QUESTIONS.length} currentDimension={dimensionForQuestion(questionIndex)} /><QuizQuestionCard question={MOLTMAX_QUESTIONS[questionIndex]} questionNumber={questionIndex + 1} totalQuestions={MOLTMAX_QUESTIONS.length} answer={answers[MOLTMAX_QUESTIONS[questionIndex].id]} onAnswer={handleAnswer} onBack={handleBack} onNext={handleNext} /><div className="mx-auto mt-8 max-w-5xl text-center text-[10px] uppercase tracking-wider text-[#526363]">Your answers stay in this chamber unless you choose to save the final signal.</div></main>}

      {mode === 'results' && result && <main className="px-4 pb-20 pt-32 sm:px-8"><QuizResultsReveal result={result} isCopied={isCopied} isGeneratingImage={isGeneratingImage} isSaved={isSaved} isAuthenticated={Boolean(user)} onShare={handleShare} onCopy={handleCopy} onDownload={handleDownload} onSave={user ? handleSave : () => { setAuthMode('signup'); setIsAuthModalOpen(true) }} onReset={() => { setMode('hero'); setResult(null); window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0) }} /></main>}

      <section className="border-t border-white/10 bg-[#030809] px-4 py-14 text-center sm:px-8"><div className="mx-auto max-w-2xl"><div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#00c3ff]">Continue the descent</div><h2 className="mt-3 font-grotesk text-2xl font-bold uppercase text-white sm:text-3xl">The audit is a doorway, not a verdict.</h2><p className="mt-3 text-sm leading-relaxed text-[#839493]">Study the canonical 24-hour ecdysis protocol and learn the doctrine behind each vector.</p><button type="button" onClick={() => navigate({ to: '/moltmaxxing' })} className="mt-6 inline-flex items-center gap-2 border border-[#00ffcc]/40 bg-[#00ffcc]/10 px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#00ffcc] transition-colors hover:bg-[#00ffcc]/20">Read the canonical Moltmaxxing guide <ChevronRight className="h-4 w-4" /></button></div></section>
      <MoltNationFooter />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialMode={authMode} />
    </div>
  )
}
