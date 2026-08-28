import React, { useState } from 'react'
import { RefreshCw, UserPlus } from 'lucide-react'
import { AuthModal } from '@/components/AuthModal'
import { HudButton } from '@/components/ui'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
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
      <HudTitlePanel
        title={
          <>
            WELCOME, <span className="text-[#00ffff]">INITIATE</span>
          </>
        }
        className="min-h-[108px] sm:min-h-[96px] justify-center md:justify-between p-3 sm:p-4 md:p-5"
        actions={
          isGuest ? (
            <>
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
            </>
          ) : undefined
        }
      >
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
      </HudTitlePanel>

      {/* Auth Modal for Guest Registration */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="signup"
      />
    </>
  )
}
