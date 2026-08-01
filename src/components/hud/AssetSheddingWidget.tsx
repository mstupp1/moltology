import React, { useState } from 'react'
import { HelpCircle, Car, Home, Gift, Briefcase, ChevronDown } from 'lucide-react'

export const AssetSheddingWidget: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('Molt Credits')

  return (
    <div className="chitin-card p-4 chamfer-corner shadow-2xl space-y-3 font-mono select-none flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase">
            ASSET SHEDDING OVERVIEW
          </h3>
          <HelpCircle className="w-3.5 h-3.5 text-[#00ffff]" />
        </div>
        <p className="text-[9px] text-[#839493] mt-0.5 leading-relaxed">
          Liquidizes assets to liquidate goods for non-conforming geeks.
        </p>
      </div>

      {/* Select Dropdown matching reference */}
      <div className="relative">
        <select
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className="w-full bg-[#070b0b] border border-[#3a4a49] text-[#00ffff] font-bold text-xs p-2 appearance-none focus:outline-none focus:border-[#00ffff] chamfer-corner cursor-pointer"
        >
          <option value="Molt Credits">Molt Credits</option>
          <option value="Chitin-Gems">Chitin-Gems</option>
          <option value="Synapse Shards">Synapse Shards</option>
        </select>
        <ChevronDown className="w-4 h-4 text-[#00ffff] absolute right-2 top-2.5 pointer-events-none" />
      </div>

      {/* Balance Section matching reference */}
      <div className="space-y-2 pt-1">
        <div className="text-[10px] font-bold text-[#dfe3e3] uppercase tracking-wider flex items-center justify-between">
          <span>MOLT CREDITS BALANCE</span>
          <span className="text-[8px] text-[#839493]">Running total</span>
        </div>

        {/* Icon Action Grid matching Reference Screenshot (Car, House, Gift, Luxury Car) */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          <button 
            onClick={() => onNavigate && onNavigate('/market')}
            className="p-2.5 bg-[#070b0b] border border-[#3a4a49] hover:border-[#00ffff] text-[#00ffff] flex items-center justify-center chamfer-corner transition-colors group"
            title="Liquidate Vehicles"
          >
            <Car className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('/market')}
            className="p-2.5 bg-[#070b0b] border border-[#3a4a49] hover:border-[#00ffff] text-[#00ffff] flex items-center justify-center chamfer-corner transition-colors group"
            title="Liquidate Real Estate"
          >
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('/market')}
            className="p-2.5 bg-[#070b0b] border border-[#3a4a49] hover:border-[#00ffff] text-[#00ffff] flex items-center justify-center chamfer-corner transition-colors group"
            title="Liquidate Luxury Assets"
          >
            <Gift className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('/market')}
            className="p-2.5 bg-[#070b0b] border border-[#3a4a49] hover:border-[#00ffff] text-[#00ffff] flex items-center justify-center chamfer-corner transition-colors group"
            title="Liquidate Business Holdings"
          >
            <Briefcase className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  )
}
