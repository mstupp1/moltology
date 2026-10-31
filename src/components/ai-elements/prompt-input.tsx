import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { ArrowUp, Mic, Loader2, ChevronDown, Check, LockKeyhole, Square } from 'lucide-react'
import { OracleModel, ORACLE_MODELS, DEFAULT_ORACLE_PLACEHOLDER } from '@/lib/ai/oracle-models'
import { HudDropdownMenu, HudDropdownMenuTrigger, HudDropdownMenuContent, HudDropdownMenuItem, HudDropdownMenuSeparator } from '@/components/ui/HudDropdownMenu'
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
  hasPremiumAccess?: boolean
}

/** Branded model choices shared by every Oracle composer. */
export const OracleModelPicker: React.FC<OracleModelPickerProps> = ({
  selectedModel,
  onSelectModel,
  compactLabel = false,
  hasPremiumAccess = false,
}) => (
  <HudDropdownMenu modal={false}>
    <HudDropdownMenuTrigger asChild>
      <button
        type="button"
        className={`flex items-center gap-1 text-[11px] sm:text-xs text-ink-body hover:text-ink px-2 py-1 rounded-control transition-colors cursor-pointer ${FOCUS_RING}`}
        title="Select model"
        aria-label="Select model"
      >
        <span className="truncate max-w-[140px] font-medium">
          {compactLabel ? selectedModel.shortLabel : selectedModel.label}
        </span>
        <ChevronDown className="w-3 h-3 text-ink-muted shrink-0" />
      </button>
    </HudDropdownMenuTrigger>
    <HudDropdownMenuContent side="top" align="start" sideOffset={10} className="w-72 max-w-[calc(100vw-2rem)] p-1.5">
      {ORACLE_MODELS.map((model) => {
        const locked = Boolean(model.premium && !hasPremiumAccess)
        return (
          <HudDropdownMenuItem
            key={model.id}
            disabled={locked}
            role="menuitemradio"
            aria-checked={model.id === selectedModel.id}
            onSelect={() => onSelectModel(model.id)}
            className="gap-3 py-3 data-[disabled]:opacity-60"
          >
            <span className="flex-1">
              <span className="block font-semibold">{model.label}</span>
              <span className="mt-1 block text-[11px] font-normal text-ink-muted">{model.description}</span>
              {locked && <span className="mt-1 block text-[11px] text-ink-muted">Included with Oracle MAX</span>}
            </span>
            {locked ? <LockKeyhole className="h-3.5 w-3.5 text-ink-muted" aria-label="Locked" /> : model.id === selectedModel.id ? <Check className="h-3.5 w-3.5 text-cyan-glow" aria-label="Selected" /> : null}
          </HudDropdownMenuItem>
        )
      })}
      {!hasPremiumAccess && <>
        <HudDropdownMenuSeparator />
        <HudDropdownMenuItem asChild>
          <a href="/premium" className="text-xs text-ink-muted">Explore Oracle MAX</a>
        </HudDropdownMenuItem>
      </>}
    </HudDropdownMenuContent>
  </HudDropdownMenu>
)

export interface PromptInputProps {
  onSubmit: (message: { text: string }) => void
  /** Shown as a Stop button while a reply streams. */
  onStop?: () => void
  status?: 'ready' | 'submitted' | 'streaming' | 'error' | string
  placeholder?: string
  disabled?: boolean
  /** Block sending while keeping the draft editable. */
  sendDisabled?: boolean
  className?: string
  selectedModel?: OracleModel
  onSelectModel?: (modelId: string) => void
  hasPremiumAccess?: boolean
  /** Controlled draft, so the owner can keep it across views or restore it after a failed send. */
  value?: string
  onValueChange?: (text: string) => void
  /** `docked` sits on the bottom edge of a panel; `inline` is the bare card used on the new chat screen; `floating` keeps the docked card without a backdrop. */
  variant?: 'docked' | 'inline' | 'floating'
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
  sendDisabled = false,
  className = '',
  selectedModel,
  onSelectModel,
  hasPremiumAccess = false,
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
    if (!text.trim() || disabled || sendDisabled || isStreaming) return
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
          disabled={disabled || sendDisabled || isStreaming || !text.trim()}
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
      className={`pointer-events-auto bg-surface-2 border ${variant !== 'inline' ? 'rounded-panel shadow-sm' : 'rounded-card'} transition-colors focus-within:border-line ${
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
          className={`${oneRow ? 'flex-1 min-w-0' : 'w-full'} bg-transparent text-ink placeholder-ink-muted text-base sm:text-sm focus:outline-hidden resize-none select-text min-h-[40px] max-h-[200px] leading-relaxed font-sans px-1.5 py-[0.4rem]`}
        />

        {oneRow ? (
          actionButtons
        ) : (
          <div className="flex items-center justify-between gap-2 pt-1.5 select-none">
            <div className="flex items-center gap-1.5 min-w-0">
            {selectedModel && onSelectModel && (
              <OracleModelPicker
                selectedModel={selectedModel}
                hasPremiumAccess={hasPremiumAccess}
                onSelectModel={onSelectModel}
                compactLabel={variant !== 'inline'}
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

  if (variant === 'inline' || variant === 'floating') {
    return <div className={className}>{withFootnote(card)}</div>
  }

  return (
    <div
      className={`px-2.5 pt-14 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:px-3 sm:pb-3 bg-linear-to-b from-transparent via-surface-1/95 via-12 to-surface-1 ${className}`}
    >
      <div className="mx-auto w-full max-w-3xl">{withFootnote(card)}</div>
    </div>
  )
}
