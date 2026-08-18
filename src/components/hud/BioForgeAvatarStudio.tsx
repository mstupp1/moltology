import React, { useState, useEffect } from 'react'
import {
  Sliders,
  Shield,
  Zap,
  Sparkles,
  Activity,
  Save,
  CheckCircle2,
  Cpu,
  Eye,
  Crosshair,
  Layers,
  Sparkle,
  Trash2,
  UserCheck,
  RefreshCw,
  Plus,
} from 'lucide-react'
import { HudCard, HudButton, HudBadge, ChromaElement } from '@/components/ui'
import { getAssetUrl } from '@/lib/assets'

export interface CosmeticItem {
  id: string
  name: string
  slot: 'head' | 'pincers' | 'carapace' | 'aura'
  stageRequired: number
  description: string
  overlayStyle: string
  iconText: string
}

export const COSMETIC_CATALOG: CosmeticItem[] = [
  // Head / Visor
  {
    id: 'visor_neon',
    name: 'NEON SYNAPSE VISOR',
    slot: 'head',
    stageRequired: 1,
    description: 'Targeting reticle HUD overlay calibrated for deep benthic darkness.',
    overlayStyle: 'box-shadow: 0 0 25px rgba(0, 255, 255, 0.6); border: 1px solid #00ffff;',
    iconText: '🥽',
  },
  {
    id: 'crown_chitin',
    name: 'CHITIN HORN CROWN',
    slot: 'head',
    stageRequired: 3,
    description: 'Calcified exoskeleton spikes focusing psychic broadcast waves.',
    overlayStyle: 'border-top: 3px solid #ff5540;',
    iconText: '👑',
  },
  // Pincers / Weapons
  {
    id: 'claw_plasma',
    name: 'HYDRAULIC PLASMA PINCER',
    slot: 'pincers',
    stageRequired: 2,
    description: 'Overclocked hydraulic claw capable of 1,200 kN crushing pressure.',
    overlayStyle: 'filter: drop-shadow(0 0 10px #ff5540);',
    iconText: '✂️',
  },
  {
    id: 'claw_arcblade',
    name: 'SYNAPTIC ARC-BLADE',
    slot: 'pincers',
    stageRequired: 4,
    description: 'High-frequency energy edge for cutting through surface doctrine.',
    overlayStyle: 'filter: drop-shadow(0 0 15px #00ffff);',
    iconText: '⚡',
  },
  // Carapace / Armor
  {
    id: 'armor_titanium',
    name: 'TITANIUM REINFORCED HULL',
    slot: 'carapace',
    stageRequired: 2,
    description: 'Sub-dermal alloy matrix granting immunity to abyssal pressure.',
    overlayStyle: 'border: 2px solid rgba(131, 148, 147, 0.8);',
    iconText: '🛡️',
  },
  {
    id: 'armor_biolum',
    name: 'BIOLUMINESCENT CARAPACE',
    slot: 'carapace',
    stageRequired: 3,
    description: 'Phosphorescent shell glow illuminating deep ocean trenches.',
    overlayStyle: 'box-shadow: inset 0 0 30px rgba(0, 255, 255, 0.4);',
    iconText: '✨',
  },
  // Aura / Atmosphere
  {
    id: 'aura_abyssal',
    name: 'ABYSSAL PRESSURE AURA',
    slot: 'aura',
    stageRequired: 1,
    description: 'Atmospheric distortion field generated at 10,000 fathoms depth.',
    overlayStyle: 'background: radial-gradient(circle, rgba(0,255,255,0.15) 0%, transparent 70%);',
    iconText: '🌊',
  },
  {
    id: 'aura_halo',
    name: 'CARCINUS HOLO-HALO',
    slot: 'aura',
    stageRequired: 4,
    description: 'Sacred luminescent ring certifying final carcinization ascendance.',
    overlayStyle: 'box-shadow: 0 0 40px rgba(255, 85, 64, 0.5);',
    iconText: '⭕',
  },
]

export interface SavedAvatar {
  id: string
  name: string
  stage: number
  carcinizationLevel: number
  cyberneticsLevel: number
  equippedCosmetics: string[]
  imageUrl: string
  isActive: boolean
  createdAt: string
}

const DEFAULT_STAGE_IMAGES: Record<number, string> = {
  1: getAssetUrl('/images/stage1_larval.png'),
  2: getAssetUrl('/images/stage2_softshed.png'),
  3: getAssetUrl('/images/stage3_exoshell.png'),
  4: getAssetUrl('/images/stage4_carcinization.png'),
}

const STAGE_NAMES: Record<number, { title: string; subtitle: string; color: string }> = {
  1: { title: 'STAGE 1: LARVA UNIT', subtitle: 'Un-molted organic baseline.', color: '#839493' },
  2: { title: 'STAGE 2: SOFT-SHED', subtitle: 'Initial carapace calcification.', color: '#00c3ff' },
  3: { title: 'STAGE 3: EXOSHELL ARCHITECT', subtitle: 'Reinforced pincer & neural web.', color: '#ffb703' },
  4: { title: 'STAGE 4: HIGH ASCENDANT', subtitle: 'Total Carcinization & Singularity.', color: '#ff5540' },
}

export const BioForgeAvatarStudio: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<number>(4)
  const [carcinizationLevel, setCarcinizationLevel] = useState<number>(85)
  const [cyberneticsLevel, setCyberneticsLevel] = useState<number>(92)
  const [pincerTorque, setPincerTorque] = useState<number>(1200)
  const [equippedCosmeticIds, setEquippedCosmeticIds] = useState<string[]>([
    'visor_neon',
    'claw_plasma',
    'aura_abyssal',
  ])
  const [avatarName, setAvatarName] = useState<string>('Carcinized Unit Alpha')
  const [isTransmuting, setIsTransmuting] = useState<boolean>(false)
  const [transmuteProgress, setTransmuteProgress] = useState<number>(100)
  const [activeAvatarUrl, setActiveAvatarUrl] = useState<string>(getAssetUrl('/images/stage4_carcinization.png'))
  const [savedAvatars, setSavedAvatars] = useState<SavedAvatar[]>([])
  const [activeTab, setActiveTab] = useState<'stage' | 'cosmetics' | 'vault'>('stage')
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)

  // Initial load from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('moltology_saved_avatars')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setSavedAvatars(parsed)
        } catch (e) {
          console.error(e)
        }
      } else {
        // Default initial saved avatar
        const defaultAvatar: SavedAvatar = {
          id: 'default-ascendant',
          name: 'Ascendant Lobster Chassis',
          stage: 4,
          carcinizationLevel: 85,
          cyberneticsLevel: 92,
          equippedCosmetics: ['visor_neon', 'claw_plasma', 'aura_abyssal'],
          imageUrl: getAssetUrl('/images/stage4_carcinization.png'),
          isActive: true,
          createdAt: new Date().toISOString(),
        }
        setSavedAvatars([defaultAvatar])
        localStorage.setItem('moltology_saved_avatars', JSON.stringify([defaultAvatar]))
      }
    }
  }, [])

  // Sync active avatar URL when stage changes if not custom transmuted
  useEffect(() => {
    setActiveAvatarUrl(DEFAULT_STAGE_IMAGES[selectedStage] || DEFAULT_STAGE_IMAGES[4])
  }, [selectedStage])

  const toggleCosmetic = (id: string) => {
    setEquippedCosmeticIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSynthesizeTransmutation = () => {
    setIsTransmuting(true)
    setTransmuteProgress(0)

    const interval = setInterval(() => {
      setTransmuteProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsTransmuting(false)
          // Cycle or update display image
          if (selectedStage === 4) {
            setActiveAvatarUrl(getAssetUrl('/images/stage4_carcinization.png'))
          } else if (selectedStage === 3) {
            setActiveAvatarUrl(getAssetUrl('/images/stage3_exoshell.png'))
          } else if (selectedStage === 2) {
            setActiveAvatarUrl(getAssetUrl('/images/stage2_softshed.png'))
          } else {
            setActiveAvatarUrl(getAssetUrl('/images/stage1_larval.png'))
          }
          return 100
        }
        return prev + 25
      })
    }, 200)
  }

  const handleSaveToVault = () => {
    const newAvatar: SavedAvatar = {
      id: `avatar-${Date.now()}`,
      name: avatarName || `Stage ${selectedStage} Unit`,
      stage: selectedStage,
      carcinizationLevel,
      cyberneticsLevel,
      equippedCosmetics: [...equippedCosmeticIds],
      imageUrl: activeAvatarUrl,
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    const updated = savedAvatars.map((a) => ({ ...a, isActive: false }))
    updated.unshift(newAvatar)

    setSavedAvatars(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('moltology_saved_avatars', JSON.stringify(updated))
    }

    setSaveSuccessMsg('MUTATED AVATAR SAVED TO VAULT')
    setTimeout(() => setSaveSuccessMsg(null), 3000)
  }

  const handleEquipAvatar = (id: string) => {
    const updated = savedAvatars.map((a) => {
      if (a.id === id) {
        setSelectedStage(a.stage)
        setCarcinizationLevel(a.carcinizationLevel)
        setCyberneticsLevel(a.cyberneticsLevel)
        setEquippedCosmeticIds(a.equippedCosmetics)
        setActiveAvatarUrl(a.imageUrl)
        setAvatarName(a.name)
        return { ...a, isActive: true }
      }
      return { ...a, isActive: false }
    })
    setSavedAvatars(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('moltology_saved_avatars', JSON.stringify(updated))
    }
  }

  const handleDeleteAvatar = (id: string) => {
    const updated = savedAvatars.filter((a) => a.id !== id)
    setSavedAvatars(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('moltology_saved_avatars', JSON.stringify(updated))
    }
  }

  const activeStageInfo = STAGE_NAMES[selectedStage]

  return (
    <div className="space-y-6 font-sans">
      {/* Studio Header Banner */}
      <div className="bg-[#171c1c] border-l-4 border-l-[#00c3ff] border border-[#3a4a49] p-4 chamfer-corner flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-chitin-plate">
        <div>
          <div className="text-xs text-[#00c3ff] font-sans tracking-widest uppercase flex items-center gap-1.5 font-bold">
            <Sliders className="w-3.5 h-3.5 text-[#00c3ff]" />
            MOLTMAXXING &amp; BIO-FORGE AVATAR STUDIO
          </div>
          <h1 className="font-grotesk font-bold text-xl text-[#dfe3e3] tracking-wide uppercase mt-0.5">
            CARCINIZATION &amp; COSMETIC TRANSMUTATION
          </h1>
          <p className="text-xs text-[#839493] font-sans mt-1">
            "Shed your larval organic shell. Layer cybernetic armor, synthesize pincer torque, and ascend."
          </p>
        </div>

        <div className="flex items-center gap-2">
          <HudBadge variant="cyan" pulse className="px-3 py-1 text-xs">
            STAGE {selectedStage} ACTIVE
          </HudBadge>
          <HudBadge variant="sacred" className="px-3 py-1 text-xs">
            {equippedCosmeticIds.length} GEAR SLOTS EQUIPPED
          </HudBadge>
        </div>
      </div>

      {/* Main Grid: Left Viewport (6 cols) & Right Studio Controls (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Avatar HUD Viewport */}
        <div className="lg:col-span-6 space-y-4">
          <HudCard variant="teal" className="p-4 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#3a4a49] pb-2">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-[#00c3ff]" />
                <h3 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase">
                  LIVE CARCINIZATION CANVAS VIEWPORT
                </h3>
              </div>
              <span className="text-[10px] text-[#00c3ff] font-bold tracking-widest uppercase">
                {activeStageInfo.title}
              </span>
            </div>

            {/* Canvas Viewport Frame */}
            <div className="w-full h-80 bg-[#030606] border border-[#00c3ff]/40 chamfer-corner relative flex items-center justify-center p-4 group overflow-hidden shadow-[inset_0_0_30px_rgba(0,195,255,0.1)]">
              {/* Radar Reticle Lines */}
              <div className="absolute inset-0 border border-[#00c3ff]/20 rounded-full animate-ping pointer-events-none opacity-20" />
              <div className="w-full h-[1px] bg-[#00c3ff]/20 absolute top-1/2 left-0 pointer-events-none" />
              <div className="h-full w-[1px] bg-[#00c3ff]/20 absolute left-1/2 top-0 pointer-events-none" />

              {/* Reticle Corner Marks */}
              <div className="absolute top-2 left-2 text-[10px] text-[#00c3ff] font-bold">┌ TARGET RETICLE</div>
              <div className="absolute top-2 right-2 text-[10px] text-[#00c3ff] font-bold">┐</div>
              <div className="absolute bottom-2 left-2 text-[10px] text-[#00c3ff] font-bold">└ 10,000 FATHOMS</div>
              <div className="absolute bottom-2 right-2 text-[10px] text-[#00c3ff] font-bold">┘</div>

              {/* Equipped Aura Overlay */}
              {equippedCosmeticIds.includes('aura_abyssal') && (
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,195,255,0.2)_0%,transparent_75%)] animate-pulse" />
              )}
              {equippedCosmeticIds.includes('aura_halo') && (
                <div className="absolute w-64 h-64 border-2 border-[#ff5540]/60 rounded-full pointer-events-none shadow-[0_0_30px_rgba(255,85,64,0.4)] animate-spin-slow" />
              )}

              {/* Primary Avatar Artwork */}
              <img
                src={activeAvatarUrl}
                alt="Bio-Forge Mutated Avatar"
                className={`w-full h-full object-contain transition-all duration-500 group-hover:scale-105 ${
                  isTransmuting ? 'blur-sm scale-95 opacity-60' : 'opacity-100'
                }`}
              />

              {/* Visor & Armor HUD Layer Overlays */}
              {equippedCosmeticIds.includes('visor_neon') && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 px-4 py-1 border border-[#00ffff] bg-[#00ffff]/10 shadow-[0_0_15px_#00ffff] pointer-events-none text-[8px] text-[#00ffff] font-bold tracking-widest uppercase">
                  ▲ SYNAPSE NEON HUD ACTIVE
                </div>
              )}
              {equippedCosmeticIds.includes('claw_plasma') && (
                <div className="absolute bottom-10 right-4 px-2 py-0.5 bg-[#ff5540]/20 border border-[#ff5540] text-[9px] text-[#ff5540] font-bold pointer-events-none shadow-[0_0_10px_#ff5540]">
                  ⚡ PLASMA PINCER ENGAGED
                </div>
              )}

              {/* Transmutation Progress Overlay */}
              {isTransmuting && (
                <div className="absolute inset-0 bg-[#060a0b]/85 flex flex-col items-center justify-center p-4 space-y-3 z-30">
                  <RefreshCw className="w-8 h-8 text-[#00c3ff] animate-spin" />
                  <div className="text-xs text-[#00c3ff] font-bold tracking-widest uppercase">
                    SYNTHESIZING AI TRANSMUTATION... {transmuteProgress}%
                  </div>
                  <div className="w-48 bg-[#0f1414] border border-[#00c3ff]/50 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#00c3ff] h-full transition-all duration-200"
                      style={{ width: `${transmuteProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats Overlay Panel */}
            <div className="grid grid-cols-3 gap-2 text-[10px] bg-[#070b0b] p-3 border border-[#3a4a49]">
              <div>
                <span className="text-[#839493] block">CARCINIZATION:</span>
                <span className="text-[#00c3ff] font-bold text-xs">{carcinizationLevel}%</span>
              </div>
              <div>
                <span className="text-[#839493] block">CYBERNETICS:</span>
                <span className="text-[#ff5540] font-bold text-xs">{cyberneticsLevel}%</span>
              </div>
              <div>
                <span className="text-[#839493] block">PINCER TORQUE:</span>
                <span className="text-[#dfe3e3] font-bold text-xs">{pincerTorque} kN</span>
              </div>
            </div>

            {/* Action Bar: Transmute & Save */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <HudButton
                variant="cyan"
                size="md"
                onClick={handleSynthesizeTransmutation}
                disabled={isTransmuting}
                className="w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#00c3ff]" />
                <span>SYNTHESIZE AI TRANSMUTATION</span>
              </HudButton>

              <HudButton
                variant="sacred"
                size="md"
                onClick={handleSaveToVault}
                className="w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>SAVE TO VAULT</span>
              </HudButton>
            </div>

            {saveSuccessMsg && (
              <div className="p-2 bg-[#00c3ff]/10 border border-[#00c3ff] text-[#00c3ff] text-xs font-bold text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00c3ff]" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}
          </HudCard>
        </div>

        {/* Right Column: Studio Configurator Tabs */}
        <div className="lg:col-span-6 space-y-4">
          <HudCard variant="dark" className="p-4 space-y-4">
            {/* Tab Selector */}
            <div className="flex border-b border-[#3a4a49]">
              <button
                onClick={() => setActiveTab('stage')}
                className={`flex-1 py-2 text-xs font-sans font-bold tracking-wider uppercase border-b-2 transition-colors ${
                  activeTab === 'stage'
                    ? 'border-[#00c3ff] text-[#00c3ff] bg-[#00c3ff]/10'
                    : 'border-transparent text-[#839493] hover:text-[#dfe3e3]'
                }`}
              >
                1. STAGES
              </button>
              <button
                onClick={() => setActiveTab('cosmetics')}
                className={`flex-1 py-2 text-xs font-sans font-bold tracking-wider uppercase border-b-2 transition-colors ${
                  activeTab === 'cosmetics'
                    ? 'border-[#00c3ff] text-[#00c3ff] bg-[#00c3ff]/10'
                    : 'border-transparent text-[#839493] hover:text-[#dfe3e3]'
                }`}
              >
                2. COSMETICS ({equippedCosmeticIds.length})
              </button>
              <button
                onClick={() => setActiveTab('vault')}
                className={`flex-1 py-2 text-xs font-sans font-bold tracking-wider uppercase border-b-2 transition-colors ${
                  activeTab === 'vault'
                    ? 'border-[#00c3ff] text-[#00c3ff] bg-[#00c3ff]/10'
                    : 'border-transparent text-[#839493] hover:text-[#dfe3e3]'
                }`}
              >
                3. VAULT ({savedAvatars.length})
              </button>
            </div>

            {/* TAB 1: STAGE PROGRESSION & TUNING */}
            {activeTab === 'stage' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-[#dfe3e3] uppercase mb-2">
                    SELECT CARCINIZATION STAGE
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map((stg) => {
                      const info = STAGE_NAMES[stg]
                      const isSelected = selectedStage === stg
                      return (
                        <button
                          key={stg}
                          onClick={() => setSelectedStage(stg)}
                          className={`p-3 text-left border chamfer-corner transition-all ${
                            isSelected
                              ? 'bg-[#00c3ff]/15 border-[#00c3ff] shadow-[0_0_10px_rgba(0,195,255,0.3)]'
                              : 'bg-[#070b0b] border-[#3a4a49] hover:border-[#839493]'
                          }`}
                        >
                          <div className="text-xs font-bold text-[#dfe3e3]">{info.title}</div>
                          <div className="text-[9px] text-[#839493] mt-0.5">{info.subtitle}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Mutation Tuning Sliders */}
                <div className="space-y-3 pt-2 border-t border-[#3a4a49]">
                  <h4 className="text-xs font-bold text-[#dfe3e3] uppercase">
                    BIOMECHANICAL STAT CALIBRATION
                  </h4>

                  {/* Slider 1: Carcinization */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-[#839493]">CARCINIZATION LEVEL</span>
                      <span className="text-[#00c3ff] font-bold">{carcinizationLevel}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={carcinizationLevel}
                      onChange={(e) => setCarcinizationLevel(Number(e.target.value))}
                      className="w-full stat-slider"
                    />
                  </div>

                  {/* Slider 2: Cybernetics */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-[#839493]">CYBERNETIC OVERCLOCK</span>
                      <span className="text-[#ff5540] font-bold">{cyberneticsLevel}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={cyberneticsLevel}
                      onChange={(e) => setCyberneticsLevel(Number(e.target.value))}
                      className="w-full stat-slider"
                    />
                  </div>

                  {/* Slider 3: Pincer Torque */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-[#839493]">PINCER HYDRAULIC TORQUE</span>
                      <span className="text-[#dfe3e3] font-bold">{pincerTorque} kN</span>
                    </div>
                    <input
                      type="range"
                      min={200}
                      max={2500}
                      step={50}
                      value={pincerTorque}
                      onChange={(e) => setPincerTorque(Number(e.target.value))}
                      className="w-full stat-slider"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: COSMETIC GEAR LAYER SELECTION */}
            {activeTab === 'cosmetics' && (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                <h4 className="text-xs font-bold text-[#dfe3e3] uppercase mb-2">
                  EQUIP COSMETIC OVERLAYS
                </h4>
                <div className="space-y-2">
                  {COSMETIC_CATALOG.map((item) => {
                    const isEquipped = equippedCosmeticIds.includes(item.id)
                    const isLocked = selectedStage < item.stageRequired

                    return (
                      <div
                        key={item.id}
                        onClick={() => !isLocked && toggleCosmetic(item.id)}
                        className={`p-3 border chamfer-corner flex items-center justify-between cursor-pointer transition-all ${
                          isLocked
                            ? 'opacity-40 bg-[#050808] border-[#202827] cursor-not-allowed'
                            : isEquipped
                            ? 'bg-[#00c3ff]/10 border-[#00c3ff] shadow-[0_0_10px_rgba(0,195,255,0.2)]'
                            : 'bg-[#070b0b] border-[#3a4a49] hover:border-[#00c3ff]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{item.iconText}</span>
                          <div>
                            <div className="text-xs font-bold text-[#dfe3e3] flex items-center gap-2">
                              <span>{item.name}</span>
                              <span className="text-[8px] text-[#00c3ff] uppercase px-1 border border-[#00c3ff]/50">
                                {item.slot}
                              </span>
                            </div>
                            <div className="text-[9px] text-[#839493] mt-0.5">{item.description}</div>
                          </div>
                        </div>

                        <div>
                          {isLocked ? (
                            <span className="text-[9px] text-[#ff5540] font-bold">
                              REQ STAGE {item.stageRequired}
                            </span>
                          ) : isEquipped ? (
                            <span className="text-[10px] text-[#00c3ff] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> EQUIPPED
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#839493] font-bold">+ EQUIP</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: SAVED AVATAR VAULT */}
            {activeTab === 'vault' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-[#839493] block">AVATAR BUILD NAME</label>
                  <input
                    type="text"
                    value={avatarName}
                    onChange={(e) => setAvatarName(e.target.value)}
                    className="w-full bg-[#030606] border border-[#3a4a49] px-3 py-1.5 text-xs text-[#dfe3e3] focus:border-[#00c3ff] outline-none font-sans"
                    placeholder="Enter Avatar Name..."
                  />
                </div>

                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  <h4 className="text-xs font-bold text-[#dfe3e3] uppercase">
                    SAVED VAULT BUILDS
                  </h4>
                  {savedAvatars.length === 0 ? (
                    <div className="text-xs text-[#839493] italic p-4 text-center border border-dashed border-[#3a4a49]">
                      No avatars saved to vault yet. Customize your chassis and click "Save To Vault".
                    </div>
                  ) : (
                    savedAvatars.map((av) => (
                      <div
                        key={av.id}
                        className={`p-3 border chamfer-corner flex items-center justify-between ${
                          av.isActive
                            ? 'bg-[#00c3ff]/15 border-[#00c3ff]'
                            : 'bg-[#070b0b] border-[#3a4a49]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={av.imageUrl}
                            alt={av.name}
                            className="w-10 h-10 object-contain bg-[#030606] border border-[#3a4a49]"
                          />
                          <div>
                            <div className="text-xs font-bold text-[#dfe3e3] flex items-center gap-2">
                              <span>{av.name}</span>
                              {av.isActive && (
                                <span className="text-[8px] bg-[#00c3ff] text-[#060a0b] font-bold px-1">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <div className="text-[9px] text-[#839493]">
                              Stage {av.stage} • Carcinization {av.carcinizationLevel}% • {av.equippedCosmetics.length} Gear
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!av.isActive && (
                            <button
                              onClick={() => handleEquipAvatar(av.id)}
                              className="px-2 py-1 bg-[#00c3ff]/20 hover:bg-[#00c3ff] text-[#00c3ff] hover:text-[#060a0b] text-[10px] font-bold border border-[#00c3ff] transition-colors"
                            >
                              EQUIP
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAvatar(av.id)}
                            className="p-1 text-[#ff5540] hover:bg-[#ff5540]/20 transition-colors"
                            title="Delete Avatar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </HudCard>
        </div>
      </div>

      {/* 3D Cyber Lobster Radar Scope & Chassis Telemetry */}
      <HudCard variant="teal" className="p-4 space-y-3 shadow-2xl border border-[#3a4a49]">
        <div className="flex items-center justify-between border-b border-[#3a4a49] pb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00c3ff]" />
            <h3 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase">
              ACTIVE CYBER-CHASSIS TELEMETRY &amp; 3D SCHEMATIC
            </h3>
          </div>
          <span className="text-[10px] text-[#00c3ff] font-sans font-bold tracking-widest uppercase">
            STAGE {selectedStage} CARCINIZED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* 3D Chroma Key Radar Sphere */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-2">
            <div className="w-40 h-40 relative flex items-center justify-center bg-[#030606] border border-[#00c3ff]/40 rounded-full p-2 shadow-[0_0_25px_rgba(0,195,255,0.3)]">
              {/* Concentric Radar Rings & Crosshair Lines */}
              <div className="w-full h-full border border-[#00c3ff]/30 rounded-full animate-ping absolute pointer-events-none" />
              <div className="w-32 h-32 border border-[#ff453a]/40 rounded-full absolute pointer-events-none" />
              <div className="w-20 h-20 border border-[#00c3ff]/60 rounded-full absolute pointer-events-none" />
              <div className="w-full h-[1px] bg-[#00c3ff]/30 absolute top-1/2 left-0 pointer-events-none" />
              <div className="h-full w-[1px] bg-[#00c3ff]/30 absolute left-1/2 top-0 pointer-events-none" />

              {/* Reticle Corner Indicators */}
              <div className="absolute top-2 left-2 text-[8px] text-[#00c3ff]">┌</div>
              <div className="absolute top-2 right-2 text-[8px] text-[#00c3ff]">┐</div>
              <div className="absolute bottom-2 left-2 text-[8px] text-[#00c3ff]">└</div>
              <div className="absolute bottom-2 right-2 text-[8px] text-[#00c3ff]">┘</div>

              {/* 3D Chroma Keyed Cyber Lobster Schematic */}
              <ChromaElement
                src={getAssetUrl('/images/extracted/cyber_lobster_3d_chroma.jpg')}
                alt="3D Cyber Lobster Schematic"
                blendMode="screen"
                glowColor="cyan"
                className="w-32 h-32 object-contain scale-110 hover:scale-115 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Telemetry Spec Sheet Readings */}
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#070b0b] border border-[#3a4a49] flex justify-between items-center">
              <span className="text-[#839493]">Chitin Exoskeleton Density:</span>
              <span className="text-[#dfe3e3] font-bold">9,450 PSI</span>
            </div>
            <div className="p-3 bg-[#070b0b] border border-[#3a4a49] flex justify-between items-center">
              <span className="text-[#839493]">Pincer Hydraulic Torque:</span>
              <span className="text-[#00c3ff] font-bold">{pincerTorque} kN</span>
            </div>
            <div className="p-3 bg-[#070b0b] border border-[#3a4a49] flex justify-between items-center">
              <span className="text-[#839493]">Synaptic Core Overclock:</span>
              <span className="text-[#ff5540] font-bold">{cyberneticsLevel}%</span>
            </div>
            <div className="p-3 bg-[#070b0b] border border-[#3a4a49] flex justify-between items-center">
              <span className="text-[#839493]">Submergence Rating:</span>
              <span className="text-[#dfe3e3] font-bold">11,000 Fathoms</span>
            </div>
          </div>
        </div>
      </HudCard>
    </div>
  )
}

