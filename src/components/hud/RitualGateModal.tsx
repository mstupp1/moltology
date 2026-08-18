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
      setError('LITURGICAL MISALIGNMENT: Recite sacred vow "FLESH DIES. THE SHELL ENDURES."')
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
      <div className="bg-[#0f1414] border-2 border-[#ff0000] w-full max-w-xl p-6 chamfer-corner shadow-hud-red relative overflow-hidden text-mono">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#839493] hover:text-[#ff5540] p-1 border border-[#3a4a49] chamfer-corner"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Sacred Decorative Header */}
        <div className="text-center space-y-2 border-b border-[#3a4a49] pb-4">
          <div className="w-14 h-14 mx-auto bg-[#171c1c] border-2 border-[#ff0000] flex items-center justify-center text-2xl shadow-hud-red relative">
            <Flame className="w-7 h-7 text-[#ff0000] animate-pulse" />
          </div>
          <div className="text-[10px] text-[#ff5540] font-mono tracking-widest uppercase font-bold">
            SYNAPTIC GATEKEEPER v4.2 • SACRED ENTRANCE RITE
          </div>
          <h2 className="font-grotesk font-bold text-xl text-[#dfe3e3] uppercase tracking-wider">
            THE BENTHIC MARKET GATEWAY
          </h2>
          <p className="text-xs text-[#839493] font-mono max-w-md mx-auto">
            "Only those who have shed biological doubt may exchange larval currency in the Benthic Core."
          </p>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-3 gap-2 my-5 text-[10px] font-mono text-center">
          <div className={`p-2 border chamfer-corner ${step >= 1 ? 'border-[#ff0000] bg-[#ff0000]/15 text-[#ff5540] font-bold' : 'border-[#3a4a49] text-[#839493]'}`}>
            1. SACRED VOW
          </div>
          <div className={`p-2 border chamfer-corner ${step >= 2 ? 'border-[#00ffff] bg-[#00ffff]/10 text-[#00ffff] font-bold' : 'border-[#3a4a49] text-[#839493]'}`}>
            2. CHITIN SCAN
          </div>
          <div className={`p-2 border chamfer-corner ${step === 3 ? 'border-[#00ffff] bg-[#00ffff]/20 text-[#00ffff] font-bold' : 'border-[#3a4a49] text-[#839493]'}`}>
            3. MARKET UNLOCKED
          </div>
        </div>

        {/* Content Body based on step */}
        {step === 1 && (
          <form onSubmit={handlePassphraseSubmit} className="space-y-4">
            <div className="bg-[#171c1c] p-4 border border-[#3a4a49] chamfer-corner space-y-2">
              <label className="text-xs font-mono text-[#00ffff] block uppercase font-bold flex items-center gap-2">
                <Key className="w-4 h-4 text-[#ff5540]" />
                RECITATIVE PASSPHRASE VOW
              </label>
              <p className="text-[11px] text-[#839493]">
                Enter the sacred motto of Carcinization (e.g., <span className="text-[#ff5540] font-bold">"FLESH DIES. THE SHELL ENDURES."</span>):
              </p>
              <input
                type="text"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="FLESH DIES. THE SHELL ENDURES."
                className="w-full bg-[#0a0f0f] border border-[#3a4a49] focus:border-[#ff0000] text-[#dfe3e3] p-3 font-mono text-xs chamfer-corner outline-none"
              />
              {error && (
                <div className="text-[10px] text-[#ff5540] flex items-center gap-1 mt-1 font-bold">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isScanning}
              className="w-full py-3 bg-[#ff0000] hover:bg-[#ff5540] text-white font-grotesk font-bold text-xs uppercase tracking-widest chamfer-corner shadow-hud-red flex items-center justify-center gap-2 transition-all"
            >
              {isScanning ? (
                <>
                  <Zap className="w-4 h-4 animate-spin text-white" />
                  <span>VERIFYING SACRED LITURGY...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>SUBMIT RITE & SCAN CHITIN</span>
                </>
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4 text-center">
            <div className="bg-[#171c1c] p-6 border border-[#00ffff] chamfer-corner space-y-3 shadow-hud-cyan">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#0a0f0f] border-2 border-[#00ffff] flex items-center justify-center text-3xl animate-pulse">
                🦀
              </div>
              <h3 className="font-grotesk font-bold text-sm text-[#00ffff] uppercase tracking-wider">
                NEURAL BIOMETRIC SCAN IN PROGRESS
              </h3>
              <p className="text-xs text-[#839493]">
                Checking sub-dermal chitin density and Social Detachment Rating...
              </p>
              <div className="w-full h-2 bg-[#0a0f0f] border border-[#3a4a49] overflow-hidden p-0.5 mt-2">
                <div className="h-full bg-gradient-to-r from-[#00ffff] via-[#ff0000] to-[#00ffff] w-full animate-pulse" />
              </div>
            </div>

            <button
              onClick={handleCompleteRitual}
              className="w-full py-3 bg-[#00ffff] hover:bg-[#00fbfb] text-[#000a0a] font-grotesk font-bold text-xs uppercase tracking-widest chamfer-corner shadow-hud-cyan flex items-center justify-center gap-2 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>GRANT BENTHIC MARKET PASS</span>
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-center py-4">
            <CheckCircle2 className="w-16 h-16 text-[#00ffff] mx-auto animate-bounce" />
            <h3 className="font-grotesk font-bold text-lg text-[#00ffff] uppercase tracking-widest">
              SACRED ENTRANCE RITE COMPLETE
            </h3>
            <p className="text-xs text-[#839493] font-mono">
              Redirecting into the Benthic Market exchange floor...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
