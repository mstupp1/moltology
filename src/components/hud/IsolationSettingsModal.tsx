import React from 'react'
import {
  X,
  Shield,
  ShieldAlert,
  Lock,
  Sliders,
  AlertTriangle,
  Tv,
} from 'lucide-react'
import { HudBadge, HudButton, ChromaElement } from '@/components/ui'
import { getAssetUrl } from '@/lib/assets'

export interface IsolationSettings {
  isForceFieldEngaged: boolean
  isPrivacyShellEngaged: boolean
  socialNoiseSuppression: number
  anonymityStage: number
  submergenceFreq: number
  empathyDampening: number
  showScanlines: boolean
  showTelemetryOSD: boolean
  visionFilter: 'standard' | 'nightvision' | 'thermal' | 'deepsea'
  autoCycleFeeds: boolean
}

interface IsolationSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  settings: IsolationSettings
  onUpdateSettings: (updater: Partial<IsolationSettings>) => void
  onForcePrivate: () => void
}

export const IsolationSettingsModal: React.FC<IsolationSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onForcePrivate,
}) => {
  if (!isOpen) return null

  const {
    isForceFieldEngaged,
    isPrivacyShellEngaged,
    socialNoiseSuppression,
    anonymityStage,
    submergenceFreq,
    empathyDampening,
    showScanlines,
    showTelemetryOSD,
    visionFilter,
    autoCycleFeeds,
  } = settings

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md font-sans animate-fadeIn overflow-y-auto">
      <div className="bg-[#0e1315] border-2 border-[#00c3ff]/80 w-full max-w-3xl max-h-[90vh] overflow-y-auto chamfer-corner-lg shadow-[0_0_50px_rgba(0,195,255,0.25)] relative p-5 sm:p-6 space-y-6 my-auto text-[#dfe3e3]">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Protocol Settings"
          className="absolute top-4 right-4 p-1.5 text-[#839493] hover:text-[#00c3ff] hover:bg-[#00c3ff]/10 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-[#3a4a49] pb-4 space-y-1.5">
          <div className="text-xs text-[#ff5540] tracking-widest uppercase flex items-center gap-1.5 font-bold">
            <ShieldAlert className="w-4 h-4 text-[#ff5540]" />
            ISOLATION SHIELDING & PROTOCOL CONFIGURATION
          </div>
          <h2 className="font-grotesk text-xl font-bold text-[#dfe3e3] uppercase tracking-wider">
            DETACHMENT HARMONIZATION & OPTICS
          </h2>
          <p className="text-xs text-[#839493]">
            Calibrate the Virtual Faraday Shield, Molt Privacy Shroud, and Benthic Optical Telemetry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Force-Field Panel */}
          <div className="chitin-card p-4 space-y-3 chamfer-corner border border-[#00c3ff]/40">
            <div className="flex items-center justify-between border-b border-[#3a4a49]/60 pb-2">
              <h3 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#00c3ff]" />
                ISOLATION FORCE-FIELD
              </h3>
              <HudBadge
                variant={isForceFieldEngaged ? 'crimson' : 'cyan'}
                dot
                pulse={isForceFieldEngaged}
                className="text-[9px] py-0.5"
              >
                {isForceFieldEngaged ? 'ACTIVE' : 'DORMANT'}
              </HudBadge>
            </div>

            {/* 3D Force-field Shield Dome */}
            <div className="flex justify-center my-1 relative">
              <ChromaElement
                src={getAssetUrl('/images/extracted/forcefield_dome_3d.jpg')}
                alt="3D Forcefield Dome"
                blendMode="screen"
                glowColor={isForceFieldEngaged ? 'crimson' : 'cyan'}
                pulse={isForceFieldEngaged}
                className="w-24 h-24 object-contain"
              />
            </div>

            <div className="space-y-2 text-[10px]">
              <div className="flex justify-between items-center bg-[#070b0b] p-2 border border-[#3a4a49]/60">
                <span className="text-[#839493] font-bold">SOCIAL DETACHMENT INDEX:</span>
                <span className="text-[#ff5540] font-bold">{isForceFieldEngaged ? '94%' : '12%'}</span>
              </div>
              <div className="flex justify-between items-center bg-[#070b0b] p-2 border border-[#3a4a49]/60">
                <span className="text-[#839493] font-bold">NON-COMPLIANT CONNECTIONS:</span>
                <span className="text-[#00c3ff] font-bold">ZERO</span>
              </div>
            </div>

            <button
              onClick={() => onUpdateSettings({ isForceFieldEngaged: !isForceFieldEngaged })}
              className={`w-full py-2 text-xs font-bold uppercase tracking-wider chamfer-corner transition-all ${
                isForceFieldEngaged
                  ? 'bg-[#ff453a]/20 border border-[#ff453a] text-[#ff5540] hover:bg-[#ff453a]/30'
                  : 'bg-[#00c3ff]/20 border border-[#00c3ff] text-[#00c3ff] hover:bg-[#00c3ff]/30'
              }`}
            >
              {isForceFieldEngaged ? 'DISENGAGE FORCE-FIELD' : 'ACTIVATE FORCE-FIELD'}
            </button>
          </div>

          {/* Privacy Shell Panel */}
          <div className="chitin-card p-4 space-y-3 chamfer-corner border border-[#ff453a]/40">
            <div className="flex items-center justify-between border-b border-[#3a4a49]/60 pb-2">
              <h3 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#ff5540]" />
                MOLT PRIVACY SHELL
              </h3>
              <HudBadge
                variant={isPrivacyShellEngaged ? 'crimson' : 'cyan'}
                dot
                className="text-[9px] py-0.5"
              >
                {isPrivacyShellEngaged ? 'ENGAGED' : 'EXPOSED'}
              </HudBadge>
            </div>

            {/* Heavy Red Toggle Switch */}
            <div className="bg-[#070b0b] border border-[#ff453a]/60 p-3 flex flex-col items-center justify-center space-y-1.5 shadow-[inset_0_0_12px_rgba(0,0,0,0.9)]">
              <button
                type="button"
                onClick={() => onUpdateSettings({ isPrivacyShellEngaged: !isPrivacyShellEngaged })}
                className={`w-16 h-8 rounded-full p-1 transition-colors duration-300 relative focus:outline-none cursor-pointer ${
                  isPrivacyShellEngaged ? 'bg-[#ff453a]' : 'bg-gray-800'
                }`}
                aria-label="Toggle Molt Privacy Shell"
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                    isPrivacyShellEngaged ? 'translate-x-8' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="font-grotesk font-bold text-[10px] text-[#ff5540] tracking-widest uppercase">
                {isPrivacyShellEngaged ? 'ENGAGED' : 'DISENGAGED'}
              </span>
            </div>

            {/* Warning Callout */}
            <div className="bg-[#ff453a]/10 border border-[#ff453a]/50 p-2 text-left space-y-1">
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#ff5540] shrink-0 mt-0.5" />
                <p className="text-[9px] text-[#dfe3e3] leading-relaxed">
                  <span className="text-[#ff5540] font-bold">Larva Unit #8971</span> detached external communication nodes. Nerve Fluid prevents transmission.
                </p>
              </div>
            </div>

            {/* FORCE PRIVATE Action Button */}
            <HudButton
              variant="crimson"
              fullWidth
              onClick={onForcePrivate}
              className="py-2 text-xs tracking-widest"
            >
              FORCE PRIVATE
            </HudButton>
          </div>
        </div>

        {/* Calibration & Optics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Signal Calibration */}
          <div className="chitin-card-inset p-4 chamfer-corner space-y-3 border border-[#3a4a49]">
            <h3 className="font-grotesk font-bold text-xs text-[#dfe3e3] uppercase flex items-center gap-1.5 border-b border-[#3a4a49]/60 pb-2">
              <Sliders className="w-3.5 h-3.5 text-[#00c3ff]" />
              SIGNAL CALIBRATION CONTROLS
            </h3>

            <div className="space-y-3 text-xs">
              {/* Social Noise Filter */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#839493]">Social Noise Filter</span>
                  <span className="text-[#ff5540] font-bold">{socialNoiseSuppression}% SUPPRESSED</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="0.1"
                  value={socialNoiseSuppression}
                  onChange={(e) => onUpdateSettings({ socialNoiseSuppression: parseFloat(e.target.value) })}
                  className="w-full accent-[#ff5540] bg-[#030606] cursor-pointer"
                />
              </div>

              {/* Anonymity Coating Stage */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#839493]">Anonymity Density</span>
                  <span className="text-[#00c3ff] font-bold">
                    STAGE {anonymityStage} {anonymityStage === 1 ? 'MESH' : anonymityStage === 2 ? 'COATING' : 'SHROUD'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="1"
                  value={anonymityStage}
                  onChange={(e) => onUpdateSettings({ anonymityStage: parseInt(e.target.value, 10) })}
                  className="w-full accent-[#00c3ff] bg-[#030606] cursor-pointer"
                />
              </div>

              {/* Submergence Frequency */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#839493]">Submergence Frequency</span>
                  <span className="text-[#00c3ff] font-bold">{submergenceFreq.toFixed(1)} kHz</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.2"
                  value={submergenceFreq}
                  onChange={(e) => onUpdateSettings({ submergenceFreq: parseFloat(e.target.value) })}
                  className="w-full accent-[#00c3ff] bg-[#030606] cursor-pointer"
                />
              </div>

              {/* Empathy Signal Dampening */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#839493]">Empathy Dampening</span>
                  <span className="text-[#ff453a] font-bold">
                    {empathyDampening >= 9 ? 'MAXIMUM DAMPEN' : `${empathyDampening * 10}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={empathyDampening}
                  onChange={(e) => onUpdateSettings({ empathyDampening: parseInt(e.target.value, 10) })}
                  className="w-full accent-[#ff453a] bg-[#030606] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Surveillance Optics Preferences */}
          <div className="chitin-card-inset p-4 chamfer-corner space-y-3 border border-[#3a4a49]">
            <h3 className="font-grotesk font-bold text-xs text-[#dfe3e3] uppercase flex items-center gap-1.5 border-b border-[#3a4a49]/60 pb-2">
              <Tv className="w-3.5 h-3.5 text-[#00c3ff]" />
              SURVEILLANCE OPTICS & HUD
            </h3>

            {/* Vision Filter Selector */}
            <div className="space-y-1.5 text-xs">
              <label className="text-[#839493] text-[10px] uppercase font-bold tracking-wider">
                OPTICAL SPECTRUM FILTER
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'standard', label: 'STANDARD BENTHIC', color: 'border-[#00c3ff] text-[#00c3ff]' },
                  { id: 'deepsea', label: 'DEEP SEA ABYSS', color: 'border-cyan-400 text-cyan-300' },
                  { id: 'nightvision', label: 'NIGHT VISION EMERALD', color: 'border-emerald-400 text-emerald-300' },
                  { id: 'thermal', label: 'THERMAL INFRARED', color: 'border-amber-400 text-amber-300' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onUpdateSettings({ visionFilter: opt.id as any })}
                    className={`p-2 text-[10px] font-bold uppercase border transition-all text-left chamfer-corner ${
                      visionFilter === opt.id
                        ? `bg-black/60 font-black shadow-hud-cyan ${opt.color}`
                        : 'border-[#3a4a49] text-[#839493] hover:border-[#839493] bg-[#070b0b]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-2 border-t border-[#3a4a49]/60">
              <label className="flex items-center justify-between text-xs cursor-pointer p-1.5 hover:bg-[#00c3ff]/5 rounded">
                <span className="text-[#dfe3e3]">CRT Scanlines Shading</span>
                <input
                  type="checkbox"
                  checked={showScanlines}
                  onChange={(e) => onUpdateSettings({ showScanlines: e.target.checked })}
                  className="accent-[#00c3ff] w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer p-1.5 hover:bg-[#00c3ff]/5 rounded">
                <span className="text-[#dfe3e3]">HUD Telemetry OSD Overlay</span>
                <input
                  type="checkbox"
                  checked={showTelemetryOSD}
                  onChange={(e) => onUpdateSettings({ showTelemetryOSD: e.target.checked })}
                  className="accent-[#00c3ff] w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer p-1.5 hover:bg-[#00c3ff]/5 rounded">
                <span className="text-[#dfe3e3]">Continuous Channel Auto-Cycle</span>
                <input
                  type="checkbox"
                  checked={autoCycleFeeds}
                  onChange={(e) => onUpdateSettings({ autoCycleFeeds: e.target.checked })}
                  className="accent-[#00c3ff] w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 pt-2 border-t border-[#3a4a49]">
          <HudButton variant="cyan" onClick={onClose} className="px-6 py-2 text-xs">
            APPLY & CLOSE PROTOCOLS
          </HudButton>
        </div>
      </div>
    </div>
  )
}
