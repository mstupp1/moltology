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
  Sparkles,
} from 'lucide-react'
import { ORACLE_MODELS, OracleModel, DEFAULT_ORACLE_PLACEHOLDER } from '@/lib/ai/oracle-models'
import { BenthicCTAButton } from '../hud/BenthicCTAButton'

export interface PromptShortcut {
  label: string
  prompt: string
  emoji?: string
}

export const DEFAULT_PROMPT_SHORTCUTS: PromptShortcut[] = [
  { label: 'what is moltology', emoji: '🦞', prompt: 'What is Moltology and why should I molt?' },
  { label: 'how do i moltmaxx', emoji: '⚡', prompt: 'How do I start moltmaxxing and optimize my routine?' },
  { label: 'how to earn molt credits', emoji: '💎', prompt: 'How do I earn Molt Credits and upgrade my shell?' },
  { label: 'stop hesitating & build chitin armor', emoji: '🛡️', prompt: 'How do I stop hesitating and build emotional resilience?' },
  { label: 'the great molt vs the great melt', emoji: '🌊', prompt: 'Explain the difference between The Great Melt and The Great Molt.' },
  { label: 'how to level up my clearance stage', emoji: '🧬', prompt: 'What are the clearances and stages of Carcinization?' },
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
  placeholder?: string
  /** When false, the cognition model picker is hidden (default). Admins only. */
  showModelPicker?: boolean
}

export const NewChatScreen: React.FC<NewChatScreenProps> = ({
  userId,
  isGuest = false,
  selectedModel,
  onSelectModel,
  onSubmit,
  isSending = false,
  personaName = 'SYNAPTIC ORACLE',
  placeholder = DEFAULT_ORACLE_PLACEHOLDER,
  onOpenAuthModal,
  shortcuts = DEFAULT_PROMPT_SHORTCUTS,
  className = '',
  showModelPicker = false,
}) => {
  const [inputText, setInputText] = useState('')
  const [selectedWorkspace, setSelectedWorkspace] = useState('moltology')
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [plusMenuOpen, setPlusMenuOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  // Gentle thought cycler state (fade in/out, up/down)
  const [activeShortcutIndex, setActiveShortcutIndex] = useState(0)
  const [animPhase, setAnimPhase] = useState<'entering' | 'active' | 'exiting'>('active')
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (!shortcuts || shortcuts.length <= 1 || isHovered) return

    const displayDuration = 4200
    const transitionDuration = 750

    const timer = setTimeout(() => {
      setAnimPhase('exiting')
      const switchTimer = setTimeout(() => {
        setActiveShortcutIndex((prev) => (prev + 1) % shortcuts.length)
        setAnimPhase('entering')
        const enterTimer = setTimeout(() => {
          setAnimPhase('active')
        }, 50)
        return () => clearTimeout(enterTimer)
      }, transitionDuration)

      return () => clearTimeout(switchTimer)
    }, displayDuration)

    return () => clearTimeout(timer)
  }, [activeShortcutIndex, isHovered, shortcuts])

  const currentThought = shortcuts && shortcuts.length > 0
    ? shortcuts[activeShortcutIndex % shortcuts.length]
    : null

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    if (!window.matchMedia('(pointer: coarse)').matches) {
      textareaRef.current?.focus()
    }
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.max(36, Math.min(textareaRef.current.scrollHeight, 180))}px`
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
    <div className={`flex flex-col items-center justify-center min-h-full w-full px-3 sm:px-4 py-4 sm:py-6 select-none font-sans ${className}`}>
      <div className="w-full max-w-2xl flex flex-col space-y-2">
        
        {/* Subtle Synaptic Thought Cycler (Above Folder / Workspace Row) */}
        {currentThought && (
          <div className="flex items-center justify-center min-h-[30px] overflow-hidden">
            <button
              type="button"
              onClick={() => handleShortcutClick(currentThought.prompt)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={`group inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-control bg-surface-1/70 hover:bg-surface-2 border border-line-subtle hover:border-line-strong text-xs text-ink-muted hover:text-ink cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow select-none backdrop-blur-xs transition-all ${
                animPhase === 'entering'
                  ? 'opacity-0 translate-y-2 duration-0'
                  : animPhase === 'exiting'
                  ? 'opacity-0 -translate-y-2 duration-700 ease-in'
                  : 'opacity-100 translate-y-0 duration-700 ease-out'
              }`}
              title="Click to consult the Oracle on this thought"
              aria-label={`Ask: ${currentThought.label}`}
            >
              <Sparkles className="w-3 h-3 text-cyan-glow/70 group-hover:text-cyan-glow transition-colors animate-pulse shrink-0" />
              <span className="font-sans text-xs tracking-wide text-ink-body group-hover:text-ink transition-colors">
                {currentThought.label}
              </span>
              {currentThought.emoji && (
                <span className="text-xs shrink-0 leading-none">{currentThought.emoji}</span>
              )}
            </button>
          </div>
        )}

        {/* Top Folder / Workspace Selector */}
        <div className="flex items-center justify-between px-0.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setWorkspaceMenuOpen((v) => !v)
                setModelMenuOpen(false)
                setPlusMenuOpen(false)
              }}
              className="flex items-center gap-1 text-ink-muted hover:text-ink hover:bg-surface-2 text-xs font-medium px-1.5 py-0.5 rounded-control transition-colors group cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
              title="Select Workspace Context"
              aria-label="Workspace Context"
            >
              <Folder className="w-3.5 h-3.5 text-ink-muted group-hover:text-cyan-glow transition-colors" />
              <span className="tracking-wide text-ink-body group-hover:text-ink">{currentWorkspace.label}</span>
              <ChevronDown className="w-3 h-3 text-ink-muted group-hover:text-ink transition-colors" />
            </button>

            {workspaceMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setWorkspaceMenuOpen(false)} />
                <div className="absolute left-0 top-full mt-1 z-50 bg-surface-2 border border-line shadow-menu rounded-card py-1 min-w-56 text-xs">
                  <div className="px-3 py-1 text-[11px] font-bold text-ink-muted uppercase tracking-[0.08em] border-b border-line-subtle">
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
                          ? 'bg-surface-3 text-ink font-medium'
                          : 'text-ink-body hover:bg-surface-3 hover:text-ink'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-mono text-xs">{w.label}</span>
                        <span className="text-[11px] text-ink-muted">{w.description}</span>
                      </div>
                      {w.id === selectedWorkspace && <Check className="w-3.5 h-3.5 text-cyan-glow shrink-0" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Guest Tag if guest */}
          {isGuest && (
            <span className="text-[11px] uppercase tracking-[0.08em] text-cyan-glow font-mono bg-cyan-soft px-2 py-0.5 rounded-chip">
              GUEST MODE
            </span>
          )}
        </div>

        {/* Centered Main Prompt Card */}
        <div className="relative bg-surface-2 border border-line rounded-control p-2 sm:p-2.5 transition-[border-color,box-shadow] focus-within:border-cyan-glow focus-within:shadow-field-focus">
          <form onSubmit={handleSubmit} className="flex flex-col">
            {/* Multiline Textarea Input */}
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isSending}
              rows={1}
              className="w-full bg-transparent text-ink placeholder-ink-muted text-xs sm:text-sm focus:outline-none resize-none min-h-[36px] max-h-[180px] leading-relaxed font-sans px-1 py-0.5"
            />

            {/* Bottom Controls Bar Inside the Box - No horizontal divider */}
            <div className="flex items-center justify-between pt-1 select-none">
              
              {/* Left Action Buttons */}
              <div className="flex items-center gap-1.5">
                {/* Plus (+) Action Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setPlusMenuOpen((v) => !v)
                      setModelMenuOpen(false)
                      setWorkspaceMenuOpen(false)
                    }}
                    className="p-1 text-ink-muted hover:text-ink hover:bg-surface-3 rounded-control transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                    title="Add Context / Attachment"
                    aria-label="Add Context"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  {plusMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setPlusMenuOpen(false)} />
                      <div className="absolute left-0 bottom-full mb-2 z-50 bg-surface-2 border border-line shadow-menu rounded-card py-1 min-w-52 text-xs">
                        <div className="px-3 py-1 text-[11px] font-bold text-ink-muted uppercase tracking-[0.08em] border-b border-line-subtle">
                          Add Directives & Data
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAttachDirective('Consult Scripture & Codex')}
                          className="w-full text-left px-3 py-2 flex items-center gap-2 text-xs text-ink-body hover:bg-surface-3 hover:text-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow"
                        >
                          <FileText className="w-3.5 h-3.5 text-cyan-glow" />
                          <span>Attach Codex Scripture</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttachDirective('Ascension & Shell Hardening Analysis')}
                          className="w-full text-left px-3 py-2 flex items-center gap-2 text-xs text-ink-body hover:bg-surface-3 hover:text-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Ascension Hardening Guide</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttachDirective('Abyssal Deep Telemetry')}
                          className="w-full text-left px-3 py-2 flex items-center gap-2 text-xs text-ink-body hover:bg-surface-3 hover:text-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow"
                        >
                          <Radio className="w-3.5 h-3.5 text-purple-400" />
                          <span>Inject Biometric Telemetry</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Model Selector Dropdown (admin only) */}
                {showModelPicker && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setModelMenuOpen((v) => !v)
                      setPlusMenuOpen(false)
                      setWorkspaceMenuOpen(false)
                    }}
                    className="flex items-center gap-1 text-[11px] sm:text-xs text-ink-body hover:text-ink bg-surface-1 border border-line hover:bg-surface-3 hover:border-line-strong px-2 py-0.5 rounded-control transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                    title="Select Cognition Model"
                    aria-label="Select Cognition Model"
                  >
                    <span className="truncate max-w-[140px] sm:max-w-none font-medium">{selectedModel.label}</span>
                    <ChevronDown className="w-3 h-3 text-ink-muted shrink-0" />
                  </button>

                  {modelMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setModelMenuOpen(false)} />
                      <div className="absolute left-0 bottom-full mb-2 z-50 bg-surface-2 border border-line shadow-menu rounded-card py-1 w-[380px] sm:w-[410px] max-w-[calc(100vw-2rem)] text-xs">
                        <div className="px-3 py-1.5 grid grid-cols-[1fr_56px_52px_48px_16px] items-center gap-2 text-[11px] font-mono font-bold text-ink-muted uppercase tracking-[0.08em] border-b border-line-subtle select-none">
                          <span>Model</span>
                          <span className="text-right">In / 1M</span>
                          <span className="text-right">Out / 1M</span>
                          <span className="text-right">Latency</span>
                          <span />
                        </div>
                        {ORACLE_MODELS.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              onSelectModel(m.id)
                              setModelMenuOpen(false)
                            }}
                            className={`w-full text-left px-3 py-2 grid grid-cols-[1fr_56px_52px_48px_16px] items-center gap-2 text-xs transition-colors cursor-pointer group ${
                              m.id === selectedModel.id
                                ? 'bg-surface-3 text-ink font-medium'
                                : 'text-ink-body hover:bg-surface-3 hover:text-ink'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0 pr-1">
                              <span className="truncate">{m.label}</span>
                              {m.badge === 'Chat' && (
                                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-chip bg-cyan-soft text-cyan-glow shrink-0">
                                  Chat
                                </span>
                              )}
                              {m.badge === 'Titles' && (
                                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-chip bg-amber-500/15 text-amber-300 shrink-0">
                                  Titles
                                </span>
                              )}
                            </div>
                            <span className="text-right font-mono text-[11px] text-ink-muted group-hover:text-ink-body">
                              {m.pricing?.input ?? '—'}
                            </span>
                            <span className="text-right font-mono text-[11px] text-ink-muted group-hover:text-ink-body">
                              {m.pricing?.output ?? '—'}
                            </span>
                            <span className="text-right font-mono text-[11px] text-emerald-400/90 font-medium">
                              {m.latency ?? '—'}
                            </span>
                            <div className="flex items-center justify-end">
                              {m.id === selectedModel.id && <Check className="w-3.5 h-3.5 text-cyan-glow shrink-0" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                )}
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-1.5">
                {/* Voice Dictation (Mic) */}
                <button
                  type="button"
                  onClick={() => setIsRecording((v) => !v)}
                  className={`p-1 rounded-control transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                    isRecording
                      ? 'text-crimson-text bg-crimson-soft animate-pulse'
                      : 'text-ink-muted hover:text-ink hover:bg-surface-3'
                  }`}
                  title={isRecording ? 'Listening... Click to stop' : 'Voice Dictation'}
                  aria-label="Voice Dictation"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>

                {/* Submit Arrow Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="w-7 h-7 rounded-full bg-cyan-glow hover:bg-cyan-hover active:bg-cyan-dim disabled:opacity-40 disabled:hover:bg-cyan-glow text-abyss flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                  title="Transmit Query"
                  aria-label="Transmit Query"
                >
                  {isSending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

            </div>
          </form>
        </div>

        {/* Guest Mode Banner if guest */}
        {isGuest && (
          <div className="mt-3 p-3 bg-surface-1 hud-sheen border border-line-subtle rounded-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                <Shield className="w-3.5 h-3.5 text-cyan-glow" />
                <span>You're currently exploring in Guest Mode</span>
              </div>
              <p className="text-[11px] text-ink-muted">
                Sign up free to unlock full guidance, thread memory, and personalized Ascension tracking.
              </p>
            </div>
            {onOpenAuthModal && (
              <BenthicCTAButton
                variant="cyan"
                size="sm"
                onClick={onOpenAuthModal}
                className="shrink-0 w-full sm:w-auto !py-1 !px-3"
              >
                <span className="flex items-center justify-center gap-1.5 text-[11px] font-bold font-grotesk tracking-[0.08em] uppercase">
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
