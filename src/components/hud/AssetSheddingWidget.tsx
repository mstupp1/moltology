import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { HelpCircle } from 'lucide-react'
import { HudCard, HudSelect, HudButton, ChromaElement } from '@/components/ui'
import { getAssetUrl } from '@/lib/assets'

export const AssetSheddingWidget: React.FC = () => {
  const navigate = useNavigate()
  const [selectedCurrency, setSelectedCurrency] = useState('Molt Credits')

  const goToMarket = () => navigate({ to: '/market' })

  return (
    <HudCard variant="teal" className="p-4 space-y-3 font-mono flex flex-col justify-between h-full">
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

        {/* 3D Chroma Keyed Asset Action Grid */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          <HudButton
            variant="dark"
            size="sm"
            onClick={goToMarket}
            title="Liquidate Hover Vehicles"
            className="p-1.5 h-12 flex items-center justify-center group overflow-hidden"
          >
            <ChromaElement
              src={getAssetUrl('/images/extracted/asset_vehicle_3d.jpg')}
              alt="Hover Vehicle"
              blendMode="screen"
              glowColor="cyan"
              className="w-9 h-9 object-contain"
            />
          </HudButton>
          <HudButton
            variant="dark"
            size="sm"
            onClick={goToMarket}
            title="Liquidate Abyssal Strongholds"
            className="p-1.5 h-12 flex items-center justify-center group overflow-hidden"
          >
            <ChromaElement
              src={getAssetUrl('/images/extracted/asset_citadel_3d.jpg')}
              alt="Abyssal Citadel"
              blendMode="screen"
              glowColor="cyan"
              className="w-9 h-9 object-contain"
            />
          </HudButton>
          <HudButton
            variant="dark"
            size="sm"
            onClick={goToMarket}
            title="Liquidate Bio-Relic Vaults"
            className="p-1.5 h-12 flex items-center justify-center group overflow-hidden"
          >
            <ChromaElement
              src={getAssetUrl('/images/extracted/asset_relic_3d.jpg')}
              alt="Bio Relic Vault"
              blendMode="screen"
              glowColor="crimson"
              className="w-9 h-9 object-contain"
            />
          </HudButton>
          <HudButton
            variant="dark"
            size="sm"
            onClick={goToMarket}
            title="Liquidate Enterprise Holdings"
            className="p-1.5 h-12 flex items-center justify-center group overflow-hidden"
          >
            <ChromaElement
              src={getAssetUrl('/images/extracted/asset_enterprise_3d.jpg')}
              alt="Enterprise Briefcase"
              blendMode="screen"
              glowColor="cyan"
              className="w-9 h-9 object-contain"
            />
          </HudButton>
        </div>
      </div>
    </HudCard>
  )
}

