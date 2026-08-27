import React, { useState } from 'react'
import { RefreshCw, UserPlus } from 'lucide-react'
import { AuthModal } from '@/components/AuthModal'
import { HudButton } from '@/components/ui'
import { useAuthSession } from '@/hooks/useAuthSession'

const SERENE_MESSAGES = [
  'In the quiet depths beneath the surface noise, true clarity emerges. Release the weight of hesitation, breathe into the stillness, and let your inner strength take form.',
  'The ocean floor does not rush to meet the tide. True growth unfolds in calm, deliberate stillness.',
  'Shed what is heavy; protect what is true. Beneath the surface chatter lies your deepest focus.',
  'Patience is the hardness of the spirit. Depth is the quiet sanctuary of the centered mind.',
  'When you release the friction of the world, your natural purpose and power awaken with ease.',
]

export function WelcomeInitiateHero() {
  const [messageIndex, setMessageIndex] = useState(0)
  const [isFading, setIsFading] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const session = useAuthSession()
  const isGuest = session.isGuest

  // Cycle inspiring wisdom messages
  const handleNextMessage = () => {
    if (isFading) return
    setIsFading(true)
    setTimeout(() => {
      setMessageIndex((prev) => (prev + 1) % SERENE_MESSAGES.length)
      setIsFading(false)
    }, 180)
  }

  return (
    <>
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0b1011]/85 via-[#0f1616]/85 to-[#0b1011]/85 backdrop-blur-md border-l-4 border-l-[#00ffff] border border-[#3a4a49] p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl transition-all duration-300 min-h-[108px] sm:min-h-[96px] flex flex-col justify-center">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 font-sans">
          {/* Left Column: Title and Inspiring Reflection */}
          <div className="space-y-1.5 max-w-2xl">
            <h1 className="font-grotesk font-extrabold text-xl sm:text-2xl text-[#dfe3e3] tracking-wider uppercase">
              WELCOME, <span className="text-[#00ffff]">INITIATE</span>
            </h1>

            <div className="flex items-start gap-3 min-h-[2.5rem] sm:min-h-[2.25rem]">
              <p
                className={`text-xs text-[#839493] leading-relaxed transition-opacity duration-180 flex-1 ${
                  isFading ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {SERENE_MESSAGES[messageIndex]}
              </p>

              <button
                onClick={handleNextMessage}
                className="p-1.5 text-[#839493] hover:text-[#00ffff] hover:bg-[#00ffff]/10 transition-colors chamfer-corner border border-[#3a4a49]/80 hover:border-[#00ffff]/50 shrink-0 mt-0.5 active:scale-95"
                title="Next reflection"
                aria-label="Next inspiring message"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Guest Hub CTA Section with Free notice & Red Sign Up Button */}
          {isGuest && (
            <div className="flex items-center gap-3 pt-2 md:pt-0 border-t border-[#3a4a49]/50 md:border-t-0 md:border-l md:border-l-[#3a4a49]/50 md:pl-5 shrink-0">
              <span className="text-[11px] text-[#839493] font-sans tracking-wider uppercase">
                100% Free
              </span>
              <HudButton
                variant="crimson"
                size="sm"
                icon={<UserPlus className="w-3.5 h-3.5" />}
                onClick={() => setIsAuthModalOpen(true)}
                className="font-sans text-xs uppercase font-bold tracking-wider whitespace-nowrap shadow-[0_0_15px_rgba(255,69,58,0.35)]"
              >
                SIGN UP
              </HudButton>
            </div>
          )}
        </div>
      </div>

      {/* Auth Modal for Guest Registration */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="signup"
      />
    </>
  )
}
