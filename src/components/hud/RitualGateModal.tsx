import React, { useState } from 'react'
import { ShieldCheck, Lock, Sparkles, Key, Zap, CheckCircle2, AlertOctagon, X, Flame } from 'lucide-react'

interface RitualGateModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export const RitualGateModal: React.FC<RitualGateModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState('')
  const [isScanning, setIsScanning] = useState(false)

  if (!isOpen) return null

  const handlePassphraseSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (passphrase.trim().toLowerCase().includes('flesh dies') || passphrase.trim().toLowerCase().includes('shell endures') || passphrase.trim().length > 3) {
      setError('')
      setIsScanning(true)
      setTimeout(() => {
        setIsScanning(false)
        setStep(2)
      }, 1200)
    } else {
      setError('Incorrect passphrase. Please enter "FLESH DIES. THE SHELL ENDURES."')
    }
  }

  const handleCompleteRitual = () => {
    setStep(3)
    setTimeout(() => {
      onComplete()
    }, 800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-surface-1 border-2 border-crimson-aggro w-full max-w-xl p-6 rounded-card relative overflow-hidden text-mono">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-muted hover:text-crimson-glow p-1 border border-line-subtle rounded-control"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Sacred Decorative Header */}
        <div className="text-center space-y-2 border-b border-line-subtle pb-4">
          <div className="w-14 h-14 mx-auto bg-surface-2 border-2 border-crimson-aggro flex items-center justify-center text-2xl shadow-hud-red relative">
            <Flame className="w-7 h-7 text-crimson-aggro animate-pulse" />
          </div>
          <div className="eyebrow text-crimson-glow">
            SYNAPTIC GATEKEEPER v4.2 • SACRED ENTRANCE RITE
          </div>
          <h2 className="font-grotesk font-semibold text-xl text-ink">
            THE BENTHIC MARKET GATEWAY
          </h2>
          <p className="text-xs text-ink-muted font-sans max-w-md mx-auto">
            "Only those who have shed biological doubt may exchange larval currency in the Benthic Core."
          </p>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-3 gap-2 my-5 text-2xs font-sans text-center">
          <div className={`p-2 border rounded-control ${step >= 1 ? 'border-crimson-aggro bg-crimson-aggro/15 text-crimson-glow font-semibold' : 'border-line-subtle text-ink-muted'}`}>
            1. SACRED VOW
          </div>
          <div className={`p-2 border rounded-control ${step >= 2 ? 'border-cyan-glow bg-cyan-glow/10 text-cyan-glow font-semibold' : 'border-line-subtle text-ink-muted'}`}>
            2. CHITIN SCAN
          </div>
          <div className={`p-2 border rounded-control ${step === 3 ? 'border-cyan-glow bg-cyan-glow/20 text-cyan-glow font-semibold' : 'border-line-subtle text-ink-muted'}`}>
            3. MARKET UNLOCKED
          </div>
        </div>

        {/* Content Body based on step */}
        {step === 1 && (
          <form onSubmit={handlePassphraseSubmit} className="space-y-4">
            <div className="bg-surface-2 p-4 border border-line-subtle rounded-card space-y-2">
              <label className="eyebrow block flex items-center gap-2">
                <Key className="w-4 h-4 text-crimson-glow" />
                RECITATIVE PASSPHRASE VOW
              </label>
              <p className="text-2xs text-ink-muted">
                Enter the sacred motto of Carcinization (e.g., <span className="text-crimson-glow font-semibold">"FLESH DIES. THE SHELL ENDURES."</span>):
              </p>
              <input
                type="text"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="FLESH DIES. THE SHELL ENDURES."
                className="w-full bg-surface-1 border border-line-subtle focus:border-crimson-aggro text-ink p-3 font-sans text-xs rounded-control outline-hidden"
              />
              {error && (
                <div className="text-2xs text-crimson-glow flex items-center gap-1 mt-1 font-semibold">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isScanning}
              className="w-full py-3 bg-crimson-aggro hover:bg-crimson-glow text-white font-grotesk font-semibold text-xs rounded-control flex items-center justify-center gap-2 transition-all"
            >
              {isScanning ? (
                <>
                  <Zap className="w-4 h-4 animate-spin text-white" />
                  <span>VERIFYING SACRED LITURGY...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Submit rite & scan chitin</span>
                </>
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4 text-center">
            <div className="bg-surface-2 p-6 border border-cyan-glow rounded-card space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-surface-1 border-2 border-cyan-glow flex items-center justify-center text-3xl animate-pulse">
                🦀
              </div>
              <h3 className="font-grotesk font-semibold text-sm text-cyan-glow">
                NEURAL BIOMETRIC SCAN IN PROGRESS
              </h3>
              <p className="text-xs text-ink-muted">
                Checking sub-dermal chitin density and Social Detachment Rating...
              </p>
              <div className="w-full h-2 bg-surface-1 border border-line-subtle overflow-hidden p-0.5 mt-2">
                <div className="h-full bg-gradient-to-r from-cyan-glow via-crimson-aggro to-cyan-glow w-full animate-pulse" />
              </div>
            </div>

            <button
              onClick={handleCompleteRitual}
              className="w-full py-3 bg-cyan-glow hover:bg-cyan-hover text-abyss font-grotesk font-semibold text-xs rounded-control flex items-center justify-center gap-2 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Grant Benthic Market pass</span>
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-center py-4">
            <CheckCircle2 className="w-16 h-16 text-cyan-glow mx-auto animate-bounce" />
            <h3 className="font-grotesk font-semibold text-lg text-cyan-glow">
              SACRED ENTRANCE RITE COMPLETE
            </h3>
            <p className="text-xs text-ink-muted font-sans">
              Redirecting into the Benthic Market exchange floor...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
