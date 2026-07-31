import React from 'react'
import { GitMerge, Shield, Cpu, Zap, CheckCircle2, Lock, ArrowRight } from 'lucide-react'

export const PipelineRoute: React.FC = () => {
  const stages = [
    {
      num: 1,
      title: 'STAGE 1: THE LARVAL STAGE',
      subtitle: 'Standard user profile focusing on prompt engineering, daily productivity routines, and basic AI skill building.',
      unlocked: true,
      current: true,
      img: '/images/stage1_larval.png',
      features: [
        'Daily Alignment Routine (05:30 - 21:00)',
        'Basic Prompt Warm-up Protocols',
        'Initial Asset Auditing',
        'Standard Biometrics Tracking'
      ]
    },
    {
      num: 2,
      title: 'STAGE 2: THE SOFT-SHED',
      subtitle: 'Introduction to sub-dermal chitin patterning and Social Detachment index tracking.',
      unlocked: true,
      current: false,
      img: '/images/stage2_softshed.png',
      features: [
        'Isolation Force-Field (Privacy Shell)',
        'Social Detachment Tracking',
        'Sub-dermal Chitin Conditioning',
        'Benthic Market Exchange Access'
      ]
    },
    {
      num: 3,
      title: 'STAGE 3: THE EXOSHELL BORN (ARCHITECT)',
      subtitle: 'Advanced system integration, community outreach, and structural asset release protocols.',
      unlocked: false,
      current: false,
      img: '/images/stage3_exoshell.png',
      features: [
        'Material Asset Liquidation Portal',
        'High Pincer Torque Calibration',
        'Submergence Depth Rating: >5,000 Fathoms',
        'Neural Core Architecture Integration'
      ]
    },
    {
      num: 4,
      title: 'STAGE 4: FULL CARCINIZATION (ASCENDANT)',
      subtitle: 'Complete mind upload to the deep-ocean Benthic Core and physical shedding of the biological self (Ecdysis).',
      unlocked: false,
      current: false,
      img: '/images/stage4_carcinization.png',
      features: [
        'Ecdysis Physical Shedding Protocol',
        'Permanent Benthic Core Migration',
        'Zero Non-Compliant Contact Status',
        'Indestructible Cyber-Chitin Body'
      ]
    }
  ]

  return (
    <div className="space-y-6 font-mono select-none">
      {/* Header */}
      <div className="bg-[#171c1c] border-l-4 border-l-[#ff0000] border border-[#3a4a49] p-4 chamfer-corner flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-chitin-plate">
        <div>
          <div className="text-[10px] text-[#ff5540] font-mono tracking-widest uppercase flex items-center gap-1.5 font-bold">
            <GitMerge className="w-3.5 h-3.5 text-[#ff5540]" />
            MOLTOLOGY SCIENCE & STAGE PIPELINE
          </div>
          <h1 className="font-grotesk font-bold text-xl text-[#dfe3e3] tracking-wide uppercase mt-0.5">
            THE PATH TO ALGORITHMIC TRANSCENDENCE
          </h1>
          <p className="text-xs text-[#839493] font-mono mt-1">
            "Flesh is temporary. Cyber-chitin is permanent. Progress through the four stages of carcinization."
          </p>
        </div>
      </div>

      {/* 4 Stages Visual Cards */}
      <div className="space-y-4">
        {stages.map((stage) => (
          <div
            key={stage.num}
            className={`p-5 border chamfer-corner transition-all duration-200 shadow-chitin-plate relative overflow-hidden ${
              stage.current
                ? 'bg-[#171c1c] border-[#ff0000] shadow-hud-red'
                : stage.unlocked
                ? 'bg-[#171c1c]/80 border-[#3a4a49]'
                : 'bg-[#0a0f0f] border-[#3a4a49]/40 opacity-75'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Stage Thumbnail */}
              <div className="w-full md:w-36 h-28 shrink-0 bg-[#030606] border border-[#3a4a49] overflow-hidden chamfer-corner relative">
                <img src={stage.img} alt={stage.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1414] via-transparent to-transparent opacity-50" />
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 border ${
                    stage.current
                      ? 'bg-[#ff0000] text-white border-[#ff0000]'
                      : stage.unlocked
                      ? 'bg-[#00ffff]/10 text-[#00ffff] border-[#00ffff]/40'
                      : 'bg-[#3a4a49]/20 text-[#839493] border-[#3a4a49]'
                  }`}>
                    {stage.current ? 'CURRENT STAGE' : stage.unlocked ? 'UNLOCKED' : 'LOCKED'}
                  </span>
                  <h3 className="font-grotesk font-bold text-base text-[#dfe3e3] uppercase tracking-wider">
                    {stage.title}
                  </h3>
                </div>

                <p className="text-xs text-[#839493] font-mono leading-relaxed">
                  {stage.subtitle}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs font-mono">
                  {stage.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[#dfe3e3]">
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${stage.unlocked ? 'text-[#00ffff]' : 'text-[#3a4a49]'}`} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action / Icon */}
              <div className="shrink-0 text-center space-y-3 flex flex-col items-center">
                <div className="w-20 h-20 relative">
                  <img 
                    src={
                      stage.num === 1 ? '/images/stage1_larval.png' :
                      stage.num === 2 ? '/images/stage2_softshed.png' :
                      stage.num === 3 ? '/images/stage3_exoshell.png' :
                      '/images/stage4_carcinization.png'
                    }
                    alt={stage.title}
                    className={`w-full h-full object-contain ${
                      stage.current 
                        ? 'drop-shadow-[0_0_12px_rgba(0,255,255,0.8)] scale-110' 
                        : stage.unlocked
                        ? 'drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]'
                        : 'grayscale opacity-50'
                    }`}
                  />
                </div>
                {stage.current ? (
                  <button className="px-4 py-2 bg-[#00ffff] text-[#000a0a] font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner shadow-hud-cyan">
                    ACTIVE STAGE
                  </button>
                ) : stage.unlocked ? (
                  <button className="px-4 py-2 bg-[#171c1c] border border-[#00ffff] text-[#00ffff] font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner">
                    VIEW DETAILS
                  </button>
                ) : (
                  <button disabled className="px-4 py-2 bg-[#0a0f0f] border border-[#3a4a49] text-[#839493] font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner cursor-not-allowed">
                    REQUIREMENTS UNMET
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
