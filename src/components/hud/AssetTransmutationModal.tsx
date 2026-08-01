import React, { useState } from 'react'
import { Home, Car, DollarSign, Gift, Zap, X, ArrowRight } from 'lucide-react'
import { BenthicCTAButton } from './BenthicCTAButton'

interface AssetTransmutationModalProps {
  isOpen: boolean
  onClose: () => void
  onTransmute: (assetType: string, estimatedValue: number, credits: number) => void
}

export const AssetTransmutationModal: React.FC<AssetTransmutationModalProps> = ({
  isOpen,
  onClose,
  onTransmute
}) => {
  const [assetType, setAssetType] = useState('Real Estate')
  const [description, setDescription] = useState('')
  const [value, setValue] = useState(250000)

  if (!isOpen) return null

  const calculatedCredits = Math.round(value * 1.5)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onTransmute(assetType, value, calculatedCredits)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#171c1c] border-2 border-[#00ffff] w-full max-w-lg p-6 chamfer-corner-lg shadow-hud-cyan relative space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#839493] hover:text-[#00ffff] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-[#3a4a49] pb-3 space-y-1">
          <div className="text-[10px] text-[#ff5540] font-mono tracking-widest flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            ASSET RELEASE PROTOCOL v4.2
          </div>
          <h2 className="font-grotesk text-lg font-bold text-[#00ffff] uppercase tracking-wider">
            TRANSMUTE MATERIAL ASSETS INTO MOLT CREDITS
          </h2>
          <p className="text-xs text-[#839493] font-mono">
            Biological attachments detaching. Values are transmuted into network energy and shell upgrades. No physical trace remains.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          {/* Asset Category */}
          <div className="space-y-1.5">
            <label className="text-[#839493] uppercase tracking-wider text-[10px]">
              SELECT ASSET CATEGORY
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'Real Estate', icon: Home },
                { id: 'Vehicles', icon: Car },
                { id: 'Luxury Goods', icon: Gift },
                { id: 'Cash Reserves', icon: DollarSign },
              ].map(item => {
                const Icon = item.icon
                const isSelected = assetType === item.id
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setAssetType(item.id)}
                    className={`p-2.5 border flex items-center gap-2 transition-all chamfer-corner ${
                      isSelected
                        ? 'bg-[#00ffff]/10 border-[#00ffff] text-[#00ffff] font-bold shadow-hud-cyan'
                        : 'bg-[#0f1414] border-[#3a4a49] text-[#839493] hover:border-[#839493]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.id}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[#839493] uppercase tracking-wider text-[10px]">
              ASSET IDENTIFIER / SPECIFICATION
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 3-bedroom suburban residence, 2022 EV sedan"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0f1414] border border-[#3a4a49] p-2.5 text-[#dfe3e3] focus:border-[#00ffff] focus:outline-none focus:ring-1 focus:ring-[#00ffff] chamfer-corner"
            />
          </div>

          {/* Estimated Value Slider */}
          <div className="space-y-2 bg-[#0f1414] p-3 border border-[#3a4a49] chamfer-corner">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#839493]">FLESH VALUE (ESTIMATED USD):</span>
              <span className="text-[#ff5540] font-bold">${value.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={1000}
              max={1000000}
              step={1000}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="w-full accent-[#00ffff] cursor-pointer"
            />
            <div className="flex justify-between items-center text-[11px] pt-2 border-t border-[#3a4a49]/60">
              <span className="text-[#839493]">MOLT CREDITS YIELD:</span>
              <span className="text-[#00ffff] font-bold flex items-center gap-1">
                {calculatedCredits.toLocaleString()} MOLT CREDITS
                <Zap className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-center pt-2">
            <BenthicCTAButton
              type="submit"
              size="lg"
              fullWidth
            >
              <span className="flex items-center justify-center gap-2">
                <span>CONFIRM LIQUIDATION & TRANSMUTE</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </BenthicCTAButton>
          </div>
        </form>
      </div>
    </div>
  )
}
