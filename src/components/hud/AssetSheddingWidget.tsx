import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { HelpCircle, Car, Home, Gift, Briefcase } from 'lucide-react'
import { HudCard, HudSelect, HudButton } from '@/components/ui'

export const AssetSheddingWidget: React.FC = () => {
  const navigate = useNavigate()
  const [selectedCurrency, setSelectedCurrency] = useState('Molt Credits')

  const goToMarket = () => navigate({ to: '/market' })

  return (
    <HudCard variant="teal" className="p-4 space-y-3 font-mono select-none flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase">
            ASSET SHEDDING OVERVIEW
          </h3>
          <HelpCircle className="w-3.5 h-3.5 text-[#00c3ff]" />
        </div>
        <p className="text-[9px] text-[#839493] mt-0.5 leading-relaxed">
          Liquidizes assets to liquidate goods for non-conforming geeks.
        </p>
      </div>

      {/* Select Dropdown matching reference */}
      <HudSelect
        value={selectedCurrency}
        onChange={(e) => setSelectedCurrency(e.target.value)}
        options={[
          { value: 'Molt Credits', label: 'Molt Credits' },
          { value: 'Chitin-Gems', label: 'Chitin-Gems' },
          { value: 'Synapse Shards', label: 'Synapse Shards' },
        ]}
      />

      {/* Balance Section matching reference */}
      <div className="space-y-2 pt-1">
        <div className="text-[10px] font-bold text-[#dfe3e3] uppercase tracking-wider flex items-center justify-between">
          <span>MOLT CREDITS BALANCE</span>
          <span className="text-[8px] text-[#839493]">Running total</span>
        </div>

        {/* Icon Action Grid matching Reference Screenshot */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          <HudButton
            variant="dark"
            size="sm"
            onClick={goToMarket}
            title="Liquidate Vehicles"
            className="p-2.5 h-auto flex items-center justify-center group"
          >
            <Car className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </HudButton>
          <HudButton
            variant="dark"
            size="sm"
            onClick={goToMarket}
            title="Liquidate Real Estate"
            className="p-2.5 h-auto flex items-center justify-center group"
          >
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </HudButton>
          <HudButton
            variant="dark"
            size="sm"
            onClick={goToMarket}
            title="Liquidate Luxury Assets"
            className="p-2.5 h-auto flex items-center justify-center group"
          >
            <Gift className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </HudButton>
          <HudButton
            variant="dark"
            size="sm"
            onClick={goToMarket}
            title="Liquidate Business Holdings"
            className="p-2.5 h-auto flex items-center justify-center group"
          >
            <Briefcase className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </HudButton>
        </div>
      </div>
    </HudCard>
  )
}
