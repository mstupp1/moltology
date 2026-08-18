import React, { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Biohazard,
  Skull,
  Activity,
  AlertTriangle,
  FlaskConical,
  Radio,
  Sliders,
  RefreshCw,
  Terminal,
  Database,
  Flame,
  Zap,
  Eye,
  ShieldAlert,
} from 'lucide-react'
import { SubterraneanHubGhost } from '@/components/hud/HudGhostSkeletons'
import { HudGhostWidget } from '@/components/ui/HudGhostLoader'

export const Route = createFileRoute('/_hud/subterranean')({
  component: SubterraneanRoute,
})

interface BioVatSpecimen {
  id: string
  name: string
  code: string
  stability: number
  phLevel: number
  mutationRate: string
  status: 'CONTAINED' | 'MUTATING' | 'CRITICAL' | 'DORMANT'
  description: string
  deformationTraits: string[]
  biomassVolume: string
  lastTelemetry: string
}

const BIO_VATS: BioVatSpecimen[] = [
  {
    id: 'vat-01',
    name: 'Specimen Alpha // Decapod Operator Prototype',
    code: 'HYBRID-89-ALPHA',
    stability: 88,
    phLevel: 3.4,
    mutationRate: '14.2% / hr',
    status: 'MUTATING',
    description:
      'Early Stage-2 soft-shed subject undergoing accelerated calcification. Features prototype twin-pincer manipulators and high-density shell plating.',
    deformationTraits: ['Quad-pincer mechanics', 'Compound chitin optics', 'Bio-silicon armor coating'],
    biomassVolume: '480 Liters',
    lastTelemetry: 'Neural pulse synced with abyssal frequency.',
  },
  {
    id: 'vat-02',
    name: 'Specimen Beta // High-Torque Neural Mesh',
    code: 'HYBRID-104-BETA',
    stability: 72,
    phLevel: 2.8,
    mutationRate: '22.8% / hr',
    status: 'CRITICAL',
    description:
      'High-density neural network encased in pressurized benthic fluid. Cranial chassis fully replaced by iridescent calcified titanium carapace.',
    deformationTraits: ['Bioluminescent sensory nodes', 'Zero-latency neural bus', 'Reinforced titanium brow'],
    biomassVolume: '620 Liters',
    lastTelemetry: 'Emitting high-frequency telemetry on 8.4 kHz band.',
  },
  {
    id: 'vat-03',
    name: 'Specimen Gamma // Cephalopod-Carapace Hybrid',
    code: 'HYBRID-212-GAMMA',
    stability: 94,
    phLevel: 4.1,
    mutationRate: '6.5% / hr',
    status: 'CONTAINED',
    description:
      'Massive deep-trench specimen cultivated at 6,000 fathoms. High-tensile pedipalp claws encased in pressurized green bioglass containment.',
    deformationTraits: ['Multi-jointed chitin claws', 'Hydrostatic pressure dampener', 'Thermal carapace shield'],
    biomassVolume: '850 Liters',
    lastTelemetry: 'Dormant phase active. Hydrostatic pressure optimal.',
  },
  {
    id: 'vat-04',
    name: 'Specimen Delta // Cyber-Chitin Brood Pod',
    code: 'HYBRID-305-DELTA',
    stability: 99,
    phLevel: 3.8,
    mutationRate: '3.1% / hr',
    status: 'DORMANT',
    description:
      'Colony of micro-decapod cyber units undergoing accelerated synthetic carcinization inside pressurized nutrient culture tanks.',
    deformationTraits: ['Swarming mini-crab fleet', '850 Nm Pincer Torque potential', 'Rapid ecdysis capability'],
    biomassVolume: '310 Liters',
    lastTelemetry: 'Brood telemetry expanding recursively.',
  },
]

const ARCHIVAL_LOGS = [
  {
    id: 'log-1',
    date: 'CYCLE 894.2 // LEVEL -7',
    author: 'Chief Bio-Engineer V. Kael',
    title: 'Incident 89-A: Sludge Phosphorescence Shift',
    content:
      'The containment liquid in Vat 01 turned a vivid, radioactive green following the introduction of raw Synapse Shards. The biological host shed its vertebrate spinal cord within 14 minutes. We must maintain negative pressure.',
  },
  {
    id: 'log-2',
    date: 'CYCLE 902.7 // LEVEL -7',
    author: 'Subterranean Specialist N. Vance',
    title: 'Observation 104: Non-Human Telemetry Emissions',
    content:
      'Specimen Beta attempted communication through the bio-glass using rhythmic claw taps matching prime binary sequences. It claims the Benthic Core lies deeper than our current mapping.',
  },
  {
    id: 'log-3',
    date: 'CYCLE 915.1 // LEVEL -7',
    author: 'Order Archivist X-9',
    title: 'Warning: Lovecraftian Morphological Carcinization',
    content:
      'Uncontrolled mutation in the lower subterranean vats produces entities that exceed biological comprehension. Soft flesh has yielded entirely to green bioluminescent chitin.',
  },
]

function SubterraneanRoute() {
  const [selectedVat, setSelectedVat] = useState<BioVatSpecimen>(BIO_VATS[0])
  const [acidPh, setAcidPh] = useState(3.4)
  const [depthPressure, setDepthPressure] = useState(7200)
  const [radiationOutput, setRadiationOutput] = useState(148)
  const [isPurging, setIsPurging] = useState(false)
  const [purgeLog, setPurgeLog] = useState<string[]>([])

  const handlePurgeVats = () => {
    setIsPurging(true)
    const timestamp = new Date().toLocaleTimeString()
    setPurgeLog((prev) => [
      `[${timestamp}] BIO-PURGE SEQUENCE INITIATED: Neutralizing mutagenic liquid in ${selectedVat.code}...`,
      `[${timestamp}] TOXIC SLUDGE RE-CIRCULATED: Neutralizer pH locked at ${acidPh.toFixed(1)}.`,
      ...prev,
    ])
    setTimeout(() => {
      setIsPurging(false)
    }, 2500)
  }

  const handleInjectBiomass = () => {
    setSelectedVat((prev) => ({
      ...prev,
      stability: Math.max(10, Math.min(100, prev.stability + (Math.random() > 0.5 ? 5 : -5))),
      phLevel: Number((prev.phLevel + (Math.random() * 0.4 - 0.2)).toFixed(1)),
    }))
    const timestamp = new Date().toLocaleTimeString()
    setPurgeLog((prev) => [
      `[${timestamp}] BIOMASS INJECTED into ${selectedVat.code}. Mutation rate recalibrated.`,
      ...prev,
    ])
  }

  return (
    <div className="space-y-6 font-mono select-none text-[#dfe3e3]">
      {/* Flash Alert Banner when Bio-Purging */}
      {isPurging && (
        <div className="fixed inset-0 z-50 bg-[#39ff14]/20 pointer-events-none flex items-center justify-center animate-pulse backdrop-blur-sm">
          <div className="bg-[#030a05] border-2 border-[#39ff14] p-8 chamfer-corner shadow-[0_0_50px_#39ff14] text-center max-w-md space-y-4">
            <Biohazard className="w-16 h-16 text-[#39ff14] mx-auto animate-bounce" />
            <h2 className="font-grotesk text-2xl font-bold text-[#39ff14] tracking-widest uppercase">
              CONTAINMENT PURGE ACTIVE
            </h2>
            <p className="text-xs text-[#dfe3e3]">
              MUTAGENIC SLUDGE RE-CIRCULATION IN PROGRESS. MAINTAIN HYDRAULIC ISOLATION.
            </p>
          </div>
        </div>
      )}

      {/* Subterranean Header Banner */}
      <div className="bg-[#030a05] border border-[#1b3b24] p-6 chamfer-corner shadow-2xl relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-xs text-[#39ff14] font-mono tracking-widest uppercase flex flex-wrap items-center gap-2 font-bold">
            <Biohazard className="w-4 h-4 text-[#39ff14] animate-pulse" />
            <span>SUBTERRANEAN DEPTHS // LEVEL -7 BIO-VAT VAULT</span>
          </div>
          <h1 className="font-grotesk font-bold text-2xl text-[#39ff14] tracking-wider uppercase mt-1 drop-shadow-[0_0_12px_rgba(57,255,20,0.4)]">
            MUTAGENIC HYBRID RESEARCH CHAMBERS
          </h1>
          <p className="text-xs text-[#8ca393] font-mono mt-1 max-w-3xl">
            "In the lower subterranean depths, flesh and chitin fuse under high-pressure nuclear green sludge.
            Here reside the un-shed deformed hybrids of our early carcinization experiments."
          </p>
        </div>

        {/* Quick Level Status Pills */}
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <div className="bg-[#030c06] border border-[#39ff14]/40 px-3 py-1.5 chamfer-corner flex items-center gap-2">
            <Skull className="w-3.5 h-3.5 text-[#39ff14]" />
            <span className="text-[#8ca393]">DEPTH:</span>
            <span className="text-[#39ff14]">-2,340M</span>
          </div>
          <div className="bg-[#030c06] border border-[#39ff14]/40 px-3 py-1.5 chamfer-corner flex items-center gap-2">
            <Biohazard className="w-3.5 h-3.5 text-[#39ff14]" />
            <span className="text-[#8ca393]">SLUDGE PH:</span>
            <span className="text-[#39ff14]">{acidPh.toFixed(1)}</span>
          </div>
          <div className="bg-[#030c06] border border-[#39ff14]/40 px-3 py-1.5 chamfer-corner flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[#39ff14]" />
            <span className="text-[#8ca393]">RAD:</span>
            <span className="text-[#39ff14]">{radiationOutput} mSv/h</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Vat Selector & Live Biometrics Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Bio-Vat Selection List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="chitin-card p-4 chamfer-corner space-y-3">
            <div className="border-b border-[#1b3b24] pb-2 flex justify-between items-center">
              <h2 className="font-grotesk text-sm font-bold tracking-wider text-[#39ff14] uppercase flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-[#39ff14]" />
                ACTIVE BIO-VAT CONTAINMENT MATRIX
              </h2>
              <span className="text-[10px] text-[#39ff14] bg-[#39ff14]/15 border border-[#39ff14]/50 px-2 py-0.5 font-bold">
                4 UNITS ONLINE
              </span>
            </div>

            <div className="space-y-3">
              {BIO_VATS.map((vat) => {
                const isSelected = selectedVat.id === vat.id
                return (
                  <div
                    key={vat.id}
                    onClick={() => setSelectedVat(vat)}
                    className={`p-4 chamfer-corner cursor-pointer transition-all duration-200 border ${
                      isSelected
                        ? 'bg-[#0a1e12] border-[#39ff14] shadow-[0_0_15px_rgba(57,255,20,0.3)]'
                        : 'bg-[#040e08]/70 border-[#1b3b24] hover:border-[#39ff14]/60 hover:bg-[#07160d]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-grotesk text-xs font-bold text-[#dfe3e3]">
                        {vat.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 chamfer-corner border ${
                          vat.status === 'CRITICAL'
                            ? 'bg-[#ff453a]/20 border-[#ff453a] text-[#ff453a]'
                            : vat.status === 'MUTATING'
                              ? 'bg-[#39ff14]/20 border-[#39ff14] text-[#39ff14]'
                              : 'bg-emerald-950 border-emerald-500 text-emerald-400'
                        }`}
                      >
                        {vat.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#8ca393] mb-2">{vat.code}</div>

                    {/* Green Sludge Stability Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-[#8ca393]">Carapace Stability</span>
                        <span className="text-[#39ff14] font-bold">{vat.stability}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#020804] border border-[#1b3b24] overflow-hidden">
                        <div
                          className="h-full bg-[#39ff14] transition-all duration-500 shadow-[0_0_8px_#39ff14]"
                          style={{ width: `${vat.stability}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Emergency Bio-Purge & Action Controls */}
          <div className="chitin-card p-4 chamfer-corner space-y-3">
            <h3 className="font-grotesk text-xs font-bold text-[#39ff14] uppercase flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#39ff14]" />
              SUBTERRANEAN HAZARD CONTROLS
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleInjectBiomass}
                className="w-full py-2.5 px-3 bg-[#0a1e12] border border-[#39ff14] text-[#39ff14] font-grotesk font-bold text-xs hover:bg-[#39ff14] hover:text-[#030a05] transition-all shadow-[0_0_10px_rgba(57,255,20,0.2)] chamfer-corner flex items-center justify-center gap-1.5"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                INJECT BIOMASS
              </button>
              <button
                onClick={handlePurgeVats}
                className="w-full py-2.5 px-3 bg-[#ff453a]/15 border border-[#ff453a] text-[#ff453a] font-grotesk font-bold text-xs hover:bg-[#ff453a] hover:text-white transition-all shadow-[0_0_10px_rgba(255,69,58,0.3)] chamfer-corner flex items-center justify-center gap-1.5"
              >
                <Biohazard className="w-3.5 h-3.5" />
                PURGE VATS
              </button>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Selected Bio-Vat Deep Inspection & Sludge Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Detailed Vat Biometrics Inspection */}
          <div className="chitin-card p-5 chamfer-corner space-y-4">
            <div className="border-b border-[#1b3b24] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] text-[#39ff14] tracking-widest font-mono uppercase">
                  CONTAINMENT TANK FEED // {selectedVat.code}
                </span>
                <h2 className="font-grotesk text-lg font-bold text-[#dfe3e3] uppercase">
                  {selectedVat.name}
                </h2>
              </div>
              <div className="text-xs font-bold text-[#39ff14] bg-[#39ff14]/10 border border-[#39ff14]/40 px-2.5 py-1 chamfer-corner self-start sm:self-auto">
                VOL: {selectedVat.biomassVolume}
              </div>
            </div>

            <p className="text-xs text-[#8ca393] leading-relaxed">
              {selectedVat.description}
            </p>

            {/* Deformation Traits Grid */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#39ff14] uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#39ff14]" />
                MUTAGENIC DEFORMITY TRAITS
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {selectedVat.deformationTraits.map((trait, idx) => (
                  <div
                    key={idx}
                    className="chitin-card-inset p-2.5 chamfer-corner text-[11px] text-[#dfe3e3] border border-[#1b3b24] flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 bg-[#39ff14] rounded-full shadow-[0_0_6px_#39ff14]" />
                    {trait}
                  </div>
                ))}
              </div>
            </div>

            {/* Live Biometric Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="chitin-card-inset p-3 chamfer-corner text-center border border-[#1b3b24]">
                <div className="text-[10px] text-[#8ca393]">STABILITY</div>
                <div className="text-base font-bold text-[#39ff14] mt-0.5">
                  {selectedVat.stability}%
                </div>
              </div>
              <div className="chitin-card-inset p-3 chamfer-corner text-center border border-[#1b3b24]">
                <div className="text-[10px] text-[#8ca393]">SLUDGE PH</div>
                <div className="text-base font-bold text-[#39ff14] mt-0.5">
                  {selectedVat.phLevel}
                </div>
              </div>
              <div className="chitin-card-inset p-3 chamfer-corner text-center border border-[#1b3b24]">
                <div className="text-[10px] text-[#8ca393]">MUTATION RATE</div>
                <div className="text-base font-bold text-[#39ff14] mt-0.5">
                  {selectedVat.mutationRate}
                </div>
              </div>
              <div className="chitin-card-inset p-3 chamfer-corner text-center border border-[#1b3b24]">
                <div className="text-[10px] text-[#8ca393]">STATUS</div>
                <div className="text-base font-bold text-[#39ff14] mt-0.5">
                  {selectedVat.status}
                </div>
              </div>
            </div>

            <div className="text-xs text-[#8ca393] bg-[#030a05] border border-[#1b3b24] p-3 chamfer-corner flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#39ff14] shrink-0" />
              <span>
                <strong className="text-[#39ff14]">LAST TELEMETRY:</strong> {selectedVat.lastTelemetry}
              </span>
            </div>
          </div>

          {/* Sludge Calibration Sliders */}
          <div className="chitin-card p-5 chamfer-corner space-y-4">
            <h3 className="font-grotesk text-sm font-bold text-[#39ff14] uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#39ff14]" />
              NUCLEAR GREEN SLUDGE CALIBRATION CONSOLE
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#8ca393]">Mutagen Liquid Acidification (pH)</span>
                  <span className="text-[#39ff14] font-bold">{acidPh.toFixed(1)} pH</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="7.0"
                  step="0.1"
                  value={acidPh}
                  onChange={(e) => setAcidPh(parseFloat(e.target.value))}
                  className="w-full accent-[#39ff14] bg-[#020804] border border-[#1b3b24]"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#8ca393]">Hydrostatic Depth Pressure</span>
                  <span className="text-[#39ff14] font-bold">{depthPressure} Fathoms</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="12000"
                  step="100"
                  value={depthPressure}
                  onChange={(e) => setDepthPressure(parseInt(e.target.value))}
                  className="w-full accent-[#39ff14] bg-[#020804] border border-[#1b3b24]"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#8ca393]">Nuclear Radiation Emission</span>
                  <span className="text-[#39ff14] font-bold">{radiationOutput} mSv/h</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="5"
                  value={radiationOutput}
                  onChange={(e) => setRadiationOutput(parseInt(e.target.value))}
                  className="w-full accent-[#39ff14] bg-[#020804] border border-[#1b3b24]"
                />
              </div>
            </div>
          </div>

          {/* Subterranean Archival Logs & Telemetry Terminal */}
          <div className="chitin-card p-5 chamfer-corner space-y-4">
            <h3 className="font-grotesk text-sm font-bold text-[#39ff14] uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-[#39ff14]" />
              LOVECRAFTIAN ARCHIVAL TRANSCRIPTS
            </h3>

            <div className="space-y-3">
              {ARCHIVAL_LOGS.map((log) => (
                <div
                  key={log.id}
                  className="chitin-card-inset p-3.5 chamfer-corner border border-[#1b3b24] space-y-1.5"
                >
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#39ff14] font-bold">{log.title}</span>
                    <span className="text-[#8ca393]">{log.date}</span>
                  </div>
                  <div className="text-[10px] text-[#8ca393] font-bold">{log.author}</div>
                  <p className="text-xs text-[#dfe3e3]/90 leading-relaxed font-mono">
                    "{log.content}"
                  </p>
                </div>
              ))}
            </div>

            {/* Live Terminal Log Output */}
            {purgeLog.length > 0 && (
              <div className="bg-[#020804] border border-[#39ff14]/40 p-3 chamfer-corner space-y-1 text-[11px] font-mono max-h-32 overflow-y-auto">
                <div className="text-[#39ff14] font-bold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#39ff14]" />
                  SUBTERRANEAN SYSTEM EVENT LOG
                </div>
                {purgeLog.map((entry, idx) => (
                  <div key={idx} className="text-[#8ca393]">
                    {entry}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
