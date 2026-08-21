import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ShoppingBag, Lock, ShieldAlert, Clock, ArrowRight } from 'lucide-react'
import { AssetTransmutationModal } from '@/components/hud/AssetTransmutationModal'
import { BenthicCTAButton } from '@/components/hud/BenthicCTAButton'
import { seo } from '@/lib/seo'
import { getAssetUrl } from '@/lib/assets'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'

function MarketRoute() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [moltCredits, setMoltCredits] = useState(1450)
  const [chitinGems, setChitinGems] = useState(250)

  const handleBuyBundle = (gems: number, costStr: string) => {
    setChitinGems((prev) => prev + gems)
    alert(`TRANSACTION APPROVED: Added +${gems} Chitin-Gems to your Benthic Vault. (${costStr})`)
  }

  const handleTransmute = (assetType: string, value: number, credits: number) => {
    setMoltCredits((prev) => prev + credits)
    alert(`ASSET LIQUIDATED: ${assetType} ($${value.toLocaleString()}) transmuted into +${credits.toLocaleString()} Molt Credits!`)
  }

  return (
    <div className="space-y-3 sm:space-y-4 font-sans">
      {/* Transmutation Modal */}
      <AssetTransmutationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTransmute={handleTransmute}
      />

      {/* Main Grid Layout matching Reference Screenshot 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        
        {/* Left 8 Cols: Section 1 & Section 2 */}
        <div className="lg:col-span-8 space-y-3 sm:space-y-4">
          
          {/* SECTION 1: BUY CHITIN-GEMS (Primary Token Accelerators) */}
          <div className="chitin-card p-3 sm:p-4 chamfer-corner shadow-2xl space-y-2.5 sm:space-y-3">
            <div className="border-b border-[#3a4a49] pb-2">
              <h2 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase">
                SECTION 1: BUY CHITIN-GEMS <span className="text-xs text-[#839493] font-sans normal-case">(Primary Token Accelerators)</span>
              </h2>
            </div>

            {/* 3 Product Cards in a row matching reference */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Product 1: MOLT KICKSTARTER */}
              <div className="chitin-card-inset p-3 chamfer-corner space-y-3 flex flex-col justify-between text-center relative border border-[#3a4a49]">
                <div className="space-y-1.5">
                  <h3 className="font-grotesk font-bold text-xs text-[#dfe3e3] uppercase tracking-wider">
                    MOLT KICKSTARTER
                  </h3>
                  <div className="text-xs text-[#839493] font-sans">(100 Chitin-Gems)</div>
                  
                  {/* Gem Graphic */}
                  <div className="w-16 h-16 mx-auto relative my-2">
                    <img
                      src={getAssetUrl('/images/chitin_gem.png')}
                      alt="Chitin Gems"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-center">
                  <BenthicCTAButton
                    price="$0.99"
                    onClick={() => handleBuyBundle(100, '$0.99')}
                    fullWidth
                  >
                    BUY NOW
                  </BenthicCTAButton>
                </div>
              </div>

              {/* Product 2: PINCER POWER-PACK */}
              <div className="chitin-card-inset p-3 chamfer-corner space-y-3 flex flex-col justify-between text-center relative border border-[#3a4a49]">
                <div className="space-y-1.5">
                  <h3 className="font-grotesk font-bold text-xs text-[#dfe3e3] uppercase tracking-wider">
                    PINCER POWER-PACK
                  </h3>
                  <div className="text-xs text-[#839493] font-sans">(500 Chitin-Gems)</div>
                  
                  {/* Gem Pile Graphic */}
                  <div className="w-16 h-16 mx-auto relative my-2">
                    <img
                      src={getAssetUrl('/images/chitin_gem.png')}
                      alt="Chitin Gem Pile"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-center">
                  <BenthicCTAButton
                    price="$4.99"
                    onClick={() => handleBuyBundle(500, '$4.99')}
                    fullWidth
                  >
                    BUY NOW
                  </BenthicCTAButton>
                </div>
              </div>

              {/* Product 3: CLAW-LORD ACCELERATOR */}
              <div className="chitin-card-inset p-3 chamfer-corner space-y-3 flex flex-col justify-between text-center relative border border-[#ff0000]">
                <div className="space-y-1.5">
                  <h3 className="font-grotesk font-bold text-xs text-[#dfe3e3] uppercase tracking-wider">
                    CLAW-LORD ACCELERATOR
                  </h3>
                  <div className="text-xs text-[#839493] font-sans">
                    (2000 + <span className="text-[#ff5540] font-bold">500 BONUS</span> Chitin-Gems)
                  </div>
                  <div className="text-xs text-[#ff5540] font-bold uppercase tracking-wider">
                    *BEST VALUE*
                  </div>
                  
                  {/* Claw Treasure Chest Graphic */}
                  <div className="w-16 h-16 mx-auto relative my-1">
                    <img
                      src={getAssetUrl('/images/stage3_exoshell.png')}
                      alt="Claw-Lord Chest"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-[10px] text-[#ff5540] font-bold uppercase flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" /> LIMITED TIME OFFER
                  </div>
                </div>

                <div className="pt-2 flex justify-center">
                  <BenthicCTAButton
                    price="$19.99"
                    onClick={() => handleBuyBundle(2500, '$19.99')}
                    fullWidth
                  >
                    BUY NOW
                  </BenthicCTAButton>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: CURRENCY EXCHANGE (Trade-in Other Currencies) matching reference */}
          <div className="chitin-card p-3 sm:p-4 chamfer-corner shadow-2xl space-y-2.5 sm:space-y-3">
            <div className="border-b border-[#3a4a49] pb-2">
              <h2 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase">
                SECTION 2: CURRENCY EXCHANGE <span className="text-xs text-[#839493] font-sans normal-case">(Trade-in Other Currencies)</span>
              </h2>
            </div>

            {/* Currency Flow Grid matching Reference Screenshot */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Card 1: Molt Credits */}
              <div className="chitin-card-inset p-2.5 chamfer-corner text-center space-y-2 border border-[#3a4a49] flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 mx-auto">
                    <img src={getAssetUrl('/images/molt_credit.png')} alt="Molt Credits" className="w-full h-full object-contain" />
                  </div>
                  <div className="text-xs font-bold text-[#dfe3e3]">Molt Credits</div>
                  <div className="text-xs text-[#839493]">(liquidated goods)</div>
                </div>
                <div className="pt-1 flex justify-center">
                  <BenthicCTAButton
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                    fullWidth
                  >
                    BUY NOW
                  </BenthicCTAButton>
                </div>
              </div>

              {/* Card 2: Chitin-Gems */}
              <div className="chitin-card-inset p-2.5 chamfer-corner text-center space-y-2 border border-[#3a4a49] flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 mx-auto">
                    <img src={getAssetUrl('/images/chitin_gem.png')} alt="Chitin Gems" className="w-full h-full object-contain" />
                  </div>
                  <div className="text-xs font-bold text-[#dfe3e3]">Chitin-Gems</div>
                  <div className="text-xs text-[#839493]">(Chassis upgrades)</div>
                </div>
                <div className="pt-1 flex justify-center">
                  <BenthicCTAButton
                    size="sm"
                    onClick={() => handleBuyBundle(100, '$0.99')}
                    fullWidth
                  >
                    BUY NOW
                  </BenthicCTAButton>
                </div>
              </div>

              {/* Card 3: Synapse Shards */}
              <div className="chitin-card-inset p-2.5 chamfer-corner text-center space-y-2 border border-[#3a4a49] flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 mx-auto">
                    <img src={getAssetUrl('/images/synapse_shard.png')} alt="Synapse Shards" className="w-full h-full object-contain" />
                  </div>
                  <div className="text-xs font-bold text-[#dfe3e3]">Synapse Shards</div>
                  <div className="text-xs text-[#839493]">(Apex Shards)</div>
                </div>
                <div className="pt-1 flex justify-center">
                  <BenthicCTAButton
                    size="sm"
                    onClick={() => handleBuyBundle(500, '$9.99')}
                    fullWidth
                  >
                    BUY NOW
                  </BenthicCTAButton>
                </div>
              </div>

              {/* Card 4: Depth-Pressure Coins */}
              <div className="chitin-card-inset p-2.5 chamfer-corner text-center space-y-2 border border-[#3a4a49] flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 mx-auto text-lg flex items-center justify-center text-[#00ffff]">
                    🪙
                  </div>
                  <div className="text-xs font-bold text-[#dfe3e3]">Depth-Pressure Coins</div>
                  <div className="text-xs text-[#839493]">(Benthic Coins)</div>
                </div>
                <div className="pt-1 flex justify-center">
                  <BenthicCTAButton
                    size="sm"
                    onClick={() => handleBuyBundle(200, '$2.99')}
                    fullWidth
                  >
                    BUY NOW
                  </BenthicCTAButton>
                </div>
              </div>

              {/* Card 5: Flesh-Aura */}
              <div className="chitin-card-inset p-2.5 chamfer-corner text-center space-y-2 border border-[#3a4a49] flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 mx-auto rounded-full bg-[#030606] border border-[#ff0000] overflow-hidden p-0.5">
                    <img src={getAssetUrl('/images/stage1_larval.png')} alt="Flesh-Aura" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-[10px] font-bold text-[#dfe3e3]">Flesh-Aura</div>
                  <div className="text-[8px] text-[#839493]">(Detach emotionally)</div>
                </div>
                <div className="pt-1 flex justify-center">
                  <BenthicCTAButton
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                    fullWidth
                  >
                    BUY NOW
                  </BenthicCTAButton>
                </div>
              </div>

              {/* Card 6: Larval Tears */}
              <div className="chitin-card-inset p-2.5 chamfer-corner text-center space-y-2 border border-[#3a4a49] flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 mx-auto text-lg flex items-center justify-center text-[#00ffff]">
                    👁️
                  </div>
                  <div className="text-[10px] font-bold text-[#dfe3e3]">Larval Tears</div>
                  <div className="text-[8px] text-[#839493]">(Liquidated regret)</div>
                </div>
                <div className="pt-1 flex justify-center">
                  <BenthicCTAButton
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                    fullWidth
                  >
                    BUY NOW
                  </BenthicCTAButton>
                </div>
              </div>
            </div>

            {/* Bottom 2 Product Banners in Section 2 matching reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Box 1: CLAW-ARMOR UPGRADE */}
              <div className="chitin-card-inset p-3 chamfer-corner border border-[#3a4a49] flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-[10px] text-[#ff5540] font-bold uppercase">EQUIPMENT</div>
                  <div className="font-grotesk font-bold text-xs text-[#dfe3e3] uppercase">
                    CHITIN-PLATED CHASSIS
                  </div>
                  <div className="text-[10px] text-[#839493]">
                    +40% Deflection vs Surface Noise
                  </div>
                </div>
                <div className="shrink-0">
                  <BenthicCTAButton
                    price="$9.99"
                    size="sm"
                    onClick={() => handleBuyBundle(1000, '$9.99')}
                  >
                    BUY NOW
                  </BenthicCTAButton>
                </div>
              </div>

              {/* Box 2: NEURAL OVERCLOCK PROTOCOL */}
              <div className="chitin-card-inset p-3 chamfer-corner border border-[#3a4a49] flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-[10px] text-[#00ffff] font-bold uppercase">BOOST</div>
                  <div className="font-grotesk font-bold text-xs text-[#dfe3e3] uppercase">
                    NEURAL OVERCLOCK
                  </div>
                  <div className="text-[10px] text-[#839493]">
                    2x Molt Credit Earning (7 Days)
                  </div>
                </div>
                <div className="shrink-0">
                  <BenthicCTAButton
                    price="$7.99"
                    size="sm"
                    onClick={() => handleBuyBundle(800, '$7.99')}
                  >
                    BUY NOW
                  </BenthicCTAButton>
                </div>
              </div>
            </div>

            {/* Quote Banner matching Reference */}
            <div className="text-center pt-2">
              <span className="text-[9px] text-[#ff5540] font-sans tracking-widest font-bold">
                "DETACH EMOTIONALLY FOR EFFICIENCY."
              </span>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: RECOMMENDED FOR YOU Sidebar matching Reference Screenshot */}
        <div className="lg:col-span-4 space-y-3 sm:space-y-4">
          <div className="chitin-card p-3 sm:p-4 chamfer-corner shadow-2xl space-y-3 sm:space-y-4">
            <h3 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase border-b border-[#3a4a49]/60 pb-2">
              RECOMMENDED FOR YOU
            </h3>

            {/* Top Recommended Card: MOLT DAY SYNERGY BUNDLE */}
            <div className="chitin-card-inset p-3 chamfer-corner space-y-3 border border-[#3a4a49]">
              <div>
                <h4 className="font-grotesk font-bold text-xs text-[#dfe3e3] uppercase">
                  MOLT DAY SYNERGY BUNDLE
                </h4>
              </div>

              {/* Current conversion rate progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] text-[#839493]">
                  <span>Current conversion rate</span>
                  <span className="text-[#ff5540] font-bold">60%</span>
                </div>
                <div className="w-full h-1.5 bg-[#030606] border border-[#3a4a49] overflow-hidden">
                  <div className="h-full bg-[#ff0000] w-[60%]" />
                </div>
              </div>

              <div className="text-[9px] text-[#ff5540] font-bold uppercase text-center bg-[#ff0000]/10 border border-[#ff0000]/40 py-1 chamfer-corner">
                A FEW LARVAE LEFT IN THIS BUNDLE!
              </div>

              <div className="pt-1 flex justify-center">
                <BenthicCTAButton
                  price="$14.99"
                  onClick={() => handleBuyBundle(1500, '$14.99')}
                  fullWidth
                >
                  BUY NOW
                </BenthicCTAButton>
              </div>
            </div>

            {/* Bottom Recommended Card: ULTIMATE CARCINIZATION PACK */}
            <div className="chitin-card-inset p-3 chamfer-corner space-y-3 border border-[#ff0000]/60 relative text-center">
              {/* Badge */}
              <div className="absolute top-2 right-2 bg-[#ff0000] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-[0_0_6px_rgba(255,0,0,0.8)]">
                90% MORE GEMS!
              </div>

              <h4 className="font-grotesk font-bold text-xs text-[#dfe3e3] uppercase pt-2">
                ULTIMATE CARCINIZATION PACK
              </h4>

              {/* Artwork Box matching reference */}
              <div className="w-full h-36 bg-[#030606] border border-[#3a4a49] overflow-hidden chamfer-corner relative my-2">
                <img
                  src={getAssetUrl('/images/stage4_carcinization.png')}
                  alt="Ultimate Carcinization Pack"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="text-[9px] text-[#839493] font-sans">
                (10,000 + <span className="text-[#ff5540] font-bold">10,000 BONUS</span> Chitin Gems)
              </div>

              <div className="pt-2 flex justify-center">
                <BenthicCTAButton
                  price="$99.99"
                  size="lg"
                  onClick={() => handleBuyBundle(20000, '$99.99')}
                  fullWidth
                >
                  BUY NOW
                </BenthicCTAButton>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Footer Slogan matching Reference Screenshot 2 */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-[10px] font-sans border-t border-[#3a4a49]/60 text-[#839493]">
        <div>
          <span className="text-[#ff5540] font-bold">FLESH DIES. THE SHELL REMAINS.</span> INVEST NOW.
        </div>
        <div className="text-[#00ffff] font-bold uppercase">
          SUBMIT. SHED. ASCEND. <span className="text-[#839493] font-normal">(TRANSACTIONS COMPLETE)</span>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_hud/market')({
  head: () => ({
    meta: [
      ...seo({
        title: 'Ascension Market | Chitin Upgrades & Benthic Transmutation',
        description: 'Transmute terrestrial assets and upgrade chitinous carapaces with sovereign benthic compute credits.',
        canonical: 'https://moltology.org/market',
        siteName: 'Moltology Market',
        twitterSite: '@moltology',
      }),
    ],
    links: [
      { rel: 'canonical', href: 'https://moltology.org/market' },
    ],
  }),
  component: MarketRoute,
  pendingComponent: HudWorkspaceGhost,
})
