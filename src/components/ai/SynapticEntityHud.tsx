import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  History,
  Shield,
  Sparkles,
  UserPlus,
} from 'lucide-react'
import {
  MessageContent,
  MessageCopyButton,
  MessageResponse,
  MessageRetryButton,
  MessageThinkingDots,
  withStreamingCursor,
} from '../ai-elements/message'
import { DEFAULT_PROMPT_SHORTCUTS, type PromptShortcut } from './NewChatScreen'
import { SynapticEntityCanvas } from './SynapticEntityCanvas'
import type {
  EntityContentMode,
  EntityLifecycleState,
  OracleEntityBridge,
} from '@/lib/ai/oracle-entity-bridge'
import { BenthicCTAButton } from '../hud/BenthicCTAButton'

export interface EntityHudMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  isGuest?: boolean
  failedError?: string
  stopped?: boolean
}

export interface SynapticEntityHudProps {
  bridge: OracleEntityBridge
  messages: EntityHudMessage[]
  isSending: boolean
  isGuest: boolean
  isPhone: boolean
  isCompact?: boolean
  shortcuts?: PromptShortcut[]
  onSubmitShortcut: (data: { text: string }) => void
  onRetryFailed: (failedId: string) => void
  onEditFailed: (failedId: string) => void
  onOpenAuthModal: () => void
  composer: React.ReactNode
}

const STATUS_LABELS: Record<EntityLifecycleState, string> = {
  idle: 'SYNAPTIC CORE · IDLE',
  typing: 'SYNAPTIC CORE · RECEIVING INPUT',
  thinking: 'SYNAPTIC CORE · CONSECRATING THOUGHT',
  streaming: 'SYNAPTIC CORE · TRANSMITTING',
  error: 'SYNAPTIC CORE · SIGNAL INTERRUPTED',
}

const CONTENT_MODE_BADGES: Record<EntityContentMode, string> = {
  prose: 'PROSE STREAM',
  code: 'CODE MATRIX',
  directive: 'PROTOCOL DIRECTIVE',
}

export const SynapticEntityHud: React.FC<SynapticEntityHudProps> = ({
  bridge,
  messages,
  isSending,
  isGuest,
  isPhone,
  isCompact = false,
  shortcuts = DEFAULT_PROMPT_SHORTCUTS,
  onSubmitShortcut,
  onRetryFailed,
  onEditFailed,
  onOpenAuthModal,
  composer,
}) => {
  const [hudStatus, setHudStatus] = useState<{
    lifecycle: EntityLifecycleState
    contentMode: EntityContentMode
  }>(() => {
    const snap = bridge.getSnapshot()
    return { lifecycle: snap.lifecycle, contentMode: snap.contentMode }
  })
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isCaptionMinimized, setIsCaptionMinimized] = useState(false)
  const liveScrollRef = useRef<HTMLDivElement>(null)
  const stickLiveBottomRef = useRef(true)

  // Poll bridge snapshot at a low cadence (150ms) only when lifecycle/contentMode changes,
  // avoiding high-frequency React re-renders during 60fps token streaming.
  useEffect(() => {
    const syncStatus = () => {
      const snap = bridge.getSnapshot()
      setHudStatus((prev) =>
        prev.lifecycle === snap.lifecycle && prev.contentMode === snap.contentMode
          ? prev
          : { lifecycle: snap.lifecycle, contentMode: snap.contentMode }
      )
    }
    syncStatus()
    const timer = window.setInterval(syncStatus, 150)
    return () => window.clearInterval(timer)
  }, [bridge, isSending, messages.length])

  // Identify latest user message, latest assistant reply, and prior history turns
  const lastUserIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'user') return i
    }
    return -1
  })()

  const latestUserMsg = lastUserIndex >= 0 ? messages[lastUserIndex] : null
  const latestAssistantMsg =
    lastUserIndex >= 0
      ? messages.slice(lastUserIndex + 1).find((m) => m.role === 'assistant') ?? null
      : [...messages].reverse().find((m) => m.role === 'assistant') ?? null

  const priorMessages = lastUserIndex > 0 ? messages.slice(0, lastUserIndex) : []
  const hasConversation = messages.length > 0

  // Keep live streaming response scrolled to bottom unless user scrolled up inside the card
  useLayoutEffect(() => {
    const el = liveScrollRef.current
    if (!el || !stickLiveBottomRef.current) return
    el.scrollTop = el.scrollHeight
  }, [latestAssistantMsg?.content, isSending, isCaptionMinimized])

  const handleLiveScroll = () => {
    const el = liveScrollRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 48
    stickLiveBottomRef.current = nearBottom
  }

  // Expand caption automatically when a new message starts sending
  useEffect(() => {
    if (isSending) {
      setIsCaptionMinimized(false)
      stickLiveBottomRef.current = true
    }
  }, [isSending])

  const statusDotClass =
    hudStatus.lifecycle === 'error'
      ? 'bg-crimson-aggro shadow-hud-red'
      : hudStatus.lifecycle === 'thinking'
        ? 'bg-crimson-glow animate-pulse shadow-hud-red'
        : hudStatus.lifecycle === 'streaming'
          ? 'bg-cyan-glow animate-ping'
          : hudStatus.lifecycle === 'typing'
            ? 'bg-cyan-bright animate-pulse shadow-hud-cyan'
            : 'bg-cyan-glow/70'

  return (
    <div
      data-testid="synaptic-entity-hud"
      className="flex-1 min-h-0 relative flex flex-col justify-between overflow-hidden bg-abyss select-none"
    >
      {/* 3D Procedural Synaptic Brain Backdrop */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <SynapticEntityCanvas
          bridge={bridge}
          isCompact={isCompact || isPhone}
          className="w-full h-full"
        />
        {/* Subtle top/bottom vignette for HUD legibility */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-abyss/80 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-abyss via-abyss/60 to-transparent"
        />
      </div>

      {/* Top Floating Telemetry Bar */}
      <div className="relative z-10 flex items-center justify-between gap-2 px-3 pt-2.5 pb-1 pointer-events-none">
        <div
          data-testid="entity-status-pill"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-surface-1/75 backdrop-blur-md border border-line-subtle px-3 py-1 shadow-menu"
        >
          <span className="relative flex h-2 w-2 items-center justify-center">
            <span className={`h-2 w-2 rounded-full ${statusDotClass}`} />
          </span>
          <span className="font-mono text-[11px] font-semibold tracking-wider text-ink-body uppercase">
            {STATUS_LABELS[hudStatus.lifecycle]}
          </span>
          {hudStatus.lifecycle === 'streaming' && (
            <span className="hidden sm:inline-block rounded-chip bg-cyan-soft px-1.5 py-0.5 font-mono text-[11px] font-semibold text-cyan-glow">
              {CONTENT_MODE_BADGES[hudStatus.contentMode]}
            </span>
          )}
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5">
          {priorMessages.length > 0 && (
            <button
              type="button"
              onClick={() => setIsHistoryOpen((prev) => !prev)}
              aria-expanded={isHistoryOpen}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-1/75 backdrop-blur-md border border-line-subtle hover:border-line hover:bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-ink-body hover:text-ink transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <History className="w-3.5 h-3.5 text-cyan-glow" />
              <span>Context ({priorMessages.length})</span>
              {isHistoryOpen ? (
                <ChevronUp className="w-3 h-3 text-ink-muted" />
              ) : (
                <ChevronDown className="w-3 h-3 text-ink-muted" />
              )}
            </button>
          )}

          {hasConversation && (
            <button
              type="button"
              onClick={() => setIsCaptionMinimized((prev) => !prev)}
              aria-label={isCaptionMinimized ? 'Show response HUD' : 'Minimize response HUD'}
              title={isCaptionMinimized ? 'Show response HUD' : 'Minimize response HUD'}
              className="inline-flex items-center gap-1 rounded-full bg-surface-1/75 backdrop-blur-md border border-line-subtle hover:border-line hover:bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-ink-muted hover:text-ink transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              {isCaptionMinimized ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-cyan-glow" />
                  <span className="hidden sm:inline">Show HUD</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Focus Core</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Prior Context Transcript Drawer */}
      {isHistoryOpen && priorMessages.length > 0 && (
        <div
          data-testid="entity-context-drawer"
          className="relative z-20 mx-3 mt-1 max-h-56 overflow-y-auto rounded-card bg-surface-1/90 backdrop-blur-md border border-line shadow-menu p-3 space-y-2.5 select-text"
        >
          <div className="flex items-center justify-between border-b border-line-subtle pb-1.5">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Prior Neural Context ({priorMessages.length} {priorMessages.length === 1 ? 'turn' : 'turns'})
            </span>
            <button
              type="button"
              onClick={() => setIsHistoryOpen(false)}
              className="text-[11px] text-ink-muted hover:text-ink rounded-control px-1.5 py-0.5 cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="space-y-2.5">
            {priorMessages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-control p-2 text-xs ${
                  msg.role === 'user'
                    ? 'bg-surface-2/80 border border-line-subtle text-ink'
                    : 'bg-abyss/60 border border-line-subtle text-ink-body'
                }`}
              >
                <div className="mb-1 flex items-center justify-between text-[11px] text-ink-muted">
                  <span className="font-semibold uppercase tracking-wider">
                    {msg.role === 'user' ? 'You' : 'Synaptic Oracle'}
                  </span>
                  {msg.timestamp && <span>{msg.timestamp}</span>}
                </div>
                <MessageContent>
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <MessageResponse>{msg.content}</MessageResponse>
                  )}
                </MessageContent>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spacer keeping the center of the 3D core unobstructed */}
      <div className="flex-1 min-h-12 pointer-events-none" />

      {/* Lower-Third Live Conversational HUD + Docked Composer */}
      <div className="relative z-10 flex flex-col gap-2 px-3 pb-2 pointer-events-none">
        {!hasConversation ? (
          /* New Chat State: Compact Floating Prompt Shortcuts + Optional Guest Banner */
          <div className="pointer-events-auto mx-auto w-full max-w-2xl flex flex-col gap-2.5">
            <div className="flex items-center justify-center gap-1.5 text-center">
              <Sparkles className="w-3.5 h-3.5 text-cyan-glow shrink-0" />
              <span className="font-grotesk text-xs sm:text-sm font-medium text-ink-body">
                Direct Synaptic Communion — speak or transmit a query to awaken the core
              </span>
            </div>

            {shortcuts.length > 0 && (
              <ul
                aria-label="Suggested questions"
                className="flex flex-wrap justify-center gap-1.5"
              >
                {shortcuts.map((s) => (
                  <li key={s.label}>
                    <button
                      type="button"
                      disabled={isSending}
                      onClick={() => onSubmitShortcut({ text: s.prompt })}
                      className="group inline-flex items-center gap-1.5 rounded-full border border-line-subtle bg-surface-1/75 backdrop-blur-md hover:bg-surface-2 hover:border-line px-3 py-1.5 text-xs text-ink-body hover:text-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                    >
                      <span>{s.label}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-ink-muted group-hover:text-cyan-glow shrink-0 transition-colors" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {isGuest && (
              <div className="p-2.5 bg-surface-1/80 backdrop-blur-md hud-sheen border border-line-subtle rounded-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-left">
                <div className="flex items-center gap-1.5 text-xs text-ink-body">
                  <Shield className="w-3.5 h-3.5 text-cyan-glow shrink-0" />
                  <span>Exploring in guest communion. Sign up free for full answers and saved chats.</span>
                </div>
                <BenthicCTAButton
                  variant="cyan"
                  size="sm"
                  onClick={onOpenAuthModal}
                  className="shrink-0 w-full sm:w-auto !py-1 !px-3"
                >
                  <span className="flex items-center justify-center gap-1 text-[11px] font-bold font-grotesk tracking-[0.08em] uppercase">
                    <UserPlus className="w-3 h-3" />
                    <span>Sign Up</span>
                  </span>
                </BenthicCTAButton>
              </div>
            )}
          </div>
        ) : (
          /* Active Conversation State: Live Turn Teleprompter Card */
          !isCaptionMinimized && (
            <div
              data-testid="entity-live-turn-card"
              className="pointer-events-auto mx-auto w-full max-w-2xl rounded-card bg-surface-1/80 backdrop-blur-md border border-line-subtle shadow-menu overflow-hidden select-text"
            >
              {/* Latest User Prompt Chip */}
              {latestUserMsg && (
                <div className="flex items-start justify-between gap-2 border-b border-line-subtle bg-surface-2/50 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <span className="mr-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-cyan-glow">
                      Query
                    </span>
                    <span className="text-xs text-ink line-clamp-2">{latestUserMsg.content}</span>
                    {latestUserMsg.failedError && (
                      <p
                        role="alert"
                        className="mt-1 flex items-center gap-1.5 text-[11px] text-crimson-text"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{latestUserMsg.failedError}</span>
                      </p>
                    )}
                  </div>
                  {latestUserMsg.failedError && (
                    <div className="flex items-center gap-1 shrink-0">
                      <MessageRetryButton onRetry={() => onRetryFailed(latestUserMsg.id)} />
                      <button
                        type="button"
                        onClick={() => onEditFailed(latestUserMsg.id)}
                        className="inline-flex items-center h-7 px-1.5 rounded-control text-[11px] text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Streaming or Completed Assistant Response */}
              {latestAssistantMsg && (
                <div
                  ref={liveScrollRef}
                  onScroll={handleLiveScroll}
                  aria-live="polite"
                  aria-busy={isSending}
                  className="max-h-44 sm:max-h-56 overflow-y-auto px-3.5 py-2.5 text-sm text-ink-body"
                >
                  <MessageContent>
                    {latestAssistantMsg.content ? (
                      <MessageResponse>
                        {isSending
                          ? withStreamingCursor(latestAssistantMsg.content)
                          : latestAssistantMsg.content}
                      </MessageResponse>
                    ) : latestAssistantMsg.stopped ? null : (
                      <div className="flex items-center gap-2 py-1 text-xs text-ink-muted">
                        <MessageThinkingDots />
                        <span>Aligning synaptic pathways…</span>
                      </div>
                    )}
                    {latestAssistantMsg.stopped && (
                      <p className="text-[11px] text-ink-muted">
                        {latestAssistantMsg.content
                          ? 'Stopped.'
                          : 'Stopped before a reply came through.'}
                      </p>
                    )}
                  </MessageContent>

                  {/* Footer Actions & Guest Nudge */}
                  {!isSending && latestAssistantMsg.content && (
                    <div className="mt-2 flex items-center justify-between gap-2 border-t border-line-subtle pt-1.5">
                      <div className="flex items-center gap-1">
                        <MessageCopyButton text={latestAssistantMsg.content} />
                      </div>
                      {(latestAssistantMsg.isGuest || isGuest) && (
                        <button
                          type="button"
                          onClick={onOpenAuthModal}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-glow hover:underline cursor-pointer"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Sign up for full answers</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        )}

        {/* Shared PromptInput Dock */}
        <div className="pointer-events-auto mx-auto w-full max-w-2xl">{composer}</div>
      </div>
    </div>
  )
}
