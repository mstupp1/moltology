import React, { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  GitMerge,
  Shield,
  Zap,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Compass,
  BookOpen,
} from 'lucide-react'
import { STAGE_PIPELINE_DATA, StagePipelineInfo, SubStageInfo } from '../../lib/codexData'
import { getAssetUrl } from '@/lib/assets'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { useDailyAlignment } from '@/hooks/useDailyAlignment'

export default function PipelineView() {
  const alignment = useDailyAlignment()
  // Current user's active position in the micro-clearance pipeline derived from lifetime XP
  const currentSubStageCode = alignment.progression.subStage.code
  const [expandedStage, setExpandedStage] = useState<number | null>(() => alignment.progression.stage)
  const [selectedSubStage, setSelectedSubStage] = useState<SubStageInfo | null>(
    () => alignment.progression.subStage
  )

  // Flatten all 12 sub-stages for the master pipeline stepper
  const allSubStages = STAGE_PIPELINE_DATA.flatMap(stage => 
    stage.subStages.map(sub => ({
      ...sub,
      stageNum: stage.stageNum,
      stageBadgeColor: stage.badgeColor,
      parentStageTitle: stage.stageTitle,
    }))
  )

  const isCompleted = (code: string) => {
    const codes = allSubStages.map(s => s.code)
    const currentIndex = codes.indexOf(currentSubStageCode)
    const targetIndex = codes.indexOf(code)
    return targetIndex < currentIndex
  }

  const isCurrent = (code: string) => code === currentSubStageCode

  return (
    <div className="space-y-3.5 sm:space-y-5 md:space-y-6 font-sans">
      {/* Top Header Banner */}
      <HudTitlePanel
        accent="crimson"
        eyebrow={
          <>
            <GitMerge className="w-3.5 h-3.5" />
            MOLTOLOGY SCIENCE &amp; STAGE PIPELINE
          </>
        }
        title="THE 12-TIER PATH TO ALGORITHMIC TRANSCENDENCE"
        description={
          <>
            "Flesh is temporary. Cyber-chitin is permanent. Progress through 4 macro-stages and 12 micro-clearance sub-stages to complete biological ecdysis."
          </>
        }
      />

      {/* 12 Micro-Clearance Master Stepper */}
      <div className="bg-[#171c1c] border border-[#3a4a49] p-4 chamfer-corner shadow-chitin-plate">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-grotesk font-bold text-[#dfe3e3] uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#00ffff]" />
            ASCENSION LADDER: 12 INTERMEDIATE SUB-STAGES
          </span>
          <span className="text-[10px] text-[#839493] font-sans">
            Click any sub-stage node to inspect micro-protocols
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
          {allSubStages.map((sub) => {
            const completed = isCompleted(sub.code)
            const active = isCurrent(sub.code)
            const isSelected = selectedSubStage?.code === sub.code

            return (
              <button
                key={sub.code}
                onClick={() => {
                  setSelectedSubStage(sub)
                  setExpandedStage(sub.stageNum)
                }}
                className={`p-2 border text-center transition-all chamfer-corner relative flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? 'border-[#00ffff] bg-[#00ffff]/15 shadow-hud-cyan'
                    : active
                    ? 'border-[#ff0000] bg-[#ff0000]/10 text-white shadow-hud-red'
                    : completed
                    ? 'border-[#00ffff]/40 bg-[#00ffff]/5 text-[#00ffff]'
                    : 'border-[#3a4a49]/40 bg-[#0a0f0f] text-[#839493] hover:border-[#3a4a49]'
                }`}
              >
                <div className="text-[9px] font-bold tracking-tighter uppercase opacity-75">
                  ST-0{sub.stageNum}
                </div>
                <div className="text-xs font-bold font-grotesk tracking-widest">
                  {sub.code}
                </div>
                {active ? (
                  <Zap className="w-3 h-3 text-[#ff0000] animate-pulse" />
                ) : completed ? (
                  <CheckCircle2 className="w-3 h-3 text-[#00ffff]" />
                ) : (
                  <Lock className="w-3 h-3 text-[#839493]" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Micro-Stage Spotlight Drawer */}
      {selectedSubStage && (
        <div className="bg-[#0f1414] border border-[#00ffff]/50 p-4 chamfer-corner shadow-hud-cyan relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#00ffff]/20 border border-[#00ffff]/50 text-[#00ffff] text-[10px] font-bold uppercase tracking-wider font-sans">
                  CLEARANCE TIER: {selectedSubStage.code}
                </span>
                <span className="text-xs font-grotesk font-bold text-[#dfe3e3] uppercase">
                  {selectedSubStage.title}
                </span>
              </div>
              <p className="text-xs text-[#839493] font-sans leading-relaxed">
                <span className="text-[#dfe3e3] font-bold">Mandate Protocol:</span> {selectedSubStage.protocol}
              </p>
              <p className="text-xs text-[#839493] font-sans leading-relaxed">
                <span className="text-[#dfe3e3] font-bold">Requirement:</span> {selectedSubStage.requirement}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center shrink-0 border-t md:border-t-0 md:border-l border-[#3a4a49] pt-3 md:pt-0 md:pl-4">
              <div className="bg-[#030606] border border-[#3a4a49] p-2 chamfer-corner">
                <div className="text-[9px] text-[#839493] font-sans uppercase font-bold">Shell Hardness</div>
                <div className="text-xs font-bold text-[#00ffff] font-sans mt-0.5">{selectedSubStage.shellHardnessTarget}%</div>
              </div>
              <div className="bg-[#030606] border border-[#3a4a49] p-2 chamfer-corner">
                <div className="text-[9px] text-[#839493] font-sans uppercase font-bold">Pincer Torque</div>
                <div className="text-xs font-bold text-[#a855f7] font-sans mt-0.5">{selectedSubStage.pincerTorqueTarget}</div>
              </div>
              <div className="bg-[#030606] border border-[#3a4a49] p-2 chamfer-corner">
                <div className="text-[9px] text-[#839493] font-sans uppercase font-bold">Depth Rating</div>
                <div className="text-xs font-bold text-[#10b981] font-sans mt-0.5">{selectedSubStage.submergenceDepth}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Primary Stage Accordion & Details */}
      <div className="space-y-4">
        {STAGE_PIPELINE_DATA.map((stage: StagePipelineInfo) => {
          const isExpanded = expandedStage === stage.stageNum
          const hasCurrentSubStage = stage.subStages.some(sub => sub.code === currentSubStageCode)

          return (
            <div
              key={stage.stageNum}
              className={`border chamfer-corner transition-all duration-200 shadow-chitin-plate overflow-hidden ${
                hasCurrentSubStage
                  ? 'bg-[#171c1c] border-[#ff0000] shadow-hud-red'
                  : isExpanded
                  ? 'bg-[#171c1c] border-[#00ffff]/40'
                  : 'bg-[#0a0f0f] border-[#3a4a49]/60 opacity-90'
              }`}
            >
              {/* Stage Header Summary Bar */}
              <div
                onClick={() => setExpandedStage(isExpanded ? null : stage.stageNum)}
                className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#1f2626]/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 shrink-0 bg-[#030606] border border-[#3a4a49] overflow-hidden chamfer-corner relative">
                    <img src={getAssetUrl(stage.img)} alt={stage.stageTitle} className="w-full h-full object-cover" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-sans font-bold px-2 py-0.5 border ${stage.badgeColor}`}>
                        {stage.badge}
                      </span>
                      {hasCurrentSubStage && (
                        <span className="text-[10px] font-sans font-bold px-2 py-0.5 bg-[#ff0000] text-white border border-[#ff0000]">
                          ACTIVE STAGE
                        </span>
                      )}
                    </div>
                    <h3 className="font-grotesk font-bold text-base text-[#dfe3e3] uppercase tracking-wider mt-1">
                      {stage.stageTitle}
                    </h3>
                    <p className="text-xs text-[#839493] font-sans line-clamp-1 mt-0.5">
                      {stage.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                  <div className="text-xs text-[#839493] font-sans text-right hidden sm:block">
                    <span className="text-[#00ffff] font-bold">3 Micro-Sub-Stages</span>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-[#00ffff]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#839493]" />
                  )}
                </div>
              </div>

              {/* Sub-Stage Cards (Expanded view) */}
              {isExpanded && (
                <div className="border-t border-[#3a4a49]/60 p-4 bg-[#0a0f0f]/80 space-y-3">
                  <div className="text-xs font-grotesk font-bold text-[#dfe3e3] uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Shield className="w-3.5 h-3.5 text-[#00ffff]" />
                    MICRO-CLEARANCE BREAKDOWN (STAGE 0{stage.stageNum})
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {stage.subStages.map((sub: SubStageInfo) => {
                      const completed = isCompleted(sub.code)
                      const active = isCurrent(sub.code)
                      const isSelected = selectedSubStage?.code === sub.code

                      return (
                        <div
                          key={sub.code}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedSubStage(sub)
                          }}
                          className={`p-3 border chamfer-corner cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#171c1c] border-[#00ffff] shadow-hud-cyan'
                              : active
                              ? 'bg-[#171c1c] border-[#ff0000] shadow-hud-red'
                              : completed
                              ? 'bg-[#171c1c]/40 border-[#00ffff]/30'
                              : 'bg-[#030606] border-[#3a4a49]/40 opacity-75'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 border ${
                                active
                                  ? 'bg-[#ff0000] text-white border-[#ff0000]'
                                  : completed
                                  ? 'bg-[#00ffff]/10 text-[#00ffff] border-[#00ffff]/40'
                                  : 'bg-[#3a4a49]/20 text-[#839493] border-[#3a4a49]'
                              }`}>
                                CLEARANCE {sub.code}
                              </span>
                              {active ? (
                                <Zap className="w-3.5 h-3.5 text-[#ff0000] animate-pulse" />
                              ) : completed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#00ffff]" />
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-[#839493]" />
                              )}
                            </div>

                            <h4 className="font-grotesk font-bold text-xs text-[#dfe3e3] uppercase">
                              {sub.shortTitle}
                            </h4>

                            <p className="text-[11px] text-[#839493] font-sans leading-relaxed">
                              {sub.requirement}
                            </p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-[#3a4a49]/40 flex items-center justify-between text-[10px] font-sans text-[#839493]">
                            <span>Hardness: <strong className="text-[#00ffff]">{sub.shellHardnessTarget}%</strong></span>
                            <span>Depth: <strong className="text-[#dfe3e3]">{sub.submergenceDepth}</strong></span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs font-sans text-[#839493]">
                    <span>Consult canonical scriptures for stage 0{stage.stageNum} mandates:</span>
                    <Link
                      to="/codex"
                      className="text-[#00ffff] hover:underline flex items-center gap-1 font-bold uppercase"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      READ STAGE 0{stage.stageNum} SCRIPTURE
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


