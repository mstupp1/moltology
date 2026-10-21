import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { ArrowUp, Mic, Loader2, ChevronDown, Check, Square } from 'lucide-react'
import { OracleModel, ORACLE_MODELS, DEFAULT_ORACLE_PLACEHOLDER } from '@/lib/ai/oracle-models'
import { useSpeechDictation, type DictationError } from '@/hooks/useSpeechDictation'
import { useOptionalToast } from '@/components/ui/ToastProvider'

const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

const DICTATION_ERROR_COPY: Record<DictationError, string> = {
  'not-allowed': 'Microphone access is blocked. Allow it in your browser settings to dictate.',
  'no-speech': "Didn't catch anything. Try again a little closer to the mic.",
  other: 'Dictation stopped unexpectedly. Please try again.',
}

export interface OracleModelPickerProps {
  selectedModel: OracleModel
  onSelectModel: (modelId: string) => void
  /** Show the short label on the trigger (docked composer). */
  compactLabel?: boolean
}

/** Admin-only model picker with pricing and latency columns. */
export const OracleModelPicker: React.FC<OracleModelPickerProps> = ({
  selectedModel,
  onSelectModel,
  compactLabel = false,
}) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 text-[11px] sm:text-xs text-ink-body hover:text-ink bg-surface-1 border border-line hover:bg-surface-3 hover:border-line-strong px-2 py-1 rounded-control transition-colors cursor-pointer ${FOCUS_RING}`}
        title="Select Cognition Model"
        aria-label="Select Cognition Model"
        aria-expanded={open}
      >
        <span className="truncate max-w-[140px] sm:max-w-none font-medium">
          {compactLabel ? selectedModel.shortLabel || selectedModel.label : selectedModel.label}
        </span>
        <ChevronDown className="w-3 h-3 text-ink-muted shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
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
                  setOpen(false)
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
  )
}

export interface PromptInputProps {
  onSubmit: (message: { text: string }) => void
  /** Shown as a Stop button while a reply streams. */
  onStop?: () => void
  status?: 'ready' | 'submitted' | 'streaming' | 'error' | string
  placeholder?: string
  disabled?: boolean
  className?: string
  selectedModel?: OracleModel
  onSelectModel?: (modelId: string) => void
  /** Controlled draft, so the owner can keep it across views or restore it after a failed send. */
  value?: string
  onValueChange?: (text: string) => void
  /** `docked` sits on the bottom edge of a panel; `inline` is the bare card used on the new chat screen. */
  variant?: 'docked' | 'inline'
  /** Focus the box on mount (skipped on touch screens so the keyboard doesn't jump up). */
  autoFocus?: boolean
  /** One row: the text grows on the left with mic and send on the right (phones). */
  compact?: boolean
  /** Small muted line under the box. */
  footnote?: string
}

export const PromptInput: React.FC<PromptInputProps> = ({
  onSubmit,
  onStop,
  status = 'ready',
  placeholder = DEFAULT_ORACLE_PLACEHOLDER,
  disabled = false,
  className = '',
  selectedModel,
  onSelectModel,
  value,
  onValueChange,
  variant = 'docked',
  autoFocus = false,
  compact = false,
  footnote,
}) => {
  const [localText, setLocalText] = useState('')
  const isControlled = value !== undefined
  const text = isControlled ? value : localText
  const textRef = useRef(text)
  textRef.current = text
  const setText = (next: string) => {
    if (!isControlled) setLocalText(next)
    onValueChange?.(next)
  }

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const toastCtx = useOptionalToast()
  const isStreaming = status === 'streaming' || status === 'submitted'

  const dictation = useSpeechDictation({
    getBaseText: () => textRef.current,
    onText: (next) => setText(next),
    onError: (error) => {
      toastCtx?.toast.error(DICTATION_ERROR_COPY[error], { id: `oracle-dictation-${error}` })
    },
  })

  useEffect(() => {
    if (!autoFocus) return
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    if (!window.matchMedia('(pointer: coarse)').matches) {
      textareaRef.current?.focus()
    }
  }, [autoFocus])

  // Grow with the text up to a cap, then scroll inside the box.
  useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(40, Math.min(el.scrollHeight, 200))}px`
  }, [text])

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!text.trim() || disabled || isStreaming) return
    if (dictation.isListening) dictation.stop()
    onSubmit({ text: text.trim() })
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSubmit()
      return
    }
    // Escape stops a streaming reply before it would close the popout.
    if (e.key === 'Escape' && isStreaming && onStop) {
      e.preventDefault()
      e.stopPropagation()
      onStop()
    }
  }

  const showStop = isStreaming && Boolean(onStop)
  const hasModelPicker = Boolean(selectedModel && onSelectModel)
  const oneRow = compact && !hasModelPicker

  const actionButtons = (
    <div className="flex items-center gap-1.5 shrink-0">
      {dictation.isSupported && (
        <button
          type="button"
          onClick={dictation.toggle}
          disabled={disabled || isStreaming}
          className={`w-8 h-8 inline-flex items-center justify-center rounded-control transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${FOCUS_RING} ${
            dictation.isListening
              ? 'text-crimson-text bg-crimson-soft'
              : 'text-ink-muted hover:text-ink hover:bg-surface-3'
          }`}
          title={dictation.isListening ? 'Stop dictation' : 'Dictate'}
          aria-label={dictation.isListening ? 'Stop dictation' : 'Start dictation'}
          aria-pressed={dictation.isListening}
        >
          {dictation.isListening ? (
            <span className="relative flex w-3.5 h-3.5 items-center justify-center" aria-hidden="true">
              <span className="absolute inset-0 rounded-full bg-crimson-text/40 animate-ping motion-reduce:animate-none" />
              <Mic className="relative w-3.5 h-3.5" />
            </span>
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>
      )}

      {showStop ? (
        <button
          type="button"
          onClick={onStop}
          className={`w-8 h-8 rounded-full bg-ink text-abyss hover:bg-ink-body flex items-center justify-center transition-colors cursor-pointer ${FOCUS_RING}`}
          title="Stop reply"
          aria-label="Stop reply"
        >
          <Square className="w-3 h-3 fill-current" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={disabled || isStreaming || !text.trim()}
          className={`w-8 h-8 rounded-full bg-cyan-glow hover:bg-cyan-hover active:bg-cyan-dim disabled:opacity-40 disabled:hover:bg-cyan-glow text-abyss flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed ${FOCUS_RING}`}
          title="Send"
          aria-label="Send message"
        >
          {isStreaming ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
          )}
        </button>
      )}
    </div>
  )

  const card = (
    <div
      className={`bg-surface-2 border rounded-card transition-colors focus-within:border-line ${
        oneRow ? 'p-1.5' : 'p-2 sm:p-2.5'
      } ${dictation.isListening ? 'border-line' : 'border-line-subtle'}`}
    >
      <form onSubmit={handleSubmit} className={oneRow ? 'flex items-end gap-1.5' : 'flex flex-col'}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={dictation.isListening ? 'Listening...' : placeholder}
          disabled={disabled}
          rows={1}
          aria-label="Message"
          className={`${oneRow ? 'flex-1 min-w-0' : 'w-full'} bg-transparent text-ink placeholder-ink-muted text-base sm:text-sm focus:outline-none resize-none min-h-[40px] max-h-[200px] leading-relaxed font-sans px-1.5 py-[0.4rem]`}
        />

        {oneRow ? (
          actionButtons
        ) : (
          <div className="flex items-center justify-between gap-2 pt-1.5 select-none">
            <div className="flex items-center gap-1.5 min-w-0">
            {selectedModel && onSelectModel && (
              <OracleModelPicker
                selectedModel={selectedModel}
                onSelectModel={onSelectModel}
                compactLabel={variant === 'docked'}
              />
            )}
            </div>
            {actionButtons}
          </div>
        )}
      </form>
    </div>
  )

  const withFootnote = (node: React.ReactNode) =>
    footnote ? (
      <>
        {node}
        <p className="mt-1.5 text-center text-[11px] text-ink-muted">{footnote}</p>
      </>
    ) : (
      node
    )

  if (variant === 'inline') {
    return <div className={className}>{withFootnote(card)}</div>
  }

  return (
    <div
      className={`px-2.5 pt-2 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:px-3 sm:pb-3 bg-surface-1/85 backdrop-blur-md border-t border-line-subtle ${className}`}
    >
      <div className="mx-auto w-full max-w-3xl">{withFootnote(card)}</div>
    </div>
  )
}
