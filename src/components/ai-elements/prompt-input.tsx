import React, { useState, useRef, useEffect } from 'react'
import { ArrowRight, Mic, Plus, Loader2, ChevronDown, Check, FileText, Zap, Radio } from 'lucide-react'
import { OracleModel, ORACLE_MODELS } from '@/lib/ai/oracle-models'

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
  placeholder = 'Ask the Oracle...',
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
    <div className={`p-2.5 sm:p-3 bg-[#070c0e]/85 backdrop-blur-md border-t border-cyan-900/40 select-none ${className}`}>
      <div className="bg-[#202231]/90 border border-[#32364a]/60 rounded-2xl p-2 sm:p-2.5 shadow-xl transition-all">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isStreaming}
            rows={1}
            className="w-full bg-transparent text-gray-100 placeholder-gray-400 text-xs sm:text-sm focus:outline-none resize-none min-h-[36px] max-h-[160px] leading-relaxed font-sans px-1"
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
                  className="p-1 text-[#8f94a8] hover:text-[#d1d5db] hover:bg-[#2e3144]/60 rounded-lg transition-colors cursor-pointer"
                  title="Add Context / Attachment"
                  aria-label="Add Context"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                {plusMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setPlusMenuOpen(false)} />
                    <div className="absolute left-0 bottom-full mb-2 z-50 bg-[#1e202d] border border-[#32364a] shadow-2xl rounded-xl py-1 min-w-48 text-xs">
                      <button
                        type="button"
                        onClick={() => handleAttachDirective('Consult Scripture & Codex')}
                        className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-xs text-gray-300 hover:bg-[#282a3d] hover:text-white transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Attach Codex Scripture</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAttachDirective('Ascension & Shell Hardening Analysis')}
                        className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-xs text-gray-300 hover:bg-[#282a3d] hover:text-white transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ascension Guide</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAttachDirective('Abyssal Deep Telemetry')}
                        className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-xs text-gray-300 hover:bg-[#282a3d] hover:text-white transition-colors"
                      >
                        <Radio className="w-3.5 h-3.5 text-purple-400" />
                        <span>Biometric Telemetry</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Model Selector if provided */}
              {selectedModel && onSelectModel && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setModelMenuOpen((v) => !v)
                      setPlusMenuOpen(false)
                    }}
                    className="flex items-center gap-1.5 text-[11px] text-[#c3c7d5] hover:text-white bg-[#282a3a]/70 hover:bg-[#32354a]/80 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                    title="Select Cognition Model"
                  >
                    <span className="truncate max-w-[130px] sm:max-w-none font-medium">{selectedModel.shortLabel || selectedModel.label}</span>
                    <ChevronDown className="w-3 h-3 text-[#8f94a8] shrink-0" />
                  </button>

                  {modelMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setModelMenuOpen(false)} />
                      <div className="absolute left-0 bottom-full mb-2 z-50 bg-[#1e202d] border border-[#32364a] shadow-2xl rounded-xl py-1 min-w-52 text-xs">
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
                            className={`w-full text-left px-3 py-1.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
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
              )}
            </div>

            {/* Right Tools */}
            <div className="flex items-center gap-1.5">
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
                <Mic className="w-3.5 h-3.5" />
              </button>

              <button
                type="submit"
                disabled={disabled || isStreaming || !text.trim()}
                className="w-7 h-7 rounded-full bg-[#a28cd6] hover:bg-[#b5a1e6] active:bg-[#927bc7] disabled:opacity-40 disabled:hover:bg-[#a28cd6] text-white flex items-center justify-center shadow-md shadow-black/30 transition-all cursor-pointer disabled:cursor-not-allowed"
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

