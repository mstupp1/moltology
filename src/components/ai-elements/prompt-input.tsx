import { getOraclePromptLengthError } from '@/lib/ai/prompt-limits'
import React, { useState, useRef, useEffect, useLayoutEffect, useId } from 'react'
import { ArrowUp, Mic, Loader2, ChevronDown, Check, Square, ScrollText, X } from 'lucide-react'
import { OracleModel, ORACLE_MODELS, DEFAULT_ORACLE_PLACEHOLDER, canUseOracleChatModel } from '@/lib/ai/oracle-models'
import { OracleTierIcon } from '@/components/ai/OracleTierIcon'
import { OracleModelLogo } from '@/components/ai/OracleModelLogo'
import { useSpeechDictation, type DictationError } from '@/hooks/useSpeechDictation'
import { useOptionalToast } from '@/components/ui/ToastProvider'
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
  showModelNames?: boolean
}

/** Public chat choices; automatic title and preview models stay internal. */
export const OracleModelPicker: React.FC<OracleModelPickerProps> = ({
  selectedModel,
  onSelectModel,
  showModelNames = false,
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
          <OracleTierIcon tier={selectedModel.access === 'premium' ? 'max' : 'lite'} />
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
        className="w-[360px] max-w-[calc(100vw-24px)] p-0 overflow-y-auto overscroll-contain"
        style={{ maxHeight: 'min(720px, var(--radix-dropdown-menu-content-available-height))' }}
      >
        <div className="py-1">
          {ORACLE_MODELS.filter((model) => model.roles.includes('chat')).map((model) => {
            const hasAccess = accessTier !== 'guest' && (model.access !== 'premium' || accessTier === 'premium')
            const canSelect = canUseOracleChatModel(model, accessTier)
            const isSelected = model.id === selectedModel.id
            const note = !hasAccess ? (accessTier === 'guest' ? 'Sign in to use chat' : 'Requires Oracle MAX subscription') : accessTier === 'premium' && !model.noPromptTraining ? 'Free members only' : undefined

            return (
              <HudDropdownMenuItem
                key={model.id}
                disabled={!canSelect}
                role="menuitemradio"
                aria-label={model.label}
                aria-checked={isSelected}
                onSelect={() => onSelectModel(model.id)}
                className={`block rounded-none border-b border-line-subtle px-4 py-3 last:border-0 data-[disabled]:opacity-100 ${isSelected ? 'bg-surface-3' : ''}`}
              >
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2 text-sm font-semibold leading-snug"><OracleTierIcon tier={model.access === 'premium' ? 'max' : 'lite'} /><span className="break-words">{model.label}</span></span>
                    {isSelected && <Check aria-label="Selected" className="mt-0.5 h-4 w-4 shrink-0 text-cyan-glow" />}
                  </div>
                  {showModelNames && model.modelName && <p className="mt-1 flex items-center gap-1.5 text-xs leading-relaxed text-ink-muted"><OracleModelLogo provider={model.provider} className="h-3.5 w-3.5" /><span>{model.modelName}</span></p>}
                  {note && <p className="mt-1 text-xs leading-relaxed text-ink-muted">{note}</p>}
                </div>
              </HudDropdownMenuItem>
            )
          })}
        </div>
        {accessTier !== 'premium' && <a href="/max" className="block border-t border-line-subtle px-4 py-3 text-xs text-cyan-glow hover:underline">Explore Oracle MAX</a>}
      </HudDropdownMenuContent>
    </HudDropdownMenu>
  )
}

/** A skill the member can turn on from the chat box. */
export interface PromptSkillOption {
  id: string
  name: string
  summary: string
}

export const BROWSE_SKILLS_HREF = '/character/shop?tab=skills'

/** Skills whose name or id contains the text typed after "/". */
export function filterSkillOptions(skills: PromptSkillOption[], query: string): PromptSkillOption[] {
  const q = query.trim().toLowerCase().replace(/-/g, ' ')
  if (!q) return skills
  return skills.filter((s) => s.name.toLowerCase().includes(q) || s.id.replace(/-/g, ' ').includes(q))
}

/** "/" or "/focus" alone in the box opens the skill list; anything else is a message. */
export function readSlashQuery(text: string): string | null {
  const match = /^\/([a-z0-9 -]{0,40})$/i.exec(text)
  return match ? match[1] : null
}

/**
 * Skills button beside the model picker: every usable skill, plus a way to browse more. With a
 * skill on, the button becomes that skill's pill (with an X to turn it off), so the box never
 * gains a row.
 */
export const OracleSkillMenu: React.FC<{
  skills: PromptSkillOption[]
  activeSkill?: { id: string; name: string } | null
  onPick: (id: string) => void
  onClear?: () => void
  compactLabel?: boolean
}> = ({ skills, activeSkill = null, onPick, onClear, compactLabel = false }) => {
  const activeSkillId = activeSkill?.id
  const menu = (
    <HudDropdownMenu modal={false}>
      <HudDropdownMenuTrigger asChild>
        {activeSkill ? (
          <button
            type="button"
            className={`flex min-h-[30px] min-w-0 items-center gap-1 pl-2 ${onClear ? 'pr-1' : 'pr-2'} py-1 text-[11px] sm:text-xs font-semibold text-ink cursor-pointer ${FOCUS_RING} rounded-control`}
            title="Change skill (type /)"
            aria-label={`Skill: ${activeSkill.name}. Change skill`}
          >
            <ScrollText className="w-3.5 h-3.5 shrink-0 text-cyan-glow" aria-hidden="true" />
            <span className="truncate">{activeSkill.name}</span>
          </button>
        ) : (
          <button
            type="button"
            className={`flex min-h-8 items-center gap-1 text-[11px] sm:text-xs text-ink-body hover:text-ink bg-surface-1 border border-line hover:bg-surface-3 hover:border-line-strong px-2 py-1 rounded-control transition-colors cursor-pointer ${FOCUS_RING}`}
            title="Skills (type /)"
            aria-label="Skills"
          >
            <ScrollText className="w-3.5 h-3.5 text-cyan-glow" aria-hidden="true" />
            {compactLabel ? null : <span className="font-medium">Skills</span>}
          </button>
        )}
      </HudDropdownMenuTrigger>
      <HudDropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        collisionPadding={12}
        aria-label="Skills"
        aria-labelledby={undefined}
        className="w-[320px] max-w-[calc(100vw-24px)] p-0 overflow-y-auto overscroll-contain"
        style={{ maxHeight: 'min(480px, var(--radix-dropdown-menu-content-available-height))' }}
      >
        <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">Use a skill</p>
        <div className="pb-1">
          {skills.map((skill) => (
            <HudDropdownMenuItem
              key={skill.id}
              role="menuitemradio"
              aria-checked={skill.id === activeSkillId}
              onSelect={() => onPick(skill.id)}
              className={`block rounded-none px-4 py-2 ${skill.id === activeSkillId ? 'bg-surface-3' : ''}`}
            >
              <span className="flex items-center justify-between gap-2 text-sm font-semibold text-ink">
                {skill.name}
                {skill.id === activeSkillId && <Check aria-label="On" className="h-4 w-4 shrink-0 text-cyan-glow" />}
              </span>
              <span className="block text-xs leading-snug text-ink-muted">{skill.summary}</span>
            </HudDropdownMenuItem>
          ))}
        </div>
        <a href={BROWSE_SKILLS_HREF} className="block border-t border-line-subtle px-4 py-3 text-xs text-cyan-glow hover:underline">
          Browse all skills
        </a>
      </HudDropdownMenuContent>
    </HudDropdownMenu>
  )
  if (!activeSkill) return menu
  return (
    <span className="inline-flex min-w-0 max-w-[12rem] sm:max-w-[16rem] items-center rounded-control border border-line bg-surface-3 hover:border-line-strong transition-colors">
      {menu}
      {onClear && <SkillClearButton name={activeSkill.name} onClear={onClear} />}
    </span>
  )
}

function SkillClearButton({ name, onClear }: { name: string; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className={`mr-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-chip text-ink-muted hover:text-ink hover:bg-surface-2 ${FOCUS_RING}`}
      aria-label={`Turn off ${name}`}
      title="Turn off skill"
    >
      <X className="w-3 h-3" aria-hidden="true" />
    </button>
  )
}

/** Room left above and below an element inside whatever clips it (a scroll area, a panel, or the window). */
function readRoom(el: HTMLElement): { above: number; below: number } {
  const rect = el.getBoundingClientRect()
  let top = 0
  let bottom = window.innerHeight
  for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
    const style = window.getComputedStyle(node)
    if (/(auto|scroll|hidden|clip)/.test(`${style.overflowY}${style.overflow}`)) {
      const box = node.getBoundingClientRect()
      top = Math.max(top, box.top)
      bottom = Math.min(bottom, box.bottom)
      break
    }
  }
  return { above: rect.top - top, below: bottom - rect.bottom }
}

const SKILL_LIST_MAX = 240

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
  showModelNames?: boolean
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
  /** Skills the member can turn on. Typing "/" lists them. Omit for guests. */
  skills?: PromptSkillOption[]
  /** The skill turned on for this chat, shown as a chip in the box. */
  activeSkill?: { id: string; name: string } | null
  onPickSkill?: (skillId: string) => void
  onClearSkill?: () => void
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
  showModelNames = false,
  accessTier = 'free',
  value,
  onValueChange,
  variant = 'docked',
  autoFocus = false,
  compact = false,
  footnote,
  skills,
  activeSkill = null,
  onPickSkill,
  onClearSkill,
}) => {
  const lengthFeedbackId = useId()
  const [localText, setLocalText] = useState('')
  const isControlled = value !== undefined
  const text = isControlled ? value : localText
  const lengthError = getOraclePromptLengthError(text, accessTier === 'premium')
  const textRef = useRef(text)
  textRef.current = text
  const setText = (next: string) => {
    if (!isControlled) setLocalText(next)
    onValueChange?.(next)
  }

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const skillListId = useId()
  const canPickSkills = Boolean(skills?.length && onPickSkill)
  const slashQuery = canPickSkills ? readSlashQuery(text) : null
  const skillMatches = slashQuery !== null ? filterSkillOptions(skills ?? [], slashQuery) : []
  const [skillCursor, setSkillCursor] = useState(0)
  const [slashDismissed, setSlashDismissed] = useState(false)
  const showSkillList = slashQuery !== null && !slashDismissed
  const cardRef = useRef<HTMLDivElement>(null)
  // The list floats over the chat like a menu, above the box when there's room (docked at the
  // bottom), below it when the box sits at the top of the screen (new chat on phones).
  const [skillListPlace, setSkillListPlace] = useState<{ side: 'top' | 'bottom'; max: number }>({
    side: 'top',
    max: SKILL_LIST_MAX,
  })
  useLayoutEffect(() => {
    if (!showSkillList || !cardRef.current) return
    const { above, below } = readRoom(cardRef.current)
    const side = above >= Math.min(SKILL_LIST_MAX, 160) || above >= below ? 'top' : 'bottom'
    const room = (side === 'top' ? above : below) - 12
    setSkillListPlace({ side, max: Math.max(120, Math.min(SKILL_LIST_MAX, room)) })
  }, [showSkillList])
  useEffect(() => {
    setSkillCursor(0)
    if (slashQuery === null) setSlashDismissed(false)
  }, [slashQuery])
  const pickSkill = (id: string) => {
    onPickSkill?.(id)
    if (slashQuery !== null) setText('')
    textareaRef.current?.focus()
  }
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
    if (!text.trim() || disabled || sendDisabled || Boolean(lengthError) || isStreaming) return
    if (dictation.isListening) dictation.stop()
    onSubmit({ text: text.trim() })
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSkillList && skillMatches.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const step = e.key === 'ArrowDown' ? 1 : -1
        setSkillCursor((c) => (c + step + skillMatches.length) % skillMatches.length)
        return
      }
      if ((e.key === 'Enter' || e.key === 'Tab') && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault()
        pickSkill(skillMatches[Math.min(skillCursor, skillMatches.length - 1)].id)
        return
      }
    }
    if (showSkillList && e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      setSlashDismissed(true)
      return
    }
    // Backspace in an empty box turns the skill off.
    if (e.key === 'Backspace' && !text && activeSkill && onClearSkill) {
      onClearSkill()
      return
    }
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
          disabled={disabled || sendDisabled || Boolean(lengthError) || isStreaming || !text.trim()}
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
      showModelNames={showModelNames}
      compactLabel={oneRow || variant !== 'inline'}
    />
  ) : null

  const skillMenu = canPickSkills ? (
    <OracleSkillMenu
      skills={skills ?? []}
      activeSkill={activeSkill}
      onPick={pickSkill}
      onClear={
        onClearSkill
          ? () => {
              onClearSkill()
              textareaRef.current?.focus()
            }
          : undefined
      }
      compactLabel={oneRow}
    />
  ) : null

  const inlineActions = oneRow && !modelPicker && !skillMenu
  const skillList = showSkillList ? (
    <div
      id={skillListId}
      role="listbox"
      aria-label="Skills"
      className={`absolute inset-x-0 z-30 overflow-y-auto overscroll-contain rounded-card border border-line bg-surface-1 py-1 shadow-lg ${
        skillListPlace.side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
      }`}
      style={{ maxHeight: skillListPlace.max }}
    >
      {skillMatches.length === 0 ? (
        <p className="px-3 py-2 text-xs text-ink-muted">
          No skill matches. <a href={BROWSE_SKILLS_HREF} className="text-cyan-glow hover:underline">Browse skills</a>
        </p>
      ) : (
        skillMatches.map((skill, index) => (
          <button
            key={skill.id}
            id={`${skillListId}-${skill.id}`}
            type="button"
            role="option"
            aria-selected={index === skillCursor}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pickSkill(skill.id)}
            className={`block w-full px-3 py-1.5 text-left ${index === skillCursor ? 'bg-surface-3' : 'hover:bg-surface-2'}`}
          >
            <span className="block text-[13px] font-semibold text-ink">{skill.name}</span>
            <span className="block text-[11px] leading-snug text-ink-muted truncate">{skill.summary}</span>
          </button>
        ))
      )}
    </div>
  ) : null
  // The active skill normally lives in the toolbar as the Skills pill; this row is only for a
  // skill that is on while the member can't pick skills here.
  const skillChip =
    activeSkill && !skillMenu ? (
      <div className="flex px-1 pb-1">
        <span className="inline-flex max-w-full items-center gap-1 rounded-chip border border-line bg-surface-3 pl-2 pr-0.5 py-0.5 text-[12px] font-semibold text-ink">
          <ScrollText className="w-3 h-3 shrink-0 text-cyan-glow" aria-hidden="true" />
          <span className="truncate">{activeSkill.name}</span>
          {onClearSkill && <SkillClearButton name={activeSkill.name} onClear={onClearSkill} />}
        </span>
      </div>
    ) : null

  const card = (
    <div
      ref={cardRef}
      className={`relative pointer-events-auto bg-surface-2 border ${variant !== 'inline' ? 'rounded-panel shadow-sm' : 'rounded-card'} transition-colors focus-within:border-line ${
        oneRow ? 'p-1.5' : 'p-2 sm:p-2.5'
      } ${dictation.isListening ? 'border-line' : 'border-line-subtle'}`}
    >
      {skillList}
      {skillChip}
      <form onSubmit={handleSubmit} className={inlineActions ? 'flex items-end gap-1.5' : 'flex flex-col'}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={dictation.isListening ? 'Listening...' : placeholder}
          disabled={disabled}
          rows={1}
          aria-label="Message"
          aria-invalid={Boolean(lengthError)}
          aria-describedby={lengthError ? lengthFeedbackId : undefined}
          aria-controls={showSkillList ? skillListId : undefined}
          aria-activedescendant={
            showSkillList && skillMatches[skillCursor] ? `${skillListId}-${skillMatches[skillCursor].id}` : undefined
          }
          className={`${inlineActions ? 'flex-1 min-w-0' : 'w-full'} bg-transparent text-ink placeholder-ink-muted text-base sm:text-sm focus:outline-hidden resize-none select-text min-h-[40px] max-h-[200px] leading-relaxed font-sans px-1.5 py-[0.4rem]`}
        />

        {inlineActions ? (
          actionButtons
        ) : (
          <div className="flex items-center justify-between gap-2 pt-1.5 select-none">
            <div className="flex items-center gap-1.5 min-w-0">
              {modelPicker}
              {skillMenu}
            </div>
            {actionButtons}
          </div>
        )}
      </form>
      {lengthError && (
        <p id={lengthFeedbackId} aria-live="polite" className="mt-1 px-1.5 text-[11px] text-crimson-text">
          {lengthError}
        </p>
      )}
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
