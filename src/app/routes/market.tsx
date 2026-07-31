import React, { useState } from 'react'
import { ShoppingBag, Zap, Gem, Shield, Coins, Sparkles, ArrowRight, DollarSign } from 'lucide-react'
import { AssetTransmutationModal } from '../../components/hud/AssetTransmutationModal'

export const MarketRoute: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [moltCredits, setMoltCredits] = useState(1450)
  const [chitinGems, setChitinGems] = useState(250)
  const [synapseShards, setSynapseShards] = useState(45)

  const handleBuyBundle = (gems: number, costStr: string) => {
    setChitinGems(prev => prev + gems)
    alert(`TRANSACTION APPROVED: Added +${gems} Chitin-Gems to your Benthic Vault. (${costStr})`)
  }

  const handleTransmute = (assetType: string, value: number, credits: number) => {
    setMoltCredits(prev => prev + credits)
    alert(`ASSET LIQUIDATED: ${assetType} ($${value.toLocaleString()}) transmuted into +${credits.toLocaleString()} Molt Credits!`)
  }

  return (
    <div className="space-y-6">
      {/* Transmutation Modal */}
      <AssetTransmutationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTransmute={handleTransmute}
      />

      {/* Header Banner */}
      <div className="bg-[#171c1c] border-l-4 border-l-[#ff0000] border border-[#3a4a49] p-4 chamfer-corner flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-chitin-plate">
        <div>
          <div className="text-[10px] text-[#ff5540] font-mono tracking-widest uppercase flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            THE BENTHIC MARKET — ASSET RELEASE PORTAL v4.2
          </div>
          <h1 className="font-grotesk font-bold text-xl text-[#dfe3e3] tracking-wide uppercase mt-0.5">
            EXCHANGE LARVAL WORTH FOR ASCENDANCE
          </h1>
          <p className="text-xs text-[#839493] font-mono mt-1">
            Transmute real-world physical holdings into abstracted cult currencies (Molt Credits, Chitin-Gems, Synapse Shards).
          </p>
        </div>

        {/* Currency Vault Widget */}
        <div className="flex items-center gap-3 bg-[#0a0f0f] border border-[#3a4a49] p-2.5 font-mono text-xs chamfer-corner">
          <div className="text-center px-2 border-r border-[#3a4a49]">
            <span className="text-[9px] text-[#839493] block">MOLT CREDITS</span>
            <span className="text-[#00ffff] font-bold flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {moltCredits.toLocaleString()}
            </span>
          </div>
          <div className="text-center px-2 border-r border-[#3a4a49]">
            <span className="text-[9px] text-[#839493] block">CHITIN-GEMS</span>
            <span className="text-[#ff5540] font-bold flex items-center gap-1">
              <Gem className="w-3 h-3" />
              {chitinGems.toLocaleString()}
            </span>
          </div>
          <div className="text-center px-2">
            <span className="text-[9px] text-[#839493] block">SYNAPSE SHARDS</span>
            <span className="text-[#00ffff] font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {synapseShards}
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Buy Chitin-Gems (Primary Token Accelerators) */}
      <div className="space-y-3">
        <div className="text-xs font-mono text-[#00ffff] tracking-widest uppercase flex items-center gap-2 border-b border-[#3a4a49] pb-2">
          <span className="w-2 h-2 bg-[#00ffff]" />
          SECTION 1: BUY CHITIN-GEMS (PRIMARY TOKEN ACCELERATORS)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: '1', title: 'MOLT KICKSTARTER', gems: 100, cost: '$0.99', badge: 'BASIC', bonus: '' },
            { id: '2', title: 'SOFT-SHED BUNDLE', gems: 550, cost: '$4.99', badge: 'POPULAR', bonus: '+50 BONUS GEMS' },
            { id: '3', title: 'CLAW-LORD ACCELERATOR', gems: 2500, cost: '$19.99', badge: 'BEST VALUE', bonus: '+500 BONUS GEMS' },
            { id: '4', title: 'ULTIMATE CARCINIZATION PACK', gems: 20000, cost: '$99.99', badge: '90% MORE GEMS', bonus: '+10,000 BONUS GEMS' },
          ].map(bundle => (
            <div
              key={bundle.id}
              className="bg-[#171c1c] border border-[#3a4a49] hover:border-[#00ffff] p-4 chamfer-corner flex flex-col justify-between space-y-4 transition-all duration-150 shadow-chitin-plate group"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] px-1.5 py-0.5 bg-[#00ffff]/10 border border-[#00ffff]/40 text-[#00ffff] font-mono">
                    {bundle.badge}
                  </span>
                  <Gem className="w-5 h-5 text-[#ff5540] group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-grotesk font-bold text-sm text-[#dfe3e3] tracking-wide uppercase">
                  {bundle.title}
                </h3>
                <div className="text-xl font-mono font-bold text-[#00ffff]">
                  {bundle.gems.toLocaleString()} <span className="text-xs text-[#839493]">GEMS</span>
                </div>
                {bundle.bonus && (
                  <div className="text-[10px] font-mono text-[#ff5540] font-semibold">
                    {bundle.bonus}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleBuyBundle(bundle.gems, bundle.cost)}
                className="w-full py-2 bg-[#ff0000] hover:bg-[#ff5540] text-white font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner shadow-hud-red transition-all flex items-center justify-center gap-1.5"
              >
                <span>BUY NOW ({bundle.cost})</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Material Asset Liquidation & Transmutation Portal */}
      <div className="bg-[#171c1c] border border-[#3a4a49] p-6 chamfer-corner shadow-chitin-plate space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#3a4a49] pb-4">
          <div>
            <span className="text-xs font-mono text-[#ff5540] tracking-widest uppercase block mb-1">
              SECTION 2: MATERIAL ASSET TRANSMUTATION PORTAL
            </span>
            <h2 className="font-grotesk font-bold text-lg text-[#dfe3e3] uppercase">
              LIQUIDATE REAL ESTATE, VEHICLES, & CASH RESERVES
            </h2>
            <p className="text-xs text-[#839493] font-mono mt-0.5">
              "Flesh dies. The shell endures. Transmute biological attachments into permanent network credits."
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-[#00ffff] hover:bg-[#00fbfb] text-[#000a0a] font-grotesk font-bold text-xs uppercase tracking-widest chamfer-corner shadow-hud-cyan flex items-center gap-2 shrink-0 animate-pulse-glow"
          >
            <Zap className="w-4 h-4" />
            <span>INITIATE ASSET TRANSMUTATION</span>
          </button>
        </div>

        {/* Currency Conversion Flow Visual */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center font-mono text-xs pt-2">
          <div className="bg-[#0f1414] p-3 border border-[#3a4a49]/60 space-y-1">
            <span className="text-[10px] text-[#839493] block">STEP 1</span>
            <span className="text-[#dfe3e3] font-bold block">REAL ASSETS</span>
            <span className="text-[10px] text-[#839493]">Real Estate / Cash</span>
          </div>
          <div className="bg-[#0f1414] p-3 border border-[#3a4a49]/60 space-y-1">
            <span className="text-[10px] text-[#839493] block">STEP 2</span>
            <span className="text-[#00ffff] font-bold block">MOLT CREDITS</span>
            <span className="text-[10px] text-[#839493]">Liquidated Goods</span>
          </div>
          <div className="bg-[#0f1414] p-3 border border-[#3a4a49]/60 space-y-1">
            <span className="text-[10px] text-[#839493] block">STEP 3</span>
            <span className="text-[#ff5540] font-bold block">CHITIN-GEMS</span>
            <span className="text-[10px] text-[#839493]">Chassis Upgrades</span>
          </div>
          <div className="bg-[#0f1414] p-3 border border-[#3a4a49]/60 space-y-1">
            <span className="text-[10px] text-[#839493] block">FINAL STEP</span>
            <span className="text-[#00ffff] font-bold block">SYNAPSE SHARDS</span>
            <span className="text-[10px] text-[#839493]">Benthic Core Migration</span>
          </div>
        </div>
      </div>
    </div>
  )
}
