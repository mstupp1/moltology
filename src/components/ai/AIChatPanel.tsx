import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { BrandIcon } from '@/components/ui/BrandMark'
import {
  X,
  Pencil,
  AlertCircle,
  Minimize2,
  Maximize2,
  PanelRight,
  Shield,
  UserPlus,
  MessageSquare,
} from 'lucide-react'
import { Conversation, ConversationContent } from '../ai-elements/conversation'
import { Message, MessageContent, MessageResponse, MessageThinkingDots } from '../ai-elements/message'
import { PromptInput } from '../ai-elements/prompt-input'
import { NewChatScreen, DEFAULT_PROMPT_SHORTCUTS } from './NewChatScreen'
import { OracleChatsPanel, type OracleChatsLayout } from './OracleChatsPanel'
import { useThreadActions, type ThreadPatch } from './useThreadActions'
import { getAIMessagesFn, getAIThreadsFn, getUserProfileFn } from '../../lib/server/api'
import { streamOracleChat } from '../../lib/ai/stream-oracle-chat-client'
import { useSafeOracle, OracleMode } from '../hud/OracleContext'
import { ORACLE_MODELS, DEFAULT_ORACLE_MODEL_ID, getOracleModel, DEFAULT_ORACLE_PLACEHOLDER } from '../../lib/ai/oracle-models'
import { AuthModal } from '../AuthModal'
import { useAuthSession } from '../../hooks/useAuthSession'
import { BenthicCTAButton } from '../hud/BenthicCTAButton'
import { isAdmin } from '../../lib/permissions'
import { resolveMemberPublicName } from '../../lib/member-handle'
import { getAuthJWTToken } from '../../lib/jwt'
import { oracleAuthData } from '../../lib/ai/oracle-auth-client'

export const CHATS_COLUMN_MIN_WIDTH = 640

export interface AIChatPanelProps {
  user?: {
    id?: string
    sub?: string
    name?: string | null
    email?: string | null
    image?: string | null
    avatar?: string | null
    picture?: string | null
    role?: string | null
  } | null
  userId?: string | null
  threadId?: string | null
  personaName?: string
  onClose?: () => void
  onThreadCreated?: (newThreadId: string) => void
  isCompact?: boolean
  className?: string
  showModeControls?: boolean
  onToggleConversations?: () => void
  placeholder?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  isGuest?: boolean
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  user: propUser,
  userId: propUserId,
  threadId: propThreadId,
  personaName = 'SYNAPTIC ORACLE',
  placeholder = DEFAULT_ORACLE_PLACEHOLDER,
  onClose,
  onThreadCreated,
  isCompact = false,
  className = '',
  showModeControls = true,
  onToggleConversations,
}) => {
  const oracle = useSafeOracle()
  const session = useAuthSession()
  const sessionUser = session.user
  const user = propUser?.id || propUser?.sub ? propUser : sessionUser

  const userId = propUserId ?? user?.id ?? user?.sub ?? oracle?.userId ?? session.userId ?? null
  const isAuthPending = !userId && session.isPending
  const isGuest = !userId && !isAuthPending

  const [localActiveThreadId, setLocalActiveThreadId] = useState<string | null>(propThreadId || null)
  const activeThreadId =
    oracle?.activeThreadId !== undefined ? oracle.activeThreadId : propThreadId !== undefined ? propThreadId : localActiveThreadId

  const [localThreads, setLocalThreads] = useState<any[]>([])
  const [localIsLoadingThreads, setLocalIsLoadingThreads] = useState(false)
  const localThreadsCountRef = useRef(0)
  const [isChatsOpen, setIsChatsOpen] = useState(false)
  const [panelWidth, setPanelWidth] = useState(0)

  const rootRef = useRef<HTMLDivElement>(null)
  const chatsButtonRef = useRef<HTMLButtonElement>(null)

  const threads = oracle ? oracle.threads : localThreads
  const isLoadingThreads = oracle ? oracle.isLoadingThreads : localIsLoadingThreads

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState<string>(DEFAULT_ORACLE_MODEL_ID)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [profileRole, setProfileRole] = useState<string | null>(null)
  const [memberHandle, setMemberHandle] = useState<string | null>(null)
  const [memberLarvaId, setMemberLarvaId] = useState<string | null>(null)
  const conversationRef = useRef<HTMLDivElement>(null)
  const hadUserMessagesRef = useRef(false)

  const canPickModel = isAdmin(user, profileRole)

  useEffect(() => {
    if (!userId) {
      setProfileRole(null)
      setMemberHandle(null)
      setMemberLarvaId(null)
      return
    }

    let isSubscribed = true
    const applyProfile = async () => {
      try {
        const token = await getAuthJWTToken().catch(() => null)
        const profile = await getUserProfileFn({ data: { token: token ?? undefined, userId } })
        if (isSubscribed) {
          setProfileRole(profile?.role ?? null)
          setMemberHandle(profile?.handle ?? null)
          setMemberLarvaId(profile?.larvaId ?? null)
        }
      } catch {
        if (isSubscribed) {
          setProfileRole(null)
          setMemberHandle(null)
          setMemberLarvaId(null)
        }
      }
    }
    void applyProfile()
    window.addEventListener('member-handle-changed', applyProfile)

    return () => {
      isSubscribed = false
      window.removeEventListener('member-handle-changed', applyProfile)
    }
  }, [userId, user?.email, user?.role])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const refreshLocalThreads = async (): Promise<any[]> => {
    if (!userId) {
      setLocalThreads([])
      return []
    }
    const showLoading = localThreadsCountRef.current === 0
    if (showLoading) setLocalIsLoadingThreads(true)
    try {
      const data = await getAIThreadsFn({ data: await oracleAuthData(userId) })
      if (Array.isArray(data)) {
        localThreadsCountRef.current = data.length
        setLocalThreads(data)
        return data
      }
    } catch (err) {
      console.warn('Failed to load user AI threads:', err)
    } finally {
      if (showLoading) setLocalIsLoadingThreads(false)
    }
    return []
  }

  // The AI title is written after the reply finishes, so poll briefly until it replaces the placeholder.
  const refreshForGeneratedTitle = async (threadId: string, placeholder: string) => {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 800 : 1500))
      const list = oracle ? await oracle.refreshThreads() : await refreshLocalThreads()
      const current = Array.isArray(list) ? list.find((t: any) => t.id === threadId) : null
      if (current && current.title && current.title !== placeholder) return
    }
  }

  useEffect(() => {
    if (!oracle && userId) {
      refreshLocalThreads()
    }
  }, [oracle, userId])

  const chatsLayout: OracleChatsLayout =
    isChatsOpen && panelWidth >= CHATS_COLUMN_MIN_WIDTH ? 'column' : 'takeover'

  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return

    const syncWidth = (width: number) => {
      setPanelWidth((prev) => (prev === width ? prev : width))
    }

    syncWidth(el.clientWidth)

    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? el.clientWidth
      syncWidth(width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isChatsOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      setIsChatsOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isChatsOpen])

  const getTimeString = (d: Date = new Date()) => {
    if (!isMounted) return ''
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const selectedModel = getOracleModel(selectedModelId)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  // Tracks the thread whose messages are currently owned by this pane (loaded or
  // in-flight). Always start null so a mount with an already-selected thread
  // still fetches instead of rendering a blank pane.
  const loadedThreadIdRef = useRef<string | null>(null)
  const loadGenerationRef = useRef(0)

  // Check if current conversation has active user messages
  const hasUserMessages = messages.some((m) => m.role === 'user')

  const getThreadsForActions = useCallback(
    () => (oracle ? oracle.threads : localThreads),
    [oracle, localThreads]
  )

  const applyThreadPatch = useCallback(
    (threadId: string, patch: ThreadPatch) => {
      if (oracle) {
        oracle.patchThreadLocally(threadId, patch)
      } else {
        setLocalThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, ...patch } : t)))
      }
    },
    [oracle]
  )

  const removeThreadLocally = useCallback(
    (threadId: string) => {
      if (oracle) {
        oracle.removeThreadLocally(threadId)
      } else {
        setLocalThreads((prev) => prev.filter((t) => t.id !== threadId))
      }
    },
    [oracle]
  )

  const restoreThreadLocally = useCallback(
    (thread: any) => {
      if (oracle) {
        oracle.restoreThreadLocally(thread)
      } else {
        setLocalThreads((prev) => (prev.some((t) => t.id === thread.id) ? prev : [...prev, thread]))
      }
    },
    [oracle]
  )

  const handleActiveThreadRemoved = useCallback(
    (removedThreadId: string) => {
      const current = oracle ? oracle.activeThreadId : localActiveThreadId
      if (current === removedThreadId) {
        if (oracle) {
          oracle.setActiveThreadId(null)
        } else {
          setLocalActiveThreadId(null)
        }
        setMessages([])
      }
    },
    [oracle, localActiveThreadId]
  )

  const { pinThread, archiveThread, renameThread, deleteThread } = useThreadActions({
    userId,
    getThreads: getThreadsForActions,
    applyLocalPatch: applyThreadPatch,
    removeLocalThread: removeThreadLocally,
    restoreLocalThread: restoreThreadLocally,
    onActiveThreadRemoved: handleActiveThreadRemoved,
  })

  // Reset to empty messages when activeThreadId is null, or fetch thread messages if set
  useEffect(() => {
    if (!activeThreadId) {
      loadGenerationRef.current += 1
      loadedThreadIdRef.current = null
      setMessages((prev) => (prev.length === 0 ? prev : []))
      return
    }

    if (loadedThreadIdRef.current === activeThreadId) {
      return
    }

    const generation = ++loadGenerationRef.current
    loadedThreadIdRef.current = activeThreadId
    setMessages([])

    if (!userId) return

    void oracleAuthData(userId)
      .then((auth) => getAIMessagesFn({ data: { threadId: activeThreadId, ...auth } }))
      .then((records) => {
        if (generation !== loadGenerationRef.current) return
        if (Array.isArray(records) && records.length > 0) {
          const mapped: ChatMessage[] = records.map((r: any) => ({
            id: r.id,
            role: r.role,
            content: r.content,
            timestamp:
              r.createdAt && isMounted
                ? new Date(r.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '',
          }))
          setMessages(mapped)
        } else {
          setMessages([])
        }
      })
      .catch((err) => {
        if (generation !== loadGenerationRef.current) return
        console.warn('Failed to load thread messages:', err)
        setMessages([])
      })
  }, [activeThreadId, userId, isMounted, isGuest, selectedModelId])

  // Keep the message pane pinned to the latest turn without scrolling outer HUD containers.
  const scrollConversationToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const el = conversationRef.current
    if (!el) return
    if (typeof el.scrollTo === 'function') {
      el.scrollTo({ top: el.scrollHeight, behavior })
    } else {
      el.scrollTop = el.scrollHeight
    }
  }, [])

  useLayoutEffect(() => {
    if (!hasUserMessages) {
      hadUserMessagesRef.current = false
      return
    }

    const justEnteredConversation = !hadUserMessagesRef.current
    hadUserMessagesRef.current = true
    scrollConversationToBottom(justEnteredConversation || isSending ? 'auto' : 'smooth')
  }, [messages, isSending, hasUserMessages, scrollConversationToBottom])

  const handlePromptSubmit = async ({ text }: { text: string }) => {
    setErrorMessage(null)
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: getTimeString(),
    }

    const assistantId = (Date.now() + 1).toString()
    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: getTimeString(),
        isGuest: isGuest,
      },
    ])
    setIsSending(true)

    let pendingStreamText = ''
    let streamFrameId: number | null = null
    const flushStreamText = () => {
      streamFrameId = null
      const text = pendingStreamText
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: text } : m))
      )
    }
    const queueStreamText = (fullText: string) => {
      pendingStreamText = fullText
      if (streamFrameId == null) {
        streamFrameId = requestAnimationFrame(flushStreamText)
      }
    }

    const applyThreadId = (newThreadId: string) => {
      if (!newThreadId || newThreadId === activeThreadId) return
      loadedThreadIdRef.current = newThreadId
      if (oracle) {
        oracle.setActiveThreadId(newThreadId)
        oracle.refreshThreads()
      } else {
        setLocalActiveThreadId(newThreadId)
        if (userId) {
          refreshLocalThreads()
        }
      }
      if (onThreadCreated) {
        onThreadCreated(newThreadId)
      }
    }

    try {
      const payloadMessages = [...messages, userMsg]
        .filter((m) => Boolean(m.content && m.content.trim()))
        .map((m) => ({
          role: m.role,
          content: m.content,
        }))

      const res = await streamOracleChat({
        messages: payloadMessages,
        userId: userId || undefined,
        threadId: activeThreadId || undefined,
        model: selectedModelId,
        onThreadId: applyThreadId,
        onChunk: queueStreamText,
      })

      if (res.threadId) {
        applyThreadId(res.threadId)
        if (!activeThreadId && userId) {
          const placeholder = text.trim().split('\n')[0].slice(0, 60) || 'Ascendance Consultation'
          void refreshForGeneratedTitle(res.threadId, placeholder)
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: res.text,
                isGuest: Boolean(res.isGuest || isGuest),
              }
            : m
        )
      )
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => !(m.id === assistantId && !m.content)))
      setErrorMessage(err.message || 'Something went wrong sending your message. Please try again.')
    } finally {
      if (streamFrameId != null) {
        cancelAnimationFrame(streamFrameId)
      }
      setIsSending(false)
    }
  }

  const handleModeSwitch = (targetMode: OracleMode) => {
    if (oracle) {
      oracle.setMode(targetMode)
    }
  }

  const handleToggleChats = () => {
    if (!isChatsOpen) {
      if (oracle) {
        oracle.refreshThreads()
      } else if (userId) {
        refreshLocalThreads()
      }
    }
    setIsChatsOpen((prev) => !prev)
  }

  const handleSelectThread = (selectedId: string) => {
    if (selectedId !== activeThreadId) {
      loadedThreadIdRef.current = null
      setMessages([])
    }
    if (oracle) {
      oracle.setActiveThreadId(selectedId)
    } else {
      setLocalActiveThreadId(selectedId)
    }
    setIsChatsOpen(false)
  }

  const handleNewChat = () => {
    if (oracle) {
      oracle.setActiveThreadId(null)
    } else {
      setLocalActiveThreadId(null)
    }
    setMessages([])
    setErrorMessage(null)
    setIsChatsOpen(false)
  }

  const handleClose = () => {
    if (oracle) {
      oracle.setMode('closed')
    }
    if (onClose) {
      onClose()
    }
  }

  const showConversation = !isChatsOpen || chatsLayout === 'column'
  const chatsToggleSize = isCompact ? 'p-2 min-w-10 min-h-10' : 'p-1'
  const chatsIconSize = isCompact ? 'w-4 h-4' : 'w-3.5 h-3.5'

  return (
    <div
      ref={rootRef}
      className={`flex flex-col bg-surface-1/60 backdrop-blur-md border border-line-subtle shadow-menu font-sans overflow-hidden h-full w-full relative ${className}`}
    >
      {/* Faded Grayscale Watermark Logo Background */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <BrandIcon
          aria-hidden="true"
          className="w-56 h-56 sm:w-72 sm:h-72 md:w-96 md:h-96 max-w-[65%] max-h-[65%] object-contain grayscale opacity-[0.035] pointer-events-none select-none"
        />
      </div>

      {/* Shared Simplified Header */}
      <div className="bg-surface-2/75 backdrop-blur-md border-b border-line-subtle px-3 py-2 flex items-center justify-between gap-2 shrink-0 select-none relative z-10">
        {/* Left Section: Icon, Title & Chats Button */}
        <div className="flex items-center space-x-2 min-w-0 flex-1 truncate">
          {onToggleConversations ? (
            <button
              type="button"
              onClick={onToggleConversations}
              className={`text-ink-muted hover:text-ink hover:bg-surface-2 rounded-control ${chatsToggleSize} md:hidden transition-colors cursor-pointer shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow`}
              title="Chats"
              aria-label="Toggle Chats"
            >
              <MessageSquare className={chatsIconSize} />
            </button>
          ) : (
            <button
              ref={chatsButtonRef}
              type="button"
              onClick={handleToggleChats}
              className={`${chatsToggleSize} rounded-control transition-colors cursor-pointer shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                isChatsOpen
                  ? 'text-cyan-glow bg-surface-2'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-2'
              }`}
              title="Chats"
              aria-label="Toggle Chats"
              aria-expanded={isChatsOpen}
            >
              <MessageSquare className={chatsIconSize} />
            </button>
          )}

          <span className="text-xs font-bold text-ink tracking-[0.08em] truncate pointer-events-none">
            {personaName}
          </span>
        </div>

        {/* Mode Switcher & Panel Controls */}
        <div
          className="flex items-center space-x-1 shrink-0 pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {showModeControls && oracle && (
            <>
              <button
                onClick={() => handleModeSwitch(oracle.mode === 'sidebar' ? 'popout' : 'sidebar')}
                className={`hidden md:inline-flex p-1 rounded-control transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                  oracle.mode === 'sidebar'
                    ? 'text-cyan-glow bg-surface-2'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-2'
                }`}
                title="Sidebar"
                aria-label="Sidebar"
              >
                <PanelRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleModeSwitch(oracle.mode === 'page' ? 'popout' : 'page')}
                className={`p-1 rounded-control transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                  oracle.mode === 'page'
                    ? 'text-cyan-glow bg-surface-2'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-2'
                }`}
                title={oracle.mode === 'page' ? 'Popout' : 'Expand'}
                aria-label={oracle.mode === 'page' ? 'Popout' : 'Expand'}
              >
                {oracle.mode === 'page' ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
            </>
          )}

          <button
            onClick={handleNewChat}
            className="text-ink-muted hover:text-ink hover:bg-surface-2 rounded-control p-1 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            title="New Chat"
            aria-label="New Chat"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleClose}
            className="text-ink-muted hover:text-ink hover:bg-surface-2 rounded-control p-1 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-crimson-soft border-b border-crimson-aggro/40 px-3 py-1.5 text-[11px] text-crimson-text flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-crimson-text shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-crimson-text hover:text-ink rounded-control px-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow">
            ×
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden relative z-10">
        {isChatsOpen && (
          <OracleChatsPanel
            userId={userId}
            isAuthPending={isAuthPending}
            threads={threads}
            activeThreadId={activeThreadId}
            isLoadingThreads={isLoadingThreads}
            layout={chatsLayout}
            onSelectThread={handleSelectThread}
            onClose={() => setIsChatsOpen(false)}
            onPin={pinThread}
            onArchive={archiveThread}
            onRename={renameThread}
            onDelete={deleteThread}
            onOpenAuthModal={() => {
              setIsAuthModalOpen(true)
              setIsChatsOpen(false)
            }}
          />
        )}

        {showConversation && (!hasUserMessages && !activeThreadId ? (
        <div className="flex-1 overflow-y-auto min-h-0 relative">
          <NewChatScreen
            userId={userId}
            isGuest={isGuest}
            selectedModel={selectedModel}
            onSelectModel={(id) => setSelectedModelId(id)}
            showModelPicker={canPickModel}
            onSubmit={handlePromptSubmit}
            isSending={isSending}
            personaName={personaName}
            placeholder={placeholder}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            shortcuts={DEFAULT_PROMPT_SHORTCUTS}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {/* Message Canvas */}
          <Conversation ref={conversationRef} className="flex-1 min-h-0">
            <ConversationContent>
              {messages.map((msg) => (
                <Message
                  key={msg.id}
                  from={msg.role === 'user' ? 'user' : 'assistant'}
                  timestamp={msg.timestamp}
                  senderLabel={
                    msg.role === 'user'
                      ? resolveMemberPublicName({
                          userId,
                          handle: memberHandle,
                          larvaId: memberLarvaId,
                        })
                      : undefined
                  }
                  user={msg.role === 'user' ? user : undefined}
                >
                  <MessageContent>
                    {msg.content ? (
                      <MessageResponse>{msg.content}</MessageResponse>
                    ) : msg.role === 'assistant' ? (
                      <MessageThinkingDots />
                    ) : null}
                    {msg.role === 'assistant' && (msg.isGuest || isGuest) && msg.content && (
                      <div className="mt-2 pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-surface-2 px-2.5 py-1.5 rounded-control border border-line-subtle">
                        <div className="text-[11px] text-ink-body font-sans flex items-center gap-1.5 min-w-0">
                          <Shield className="w-3 h-3 text-cyan-glow shrink-0" />
                          <span>Sign up free to unlock</span>
                        </div>
                        <BenthicCTAButton
                          variant="cyan"
                          size="sm"
                          onClick={() => setIsAuthModalOpen(true)}
                          className="w-full sm:w-auto shrink-0 !min-h-0 !py-0.5 !px-2.5"
                        >
                          <span className="flex items-center justify-center gap-1 text-[11px] font-bold font-grotesk tracking-[0.08em] uppercase">
                            <UserPlus className="w-3 h-3" />
                            <span>Sign Up</span>
                          </span>
                        </BenthicCTAButton>
                      </div>
                    )}
                  </MessageContent>
                </Message>
              ))}
            </ConversationContent>
          </Conversation>

          {/* Active Conversation Input Box */}
          <div className="shrink-0">
            <PromptInput
              onSubmit={handlePromptSubmit}
              status={isSending ? 'streaming' : 'ready'}
              placeholder={placeholder}
              selectedModel={canPickModel ? selectedModel : undefined}
              onSelectModel={canPickModel ? (id) => setSelectedModelId(id) : undefined}
            />
          </div>
        </div>
      ))}
      </div>

      {/* Auth Modal Triggered from In-Chat Gating CTAs */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="signup"
      />
    </div>
  )
}

