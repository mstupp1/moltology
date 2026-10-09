import React, { useState, useRef, useEffect } from 'react'
import { ArrowRight, Mic, Plus, Loader2, ChevronDown, Check, FileText, Zap, Radio } from 'lucide-react'
import { OracleModel, ORACLE_MODELS, DEFAULT_ORACLE_PLACEHOLDER } from '@/lib/ai/oracle-models'

export interface PromptInputProps {
  onSubmit: (message: { text: string }) => void
  status?: 'ready' | 'submitted' | 'streaming' | 'error' | string
  placeholder?: string
  disabled?: boolean
  className?: string
  selectedModel?: OracleModel
  onSelectModel?: (modelId: string) => void
}

export const PromptInput: React.FC<PromptInputProps> = ({
  onSubmit,
  status = 'ready',
  placeholder = DEFAULT_ORACLE_PLACEHOLDER,
  disabled = false,
  className = '',
  selectedModel,
  onSelectModel,
}) => {
  const [text, setText] = useState('')
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [plusMenuOpen, setPlusMenuOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isStreaming = status === 'streaming'

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.max(36, Math.min(textareaRef.current.scrollHeight, 160))}px`
    }
  }, [text])

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!text.trim() || disabled || isStreaming) return
    onSubmit({ text: text.trim() })
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleAttachDirective = (directive: string) => {
    setText((prev) => (prev ? `${prev}\n\n[Directive: ${directive}]` : `[Directive: ${directive}] `))
    setPlusMenuOpen(false)
    textareaRef.current?.focus()
  }

  return (
    <div className={`p-2.5 sm:p-3 bg-surface-1/85 backdrop-blur-md border-t border-line-subtle select-none ${className}`}>
      <div className="bg-surface-2 border border-line rounded-control p-2 sm:p-2.5 transition-[border-color,box-shadow] focus-within:border-cyan-glow focus-within:shadow-field-focus">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isStreaming}
            rows={1}
            className="w-full bg-transparent text-ink placeholder-ink-muted text-xs sm:text-sm focus:outline-none resize-none min-h-[36px] max-h-[160px] leading-relaxed font-sans px-1"
          />

          <div className="flex items-center justify-between pt-1 mt-0.5 select-none">
            {/* Left Tools */}
            <div className="flex items-center gap-1.5">
              {/* Plus Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setPlusMenuOpen((v) => !v)
                    setModelMenuOpen(false)
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
                    <div className="absolute left-0 bottom-full mb-2 z-50 bg-surface-2 border border-line shadow-menu rounded-card py-1 min-w-48 text-xs">
                      <button
                        type="button"
                        onClick={() => handleAttachDirective('Consult Scripture & Codex')}
                        className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-xs text-ink-body hover:bg-surface-3 hover:text-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow"
                      >
                        <FileText className="w-3.5 h-3.5 text-cyan-glow" />
                        <span>Attach Codex Scripture</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAttachDirective('Ascension & Shell Hardening Analysis')}
                        className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-xs text-ink-body hover:bg-surface-3 hover:text-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ascension Guide</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAttachDirective('Abyssal Deep Telemetry')}
                        className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-xs text-ink-body hover:bg-surface-3 hover:text-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow"
                      >
                        <Radio className="w-3.5 h-3.5 text-purple-400" />
                        <span>Biometric Telemetry</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Model Selector if provided and multiple models exist */}
              {selectedModel && onSelectModel && ORACLE_MODELS.length > 1 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setModelMenuOpen((v) => !v)
                      setPlusMenuOpen(false)
                    }}
                    className="flex items-center gap-1.5 text-[11px] text-ink-body hover:text-ink bg-surface-1 border border-line hover:bg-surface-3 hover:border-line-strong px-2 py-0.5 rounded-control transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                    title="Select Cognition Model"
                  >
                    <span className="truncate max-w-[130px] sm:max-w-none font-medium">{selectedModel.shortLabel || selectedModel.label}</span>
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
                            className={`w-full text-left px-3 py-1.5 grid grid-cols-[1fr_56px_52px_48px_16px] items-center gap-2 text-xs transition-colors cursor-pointer group ${
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

            {/* Right Tools */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsRecording((v) => !v)}
                className={`p-1.5 rounded-control transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                  isRecording
                    ? 'text-crimson-text bg-crimson-soft animate-pulse'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-3'
                }`}
                title={isRecording ? 'Listening... Click to stop' : 'Voice Dictation'}
                aria-label="Voice Dictation"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>

              <button
                type="submit"
                disabled={disabled || isStreaming || !text.trim()}
                className="w-7 h-7 rounded-full bg-cyan-glow hover:bg-cyan-hover active:bg-cyan-dim disabled:opacity-40 disabled:hover:bg-cyan-glow text-abyss flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                title="Transmit"
                aria-label="Transmit"
              >
                {isStreaming ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

