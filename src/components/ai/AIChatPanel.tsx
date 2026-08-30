import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import {
  X,
  Pencil,
  AlertCircle,
  Minimize2,
  Maximize2,
  PanelRight,
  Menu,
  Shield,
  UserPlus,
  MessageSquare,
  Lock,
} from 'lucide-react'
import { Conversation, ConversationContent } from '../ai-elements/conversation'
import { Message, MessageContent, MessageResponse, MessageThinkingDots } from '../ai-elements/message'
import { PromptInput } from '../ai-elements/prompt-input'
import { NewChatScreen, DEFAULT_PROMPT_SHORTCUTS } from './NewChatScreen'
import { ThreadList } from './ThreadList'
import { useThreadActions, type ThreadPatch } from './useThreadActions'
import { getAIMessagesFn, getAIThreadsFn, getUserProfileFn } from '../../lib/server/api'
import { streamOracleChat } from '../../lib/ai/stream-oracle-chat-client'
import { useSafeOracle, OracleMode } from '../hud/OracleContext'
import { ORACLE_MODELS, DEFAULT_ORACLE_MODEL_ID, getOracleModel } from '../../lib/ai/oracle-models'
import { AuthModal } from '../AuthModal'
import { useAuthSession } from '../../hooks/useAuthSession'
import { BenthicCTAButton } from '../hud/BenthicCTAButton'
import { getAssetUrl } from '../../lib/assets'
import { isAdminOrSuperAdmin } from '../../lib/permissions'
import { resolveMemberPublicName } from '../../lib/member-handle'
import { getAuthJWTToken } from '../../lib/jwt'
import { HudGhostSkeleton } from '@/components/ui/HudGhostLoader'

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
  headerDragProps?: React.HTMLAttributes<HTMLDivElement>
  isDraggable?: boolean
  onToggleConversations?: () => void
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
  onClose,
  onThreadCreated,
  isCompact = false,
  className = '',
  showModeControls = true,
  headerDragProps,
  isDraggable = false,
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
  const [isChatsOpen, setIsChatsOpen] = useState(false)

  const chatsDropdownRef = useRef<HTMLDivElement>(null)
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

  const canPickModel = isAdminOrSuperAdmin(user, profileRole)

  useEffect(() => {
    if (!userId) {
      setProfileRole(null)
      setMemberHandle(null)
      setMemberLarvaId(null)
      return
    }

    let isSubscribed = true
    ;(async () => {
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
    })()

    return () => {
      isSubscribed = false
    }
  }, [userId, user?.email, user?.role])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const refreshLocalThreads = async () => {
    if (!userId) {
      setLocalThreads([])
      return
    }
    setLocalIsLoadingThreads(true)
    try {
      const data = await getAIThreadsFn({ data: { userId } })
      if (Array.isArray(data)) {
        setLocalThreads(data)
      }
    } catch (err) {
      console.warn('Failed to load user AI threads:', err)
    } finally {
      setLocalIsLoadingThreads(false)
    }
  }

  useEffect(() => {
    if (!oracle && userId) {
      refreshLocalThreads()
    }
  }, [oracle, userId])

  // Click outside and Escape key listeners to dismiss chats popover
  useEffect(() => {
    if (!isChatsOpen) return

    const handleClickOutside = (e: MouseEvent | PointerEvent) => {
      const target = e.target as Element | null
      if (
        target &&
        (target.closest('[data-radix-popper-content-wrapper]') ||
          target.closest('[data-hud-bottom-sheet]') ||
          target.closest('[data-hud-modal-root]'))
      ) {
        return
      }
      if (
        chatsDropdownRef.current &&
        !chatsDropdownRef.current.contains(e.target as Node) &&
        chatsButtonRef.current &&
        !chatsButtonRef.current.contains(e.target as Node)
      ) {
        setIsChatsOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsChatsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isChatsOpen])

  const getTimeString = (d: Date = new Date()) => {
    if (!isMounted) return ''
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const selectedModel = getOracleModel(selectedModelId)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const loadedThreadIdRef = useRef<string | null>(activeThreadId)

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
      loadedThreadIdRef.current = null
      return
    }

    if (loadedThreadIdRef.current === activeThreadId) {
      return
    }

    loadedThreadIdRef.current = activeThreadId

    if (!userId) return

    getAIMessagesFn({ data: { threadId: activeThreadId, userId } })
      .then((records) => {
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

  return (
    <div
      className={`flex flex-col bg-[#070c0e]/60 backdrop-blur-md border border-cyan-900/40 shadow-2xl font-sans overflow-hidden h-full w-full relative ${className}`}
    >
      {/* Faded Grayscale Watermark Logo Background */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <img
          src={getAssetUrl('/images/order_emblem.png')}
          alt=""
          className="w-56 h-56 sm:w-72 sm:h-72 md:w-96 md:h-96 max-w-[65%] max-h-[65%] object-contain grayscale opacity-[0.035] pointer-events-none select-none"
        />
      </div>

      {/* Shared Simplified Header */}
      <div
        className={`bg-[#070c0e]/75 backdrop-blur-md border-b border-cyan-900/40 px-3 py-2 flex items-center justify-between gap-2 shrink-0 select-none relative z-10 ${
          isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        {...headerDragProps}
      >
        {/* Left Section: Icon, Title & Chats Button */}
        <div className="flex items-center space-x-2 min-w-0 flex-1 truncate">
          {onToggleConversations ? (
            <button
              type="button"
              onClick={onToggleConversations}
              className="text-gray-400 hover:text-cyan-300 p-1 md:hidden transition-colors cursor-pointer shrink-0"
              title="Chats"
              aria-label="Toggle Chats"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              ref={chatsButtonRef}
              type="button"
              onClick={handleToggleChats}
              className={`p-1 transition-colors cursor-pointer shrink-0 ${
                isChatsOpen
                  ? 'text-cyan-300 bg-cyan-950/60 rounded-xs'
                  : 'text-gray-400 hover:text-cyan-300'
              }`}
              title="Chats"
              aria-label="Toggle Chats"
              aria-expanded={isChatsOpen}
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          )}

          <img
            src={getAssetUrl('/images/order_emblem.png')}
            alt="Oracle"
            className="w-4 h-4 object-contain drop-shadow-[0_0_6px_rgba(0,195,255,0.4)] shrink-0 pointer-events-none"
          />
          <span className="text-xs font-bold text-cyan-300 tracking-wider truncate pointer-events-none hidden xs:inline">
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
                className={`hidden md:inline-flex p-1 transition-colors cursor-pointer ${
                  oracle.mode === 'sidebar'
                    ? 'text-cyan-300 bg-cyan-950/60'
                    : 'text-gray-400 hover:text-cyan-300'
                }`}
                title="Sidebar"
                aria-label="Sidebar"
              >
                <PanelRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleModeSwitch(oracle.mode === 'page' ? 'popout' : 'page')}
                className={`p-1 transition-colors cursor-pointer ${
                  oracle.mode === 'page'
                    ? 'text-cyan-300 bg-cyan-950/60'
                    : 'text-gray-400 hover:text-cyan-300'
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
            className="text-gray-400 hover:text-cyan-300 p-1 transition-colors cursor-pointer"
            title="New Chat"
            aria-label="New Chat"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-red-400 p-1 transition-colors cursor-pointer"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Small Scrollable Chats Window Overlay / Dropdown */}
      {isChatsOpen && (
        <div
          ref={chatsDropdownRef}
          onPointerDown={(e) => e.stopPropagation()}
          className={`absolute top-10 left-2 z-50 bg-[#060a0d]/95 backdrop-blur-xl border border-cyan-500/60 shadow-2xl shadow-cyan-950/90 rounded-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 font-sans ${
            isCompact
              ? 'w-56 sm:w-64 max-w-[calc(100%-1rem)] max-h-[48%]'
              : 'w-64 sm:w-72 max-w-[calc(100%-1rem)] max-h-[65%]'
          }`}
        >
          {/* Header of the chats window */}
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-cyan-950 bg-[#080e11]/90 shrink-0 select-none">
            <span className="text-[11px] font-bold text-cyan-500 tracking-wider uppercase font-sans">
              CHATS
            </span>

            <button
              type="button"
              onClick={() => setIsChatsOpen(false)}
              className="p-1 text-gray-400 hover:text-red-400 transition-colors cursor-pointer rounded"
              title="Close Chats Window"
              aria-label="Close Chats Window"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div
            className={`flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0 ${
              isCompact ? 'max-h-40 sm:max-h-48' : 'max-h-60 sm:max-h-72'
            }`}
          >
            {isAuthPending ? (
              <div className="p-3 space-y-2 font-sans" data-testid="oracle-chats-auth-skeleton">
                <HudGhostSkeleton variant="cyan" preset="badge" width={88} height={14} />
                <HudGhostSkeleton variant="neutral" preset="text" width="100%" height={24} />
                <HudGhostSkeleton variant="neutral" preset="text" width="80%" height={24} />
              </div>
            ) : userId ? (
              isLoadingThreads ? (
                <div className="py-6 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
                  <img
                    src={getAssetUrl('/images/order_emblem.png')}
                    alt="Loading"
                    className="w-4 h-4 object-contain animate-pulse drop-shadow-[0_0_6px_rgba(0,195,255,0.4)]"
                  />
                  <span className="text-[11px] text-cyan-400/80 animate-pulse">Accessing archives...</span>
                </div>
              ) : threads.length === 0 ? (
                <div className="py-6 px-3 text-center text-xs text-gray-400 space-y-2">
                  <p className="text-[11px] text-gray-400">No recorded chats yet.</p>
                </div>
              ) : (
                <ThreadList
                  threads={threads}
                  activeThreadId={activeThreadId}
                  isLoadingThreads={false}
                  onSelectThread={handleSelectThread}
                  onPin={pinThread}
                  onArchive={archiveThread}
                  onRename={renameThread}
                  onDelete={deleteThread}
                />
              )
            ) : (
              /* Guest Mode Notice */
              <div className="p-3 space-y-3 font-sans">
                <div className="flex items-center space-x-2 text-cyan-400">
                  <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs font-bold tracking-wider uppercase">GUEST MODE</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Chats in guest mode are temporary. Create a free initiate account to preserve your neural consultations.
                </p>
                <BenthicCTAButton
                  variant="red"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    setIsAuthModalOpen(true)
                    setIsChatsOpen(false)
                  }}
                >
                  <span className="flex items-center justify-center gap-1.5 text-xs font-bold font-grotesk tracking-wider uppercase">
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>SIGN UP FREE</span>
                  </span>
                </BenthicCTAButton>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-red-950/80 border-b border-red-800 px-3 py-1.5 text-[11px] text-red-300 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-200">
            ×
          </button>
        </div>
      )}

      {/* Main View Area: Either Centered New Chat Screen OR Active Conversation */}
      {!hasUserMessages && !activeThreadId ? (
        <div className="flex-1 overflow-y-auto min-h-0 relative z-10">
          <NewChatScreen
            userId={userId}
            isGuest={isGuest}
            selectedModel={selectedModel}
            onSelectModel={(id) => setSelectedModelId(id)}
            showModelPicker={canPickModel}
            onSubmit={handlePromptSubmit}
            isSending={isSending}
            personaName={personaName}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            shortcuts={DEFAULT_PROMPT_SHORTCUTS}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative z-10">
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
                      <div className="mt-2 pt-2 border-t border-[#ff453a]/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-[#0e0506]/85 px-2.5 py-1.5 chamfer-corner border border-[#ff453a]/30 shadow-[0_0_12px_rgba(255,69,58,0.06)]">
                        <div className="text-[10.5px] text-red-200/90 font-sans flex items-center gap-1.5 min-w-0">
                          <Shield className="w-3 h-3 text-[#ff453a] shrink-0" />
                          <span>Sign up free to unlock</span>
                        </div>
                        <BenthicCTAButton
                          variant="red"
                          size="sm"
                          onClick={() => setIsAuthModalOpen(true)}
                          className="w-full sm:w-auto shrink-0 !min-h-0 !py-0.5 !px-2.5"
                        >
                          <span className="flex items-center justify-center gap-1 text-[10px] font-bold font-grotesk tracking-wider uppercase">
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
              selectedModel={canPickModel ? selectedModel : undefined}
              onSelectModel={canPickModel ? (id) => setSelectedModelId(id) : undefined}
            />
          </div>
        </div>
      )}

      {/* Auth Modal Triggered from In-Chat Gating CTAs */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="signup"
      />
    </div>
  )
}

