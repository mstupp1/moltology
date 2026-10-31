import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { ArrowUp, Mic, Loader2, ChevronDown, Check, Square } from 'lucide-react'
import { OracleModel, ORACLE_MODELS, DEFAULT_ORACLE_PLACEHOLDER, canUseOracleChatModel } from '@/lib/ai/oracle-models'
import { useSpeechDictation, type DictationError } from '@/hooks/useSpeechDictation'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { HudBadge } from '@/components/ui/HudBadge'
import {
  HudDropdownMenu,
  HudDropdownMenuTrigger,
  HudDropdownMenuContent,
  HudDropdownMenuItem,
} from '@/components/ui/HudDropdownMenu'

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
  accessTier?: 'guest' | 'free' | 'premium'
  /** Show the short label on the trigger (docked composer). */
  compactLabel?: boolean
}

/** Admin model directory: chat options and the automatic title models. */
export const OracleModelPicker: React.FC<OracleModelPickerProps> = ({
  selectedModel,
  onSelectModel,
  accessTier = 'free',
  compactLabel = false,
}) => {
  const [open, setOpen] = useState(false)

  return (
    <HudDropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <HudDropdownMenuTrigger asChild>
        <button
          type="button"
          className={`flex min-h-8 items-center gap-1 text-[11px] sm:text-xs text-ink-body hover:text-ink bg-surface-1 border border-line hover:bg-surface-3 hover:border-line-strong px-2 py-1 rounded-control transition-colors cursor-pointer ${FOCUS_RING}`}
          title="Select model"
          aria-label="Select model"
        >
          <span className="truncate max-w-[140px] sm:max-w-none font-medium">
            {compactLabel ? selectedModel.shortLabel || selectedModel.label : selectedModel.label}
          </span>
          <ChevronDown className="w-3 h-3 text-ink-muted shrink-0" />
        </button>
      </HudDropdownMenuTrigger>
      <HudDropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        collisionPadding={12}
        aria-label="Oracle models"
        aria-labelledby={undefined}
        className="w-[620px] max-w-[calc(100vw-24px)] p-0 overflow-y-auto overscroll-contain"
        style={{ maxHeight: 'min(720px, var(--radix-dropdown-menu-content-available-height))' }}
      >
        <div className="border-b border-line-subtle px-4 py-3">
          <p className="font-semibold text-sm text-ink">Models</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">Select a chat model. Chat titles are generated automatically.</p>
        </div>
        <div className="py-1">
          {ORACLE_MODELS.map((model) => {
            const isChat = model.roles.includes('chat')
            const isPreview = model.roles.includes('preview')
            const hasAccess = accessTier !== 'guest' && (model.access !== 'premium' || accessTier === 'premium')
            const canSelect = canUseOracleChatModel(model, accessTier)
            const isSelected = canSelect && model.id === selectedModel.id
            const purpose = isPreview ? 'Preview' : model.roles.includes('titles') ? (isChat ? 'Chat + Titles' : 'Titles') : 'Chat'
            const access = model.access === 'guest' ? 'Guest' : model.access === 'premium' ? 'Oracle MAX' : 'Free'
            const note = !isChat ? (isPreview ? 'Automatic preview replies' : 'Automatic titles only') : !hasAccess ? (accessTier === 'guest' ? 'Sign in to use chat' : 'Requires Oracle MAX') : accessTier === 'premium' && !model.noPromptTraining ? 'Free members only; Oracle MAX uses providers that do not train on your data.' : undefined

            return (
              <HudDropdownMenuItem
                key={model.id}
                disabled={!canSelect}
                role="menuitemradio"
                aria-checked={isSelected}
                onSelect={() => onSelectModel(model.id)}
                className={`grid grid-cols-1 gap-2 rounded-none border-b border-line-subtle px-4 py-3 last:border-0 sm:grid-cols-[minmax(0,1fr)_190px] sm:gap-4 data-[disabled]:opacity-100 ${isSelected ? 'bg-surface-3' : ''}`}
              >
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 break-words text-sm font-semibold leading-snug">{model.label}</span>
                    {isSelected && <Check aria-label="Selected" className="mt-0.5 h-4 w-4 shrink-0 text-cyan-glow" />}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <HudBadge variant={model.access === 'premium' ? 'warning' : model.access === 'guest' ? 'neutral' : 'cyan'}>{access}</HudBadge>
                    <HudBadge variant="neutral">{purpose}</HudBadge>
                  </div>
                  {model.description && <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{model.description}</p>}
                  {note && <p className="mt-1 text-xs leading-relaxed text-ink-muted">{note}</p>}
                </div>
                <dl className="grid grid-cols-3 gap-3 text-[11px] sm:self-center">
                  <div>
                    <dt className="text-ink-muted">In / 1M</dt>
                    <dd className="mt-1 font-mono text-ink-body">{model.pricing?.input ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Out / 1M</dt>
                    <dd className="mt-1 font-mono text-ink-body">{model.pricing?.output ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">First token</dt>
                    <dd className="mt-1 font-mono text-ink-body">{model.latency ?? '—'}</dd>
                  </div>
                </dl>
              </HudDropdownMenuItem>
            )
          })}
        </div>
        {accessTier !== 'premium' && <a href="/premium" className="block border-t border-line-subtle px-4 py-3 text-xs text-cyan-glow hover:underline">Explore Oracle MAX</a>}
        <p className="border-t border-line-subtle px-4 py-3 text-[11px] leading-relaxed text-ink-muted">Prices per million tokens. Listed prices and latency may change.</p>
      </HudDropdownMenuContent>
    </HudDropdownMenu>
  )
}

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
  accessTier?: 'guest' | 'free' | 'premium'
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
  accessTier = 'free',
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
  const oneRow = compact

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

  const modelPicker = selectedModel && onSelectModel ? (
    <OracleModelPicker
      selectedModel={selectedModel}
      onSelectModel={onSelectModel}
      accessTier={accessTier}
      compactLabel={oneRow || variant !== 'inline'}
    />
  ) : null

  const card = (
    <div
      className={`pointer-events-auto bg-surface-2 border ${variant !== 'inline' ? 'rounded-panel shadow-sm' : 'rounded-card'} transition-colors focus-within:border-line ${
        oneRow ? 'p-1.5' : 'p-2 sm:p-2.5'
      } ${dictation.isListening ? 'border-line' : 'border-line-subtle'}`}
    >
      {oneRow && modelPicker && (
        <div className="flex min-w-0 items-center px-1.5 pb-1.5">{modelPicker}</div>
      )}
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
              {modelPicker}
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
