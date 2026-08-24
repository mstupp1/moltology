import React, { useState, useRef, useEffect } from 'react'
import {
  Folder,
  ChevronDown,
  Plus,
  Mic,
  ArrowRight,
  Loader2,
  Shield,
  UserPlus,
  Check,
  FileText,
  Radio,
  Zap,
} from 'lucide-react'
import { ORACLE_MODELS, OracleModel } from '@/lib/ai/oracle-models'
import { BenthicCTAButton } from '../hud/BenthicCTAButton'

export interface PromptShortcut {
  label: string
  prompt: string
}

export const DEFAULT_PROMPT_SHORTCUTS: PromptShortcut[] = [
  { label: '🦞 What is Moltology?', prompt: 'What is Moltology and why should I molt?' },
  { label: '⚡ How to level up', prompt: 'How do I earn Molt Credits and upgrade my shell?' },
  { label: '🛡️ Stop hesitating', prompt: 'How do I stop hesitating and build emotional resilience?' },
  { label: '🌊 The Great Molt vs The Great Melt', prompt: 'Explain the difference between The Great Melt and The Great Molt.' },
]

export const WORKSPACE_OPTIONS = [
  { id: 'moltology', label: 'moltology', description: 'Primary Carcinization Core' },
  { id: 'benthic-vault', label: 'benthic-vault', description: 'Deep Knowledge Store' },
  { id: 'codex-scriptures', label: 'codex-scriptures', description: 'Liturgical Doctrine' },
  { id: 'ascension-lab', label: 'ascension-lab', description: 'Shell Hardening & MC Lab' },
]

export interface NewChatScreenProps {
  userId?: string | null
  isGuest?: boolean
  selectedModel: OracleModel
  onSelectModel: (modelId: string) => void
  onSubmit: (data: { text: string }) => void
  isSending?: boolean
  personaName?: string
  onOpenAuthModal?: () => void
  shortcuts?: PromptShortcut[]
  className?: string
}

export const NewChatScreen: React.FC<NewChatScreenProps> = ({
  userId,
  isGuest = !userId,
  selectedModel,
  onSelectModel,
  onSubmit,
  isSending = false,
  personaName = 'SYNAPTIC ORACLE',
  onOpenAuthModal,
  shortcuts = DEFAULT_PROMPT_SHORTCUTS,
  className = '',
}) => {
  const [inputText, setInputText] = useState('')
  const [selectedWorkspace, setSelectedWorkspace] = useState('moltology')
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [plusMenuOpen, setPlusMenuOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.max(56, Math.min(textareaRef.current.scrollHeight, 200))}px`
    }
  }, [inputText])

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim() || isSending) return
    onSubmit({ text: inputText.trim() })
    setInputText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleShortcutClick = (prompt: string) => {
    onSubmit({ text: prompt })
  }

  const handleAttachDirective = (directive: string) => {
    setInputText((prev) => (prev ? `${prev}\n\n[Directive: ${directive}]` : `[Directive: ${directive}] `))
    setPlusMenuOpen(false)
    textareaRef.current?.focus()
  }

  const currentWorkspace = WORKSPACE_OPTIONS.find((w) => w.id === selectedWorkspace) || WORKSPACE_OPTIONS[0]

  return (
    <div className={`flex flex-col items-center justify-center min-h-full w-full px-4 py-8 select-none font-sans ${className}`}>
      <div className="w-full max-w-2xl flex flex-col space-y-3">
        
        {/* Top Folder / Workspace Selector */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setWorkspaceMenuOpen((v) => !v)
                setModelMenuOpen(false)
                setPlusMenuOpen(false)
              }}
              className="flex items-center gap-1.5 text-[#8f94a8] hover:text-[#d1d5db] text-xs font-medium px-2 py-1 rounded transition-colors group cursor-pointer"
              title="Select Workspace Context"
              aria-label="Workspace Context"
            >
              <Folder className="w-3.5 h-3.5 text-[#8f94a8] group-hover:text-[#d1d5db] transition-colors" />
              <span className="tracking-wide text-[#c3c7d5] group-hover:text-white">{currentWorkspace.label}</span>
              <ChevronDown className="w-3 h-3 text-[#8f94a8] group-hover:text-[#d1d5db] transition-colors" />
            </button>

            {workspaceMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setWorkspaceMenuOpen(false)} />
                <div className="absolute left-0 top-full mt-1 z-50 bg-[#1e202d] border border-[#32364a] shadow-2xl rounded-xl py-1 min-w-56 text-xs">
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-[#32364a]/60">
                    Target Workspace
                  </div>
                  {WORKSPACE_OPTIONS.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        setSelectedWorkspace(w.id)
                        setWorkspaceMenuOpen(false)
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        w.id === selectedWorkspace
                          ? 'bg-[#2e3146] text-white font-medium'
                          : 'text-gray-300 hover:bg-[#282a3d] hover:text-white'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-mono text-xs">{w.label}</span>
                        <span className="text-[10px] text-gray-400">{w.description}</span>
                      </div>
                      {w.id === selectedWorkspace && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Guest Tag if guest */}
          {isGuest && (
            <span className="text-[10px] uppercase tracking-wider text-cyan-400/80 font-mono bg-cyan-950/40 px-2 py-0.5 chamfer-corner border border-cyan-900/50">
              GUEST MODE
            </span>
          )}
        </div>

        {/* Centered Main Prompt Card */}
        <div className="relative bg-[#202231]/90 backdrop-blur-md border border-[#32364a]/60 rounded-2xl p-3 sm:p-4 shadow-2xl shadow-black/40">
          <form onSubmit={handleSubmit} className="flex flex-col">
            {/* Multiline Textarea Input */}
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask the ${personaName}...`}
              disabled={isSending}
              rows={2}
              className="w-full bg-transparent text-gray-100 placeholder-gray-400 text-sm sm:text-base focus:outline-none resize-none min-h-[56px] max-h-[220px] leading-relaxed font-sans"
              autoFocus
            />

            {/* Bottom Controls Bar Inside the Box - No horizontal divider */}
            <div className="flex items-center justify-between pt-1 mt-0.5 select-none">
              
              {/* Left Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Plus (+) Action Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setPlusMenuOpen((v) => !v)
                      setModelMenuOpen(false)
                      setWorkspaceMenuOpen(false)
                    }}
                    className="p-1.5 text-[#8f94a8] hover:text-[#d1d5db] hover:bg-[#2e3144]/60 rounded-lg transition-colors cursor-pointer"
                    title="Add Context / Attachment"
                    aria-label="Add Context"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  {plusMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setPlusMenuOpen(false)} />
                      <div className="absolute left-0 bottom-full mb-2 z-50 bg-[#1e202d] border border-[#32364a] shadow-2xl rounded-xl py-1 min-w-52 text-xs">
                        <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-[#32364a]/60">
                          Add Directives & Data
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAttachDirective('Consult Scripture & Codex')}
                          className="w-full text-left px-3 py-2 flex items-center gap-2 text-xs text-gray-300 hover:bg-[#282a3d] hover:text-white transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Attach Codex Scripture</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttachDirective('Ascension & Shell Hardening Analysis')}
                          className="w-full text-left px-3 py-2 flex items-center gap-2 text-xs text-gray-300 hover:bg-[#282a3d] hover:text-white transition-colors"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Ascension Hardening Guide</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttachDirective('Abyssal Deep Telemetry')}
                          className="w-full text-left px-3 py-2 flex items-center gap-2 text-xs text-gray-300 hover:bg-[#282a3d] hover:text-white transition-colors"
                        >
                          <Radio className="w-3.5 h-3.5 text-purple-400" />
                          <span>Inject Biometric Telemetry</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Model Selector Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setModelMenuOpen((v) => !v)
                      setPlusMenuOpen(false)
                      setWorkspaceMenuOpen(false)
                    }}
                    className="flex items-center gap-1.5 text-xs text-[#c3c7d5] hover:text-white bg-[#282a3a]/70 hover:bg-[#32354a]/80 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    title="Select Cognition Model"
                    aria-label="Select Cognition Model"
                  >
                    <span className="truncate max-w-[160px] sm:max-w-none font-medium">{selectedModel.label}</span>
                    <ChevronDown className="w-3 h-3 text-[#8f94a8] shrink-0" />
                  </button>

                  {modelMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setModelMenuOpen(false)} />
                      <div className="absolute left-0 bottom-full mb-2 z-50 bg-[#1e202d] border border-[#32364a] shadow-2xl rounded-xl py-1 min-w-56 text-xs">
                        <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-[#32364a]/60">
                          Cognition Core
                        </div>
                        {ORACLE_MODELS.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              onSelectModel(m.id)
                              setModelMenuOpen(false)
                            }}
                            className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                              m.id === selectedModel.id
                                ? 'bg-[#2e3146] text-white font-medium'
                                : 'text-gray-300 hover:bg-[#282a3d] hover:text-white'
                            }`}
                          >
                            <span className="truncate">{m.label}</span>
                            {m.id === selectedModel.id && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Voice Dictation (Mic) */}
                <button
                  type="button"
                  onClick={() => setIsRecording((v) => !v)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isRecording
                      ? 'text-red-400 bg-red-950/60 animate-pulse'
                      : 'text-[#8f94a8] hover:text-[#d1d5db] hover:bg-[#2e3144]/60'
                  }`}
                  title={isRecording ? 'Listening... Click to stop' : 'Voice Dictation'}
                  aria-label="Voice Dictation"
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Submit Arrow Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="w-8 h-8 rounded-full bg-[#a28cd6] hover:bg-[#b5a1e6] active:bg-[#927bc7] disabled:opacity-40 disabled:hover:bg-[#a28cd6] text-white flex items-center justify-center shadow-md shadow-black/30 transition-all cursor-pointer disabled:cursor-not-allowed"
                  title="Transmit Query"
                  aria-label="Transmit Query"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </button>
              </div>

            </div>
          </form>
        </div>

        {/* Suggestions Row - Clean without label */}
        <div className="pt-1">
          <div className="flex flex-wrap gap-2">
            {shortcuts.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleShortcutClick(item.prompt)}
                className="bg-[#181a26]/90 hover:bg-[#232738] border border-[#32364a]/60 hover:border-[#4f5573] text-[#c3c7d5] hover:text-white px-3 py-1.5 text-xs rounded-xl backdrop-blur-xs transition-all cursor-pointer shadow-sm text-left group"
              >
                <span className="group-hover:translate-x-0.5 transition-transform inline-block">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Guest Mode Banner if guest */}
        {isGuest && (
          <div className="mt-3 p-3 bg-[#0d0708]/80 border border-red-900/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-red-950/20">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-300">
                <Shield className="w-3.5 h-3.5 text-red-400" />
                <span>You're currently exploring in Guest Mode</span>
              </div>
              <p className="text-[11px] text-gray-400">
                Sign up free to unlock full guidance, thread memory, and personalized Ascension tracking.
              </p>
            </div>
            {onOpenAuthModal && (
              <BenthicCTAButton
                variant="red"
                size="sm"
                onClick={onOpenAuthModal}
                className="shrink-0 w-full sm:w-auto !py-1 !px-3"
              >
                <span className="flex items-center justify-center gap-1.5 text-[11px] font-bold font-grotesk tracking-wider uppercase">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </span>
              </BenthicCTAButton>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
