import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useId } from 'react'
import {
  X,
  PanelLeftOpen,
  AlertCircle,
  Shield,
  UserPlus,
  ArrowDown,
} from 'lucide-react'
import { Conversation, ConversationContent } from '../ai-elements/conversation'
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageThinkingDots,
  MessageCopyButton,
  MessageRetryButton,
  withStreamingCursor,
} from '../ai-elements/message'
import { useIsPhone, useKeyboardInset } from '../../hooks/useChatViewport'
import { PromptInput } from '../ai-elements/prompt-input'
import { NewChatScreen, DEFAULT_PROMPT_SHORTCUTS } from './NewChatScreen'
import { OracleChatsPanel } from './OracleChatsPanel'
import { OracleModeMenu, headerIconButtonClasses } from './OracleHeaderControls'
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
import { useOracleUsage } from '@/hooks/useOracleUsage'
import { CHAT_LIMIT, getChatLimitError } from '@/lib/ai/chat-retention'

const INLINE_COMPOSER_MIN_WIDTH = 640

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
  onClose?: () => void
  onThreadCreated?: (newThreadId: string) => void
  onThreadChange?: (threadId: string | null) => void
  isCompact?: boolean
  className?: string
  showModeControls?: boolean
  /** Full-page desktop keeps a persistent chats column; mobile uses the list takeover. */
  desktopChatsSidebar?: boolean
  placeholder?: string
  /** Close the panel when Escape is pressed inside it (popout). */
  closeOnEscape?: boolean
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  isGuest?: boolean
  /** Set on a user message whose send failed before any reply arrived. */
  failedError?: string
  /** Set on an assistant reply the member stopped. */
  stopped?: boolean
}

/** Distance from the bottom (px) that still counts as reading the latest turn. */
const NEAR_BOTTOM_PX = 80

const isAbortError = (err: unknown) =>
  (err as { name?: string } | null)?.name === 'AbortError'

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  user: propUser,
  userId: propUserId,
  threadId: propThreadId,
  placeholder = DEFAULT_ORACLE_PLACEHOLDER,
  onClose,
  onThreadCreated,
  onThreadChange,
  isCompact = false,
  className = '',
  showModeControls = true,
  desktopChatsSidebar = false,
  closeOnEscape = false,
}) => {
  const oracle = useSafeOracle()
  const session = useAuthSession()
  const sessionUser = session.user
  const user = propUser?.id || propUser?.sub ? propUser : sessionUser

  const userId = propUserId ?? user?.id ?? user?.sub ?? oracle?.userId ?? session.userId ?? null
  const usage = useOracleUsage(userId)
  const isAuthPending = !userId && session.isPending
  const isGuest = !userId && !isAuthPending

  const [localActiveThreadId, setLocalActiveThreadId] = useState<string | null>(propThreadId || null)
  const activeThreadId =
    oracle?.activeThreadId !== undefined ? oracle.activeThreadId : propThreadId !== undefined ? propThreadId : localActiveThreadId

  const [localThreads, setLocalThreads] = useState<any[]>([])
  const [localIsLoadingThreads, setLocalIsLoadingThreads] = useState(false)
  const localThreadsCountRef = useRef(0)
  const [isChatsOpen, setIsChatsOpen] = useState(false)
  const [isChatsMounted, setIsChatsMounted] = useState(false)
  const [panelWidth, setPanelWidth] = useState(0)
  const [desktopChatsOpen, setDesktopChatsOpen] = useState(true)
  const [desktopViewport, setDesktopViewport] = useState(false)
  const isDesktopPage = desktopChatsSidebar && desktopViewport
  const chatsOpen = isDesktopPage ? desktopChatsOpen : isChatsOpen
  const chatsLayout = (desktopChatsSidebar ? isDesktopPage : panelWidth >= 640) ? 'column' : 'takeover'
  const chatsPanelId = useId()
  const restoreChatsFocusRef = useRef(false)
  useEffect(() => {
    if (chatsOpen) {
      setIsChatsMounted(true)
      return
    }
    if (!isChatsMounted) return
    const timer = setTimeout(() => setIsChatsMounted(false), 220)
    return () => clearTimeout(timer)
  }, [chatsOpen, isChatsMounted])
  const setChatsOpen = useCallback((open: boolean) => {
    if (isDesktopPage) {
      setDesktopChatsOpen(open)
      try {
        localStorage.setItem('moltology:oracle_page_chats', open ? 'open' : 'closed')
      } catch {}
    } else {
      setIsChatsOpen(open)
    }
  }, [isDesktopPage])
  const closeChats = useCallback((restoreFocus = true) => {
    restoreChatsFocusRef.current = restoreFocus
    setChatsOpen(false)
  }, [setChatsOpen])

  useEffect(() => {
    if (!desktopChatsSidebar) return
    try {
      setDesktopChatsOpen(localStorage.getItem('moltology:oracle_page_chats') !== 'closed')
    } catch {}
  }, [desktopChatsSidebar])

  useEffect(() => {
    if (!desktopChatsSidebar) return
    const sync = () => setDesktopViewport(window.innerWidth >= 768)
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [desktopChatsSidebar])

  const rootRef = useRef<HTMLDivElement>(null)
  const chatsButtonRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!chatsOpen && restoreChatsFocusRef.current) {
      chatsButtonRef.current?.focus()
      restoreChatsFocusRef.current = false
    }
  }, [chatsOpen])

  const threads = oracle ? oracle.threads : localThreads
  const isLoadingThreads = oracle ? oracle.isLoadingThreads : localIsLoadingThreads
  const isAtChatLimit = Boolean(userId) && threads.length >= CHAT_LIMIT

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState<string>(DEFAULT_ORACLE_MODEL_ID)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [profileRole, setProfileRole] = useState<string | null>(null)
  const [memberHandle, setMemberHandle] = useState<string | null>(null)
  const [memberLarvaId, setMemberLarvaId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [isAwayFromBottom, setIsAwayFromBottom] = useState(false)
  const conversationRef = useRef<HTMLDivElement>(null)
  const hadUserMessagesRef = useRef(false)
  const stickToBottomRef = useRef(true)
  const abortRef = useRef<AbortController | null>(null)

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
    if (!chatsOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      closeChats()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [chatsOpen, closeChats])

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
      if (activeThreadId === removedThreadId) {
        if (oracle) {
          oracle.setActiveThreadId(null)
        } else {
          setLocalActiveThreadId(null)
          onThreadChange?.(null)
        }
        setMessages([])
      }
    },
    [oracle, activeThreadId, onThreadChange]
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

  // Follow new text only while the member is at the bottom. Scrolling up to reread
  // stops the pull and shows a Jump to latest button instead.
  useLayoutEffect(() => {
    if (!hasUserMessages) {
      hadUserMessagesRef.current = false
      stickToBottomRef.current = true
      setIsAwayFromBottom(false)
      return
    }

    const justEnteredConversation = !hadUserMessagesRef.current
    hadUserMessagesRef.current = true
    if (justEnteredConversation) stickToBottomRef.current = true
    if (!stickToBottomRef.current) return
    scrollConversationToBottom(justEnteredConversation || isSending ? 'auto' : 'smooth')
  }, [messages, isSending, hasUserMessages, scrollConversationToBottom])

  const handleConversationScroll = useCallback(() => {
    const el = conversationRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_PX
    stickToBottomRef.current = nearBottom
    setIsAwayFromBottom((prev) => (prev === !nearBottom ? prev : !nearBottom))
  }, [])

  const handleJumpToLatest = () => {
    stickToBottomRef.current = true
    setIsAwayFromBottom(false)
    scrollConversationToBottom('smooth')
  }

  const sendMessage = async (text: string, baseMessages: ChatMessage[] = messages) => {
    setErrorMessage(null)
    if (usage.blocked) {
      setDraft((previous) => previous || text)
      return
    }
    if (userId && !activeThreadId && isAtChatLimit) {
      setErrorMessage(getChatLimitError().message)
      setDraft((prev) => prev || text)
      return
    }
    stickToBottomRef.current = true
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: getTimeString(),
    }

    const assistantId = (Date.now() + 1).toString()
    setMessages([
      ...baseMessages,
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
    const controller = new AbortController()
    abortRef.current = controller

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
      const payloadMessages = [...baseMessages, userMsg]
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
        signal: controller.signal,
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
      if (streamFrameId != null) {
        cancelAnimationFrame(streamFrameId)
        streamFrameId = null
      }
      const partial = pendingStreamText
      if (isAbortError(err) || controller.signal.aborted) {
        // Keep whatever arrived and mark it, so a stopped reply never looks finished.
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: partial, stopped: true } : m))
        )
      } else if (partial.trim()) {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: partial } : m))
        )
        setErrorMessage(err?.message || 'The reply was cut off. Please try again.')
      } else {
        if (err?.status === 429) setDraft((previous) => previous || text)
        const failedError = err?.message || 'Something went wrong sending your message. Please try again.'
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== assistantId)
            .map((m) => (m.id === userMsg.id ? { ...m, failedError } : m))
        )
      }
    } finally {
      if (streamFrameId != null) {
        cancelAnimationFrame(streamFrameId)
      }
      if (abortRef.current === controller) abortRef.current = null
      setIsSending(false)
      void usage.refresh()
    }
  }

  const handlePromptSubmit = ({ text }: { text: string }) => {
    void sendMessage(text)
  }

  const handleStop = () => {
    abortRef.current?.abort()
  }

  // Abort an in-flight reply when the pane unmounts or switches threads.
  useEffect(() => () => abortRef.current?.abort(), [])

  const handleRetryFailed = (failedId: string) => {
    const index = messages.findIndex((m) => m.id === failedId)
    if (index < 0) return
    void sendMessage(messages[index].content, messages.slice(0, index))
  }

  const handleEditFailed = (failedId: string) => {
    const failed = messages.find((m) => m.id === failedId)
    if (!failed) return
    setMessages((prev) => prev.filter((m) => m.id !== failedId))
    setDraft(failed.content)
  }

  const handleModeSwitch = (targetMode: OracleMode) => {
    if (oracle) {
      oracle.setMode(targetMode)
    }
  }

  const handleToggleChats = () => {
    if (!chatsOpen) {
      if (oracle) {
        oracle.refreshThreads()
      } else if (userId) {
        refreshLocalThreads()
      }
    }
    if (chatsOpen) closeChats()
    else setChatsOpen(true)
  }

  const handleSelectThread = (selectedId: string) => {
    if (selectedId !== activeThreadId) {
      abortRef.current?.abort()
      loadedThreadIdRef.current = null
      setMessages([])
    }
    if (oracle) {
      oracle.setActiveThreadId(selectedId)
    } else {
      setLocalActiveThreadId(selectedId)
      onThreadChange?.(selectedId)
    }
    if (chatsLayout === 'takeover') closeChats(false)
  }

  const handleNewChat = () => {
    abortRef.current?.abort()
    if (oracle) {
      oracle.setActiveThreadId(null)
    } else {
      setLocalActiveThreadId(null)
      onThreadChange?.(null)
    }
    setMessages([])
    setErrorMessage(null)
    if (chatsLayout === 'takeover') closeChats(false)
  }

  const handleClose = () => {
    if (oracle) {
      oracle.setMode('closed')
    }
    if (onClose) {
      onClose()
    }
  }

  const showConversation = !chatsOpen || chatsLayout === 'column'
  const isNewChat = !hasUserMessages && !activeThreadId
  // Narrow panels (phone sheet, popout, sidebar) keep the prompt box docked at the bottom
  // from the first message, so it sits above the keyboard and never jumps after sending.
  const isNarrow = panelWidth - (chatsOpen && chatsLayout === 'column' ? 288 : 0) < INLINE_COMPOSER_MIN_WIDTH
  // Phones: a new chat puts the box at the top (the keyboard opens below it); an ongoing
  // chat docks it at the bottom and lifts it by the keyboard inset instead of panning the page.
  const isPhone = useIsPhone()
  const keyboardInset = useKeyboardInset(isPhone && !isNewChat)

  // The keyboard shrinks the message pane, so keep the latest turn in view as it opens.
  useLayoutEffect(() => {
    if (keyboardInset > 0 && stickToBottomRef.current) scrollConversationToBottom('auto')
  }, [keyboardInset, scrollConversationToBottom])

  // Ctrl/Cmd+Shift+O starts a new chat, as in ChatGPT.
  const newChatRef = useRef<() => void>(() => {})
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'o' || !e.shiftKey || !(e.metaKey || e.ctrlKey)) return
      e.preventDefault()
      newChatRef.current()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
  const activeThreadTitle = activeThreadId
    ? (threads.find((t: any) => t.id === activeThreadId)?.title as string | undefined) || null
    : null
  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id

  newChatRef.current = () => {
    if (!isAtChatLimit) handleNewChat()
  }

  const handleRootKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Escape' || !closeOnEscape || chatsOpen || isAuthModalOpen) return
    const target = e.target as HTMLElement | null
    if (target?.closest?.('[role="menu"], [role="dialog"], [role="alertdialog"], [role="listbox"]')) return
    e.preventDefault()
    handleClose()
  }

  const composer = (variant: 'docked' | 'inline') => (
    <div>
      <PromptInput
        sendDisabled={usage.blocked}
        variant={variant}
        compact={isPhone}
        footnote={isPhone ? undefined : 'The Oracle can be wrong. Check anything important.'}
        value={draft}
        onValueChange={setDraft}
        onSubmit={handlePromptSubmit}
        onStop={handleStop}
        status={isSending ? 'streaming' : 'ready'}
        placeholder={placeholder}
        autoFocus
        selectedModel={canPickModel ? selectedModel : undefined}
        onSelectModel={canPickModel ? (id) => setSelectedModelId(id) : undefined}
      />
    </div>
  )
  const headerButton = headerIconButtonClasses(isPhone)
  const windowControls = (
    <>
      {showModeControls && oracle && oracle.mode !== 'closed' && (
        <OracleModeMenu mode={oracle.mode} onSelect={handleModeSwitch} touch={isPhone} />
      )}

      <button
        type="button"
        onClick={handleClose}
        className={headerButton}
        title="Close Panel"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </>
  )

  return (
    <div
      ref={rootRef}
      onKeyDown={handleRootKeyDown}
      style={keyboardInset ? { paddingBottom: keyboardInset } : undefined}
      className={`flex flex-col bg-surface-1/60 backdrop-blur-md border border-line-subtle shadow-menu font-sans overflow-hidden h-full w-full relative ${className}`}
    >
      <div className="flex flex-1 min-h-0 overflow-hidden relative z-10">
        {isChatsMounted && (
          <OracleChatsPanel
            id={chatsPanelId}
            touch={isPhone}
            onCollapse={() => closeChats()}
            onNewChat={handleNewChat}
            newChatDisabled={isAtChatLimit}
            newChatTitle={isAtChatLimit ? getChatLimitError().message : 'New chat (Ctrl+Shift+O)'}
            userId={userId}
            isAuthPending={isAuthPending}
            threads={threads}
            activeThreadId={activeThreadId}
            isLoadingThreads={isLoadingThreads}
            layout={chatsLayout}
            isOpen={chatsOpen}
            usageSnapshot={usage.snapshot}
            usageUnavailable={usage.unavailable}
            onSelectThread={handleSelectThread}
            onPin={pinThread}
            onArchive={archiveThread}
            onRename={renameThread}
            onDelete={deleteThread}
            onOpenAuthModal={() => {
              setIsAuthModalOpen(true)
              closeChats(false)
            }}
          />
        )}

        {showConversation && (
          <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden relative">
            {/* Header: conversation controls on the left, window controls on the right */}
            <div className="h-12 px-2 border-b border-line-subtle flex items-center justify-between gap-2 shrink-0 select-none relative z-10">
              <div className="flex items-center gap-0.5 min-w-0 flex-1">
                {!chatsOpen && (
                  <button
                    ref={chatsButtonRef}
                    type="button"
                    onClick={handleToggleChats}
                    className={headerButton}
                    title="Open chats"
                    aria-label="Open chats"
                    aria-expanded={false}
                    aria-controls={chatsPanelId}
                  >
                    <PanelLeftOpen className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}

                {activeThreadTitle && (
                  <span
                    className="ml-1.5 text-sm font-medium text-ink truncate pointer-events-none"
                    title={activeThreadTitle}
                  >
                    {activeThreadTitle}
                  </span>
                )}
              </div>

              <div
                className="flex items-center gap-0.5 shrink-0 pointer-events-auto"
                onPointerDown={(e) => e.stopPropagation()}
              >
                {windowControls}
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

            {isNewChat ? (
              <div className="flex-1 overflow-y-auto min-h-0 relative">
                <NewChatScreen
                  isGuest={isGuest}
                  onSubmit={handlePromptSubmit}
                  disabled={isSending || usage.blocked}
                  onOpenAuthModal={() => setIsAuthModalOpen(true)}
                  shortcuts={DEFAULT_PROMPT_SHORTCUTS}
                  composer={isPhone || !isNarrow ? composer('inline') : undefined}
                  composerPosition={isPhone ? 'top' : 'center'}
                />
              </div>
            ) : (
              <div className="flex-1 min-h-0 relative flex flex-col">
                <Conversation
                  ref={conversationRef}
                  onScroll={handleConversationScroll}
                  className="flex-1 min-h-0"
                  aria-live="polite"
                  aria-busy={isSending}
                >
                  <ConversationContent>
                    {messages.map((msg) => {
                      const isAssistant = msg.role === 'assistant'
                      const isStreamingThis = isSending && msg.id === lastAssistantId
                      const showGuestNudge =
                        isAssistant && (msg.isGuest || isGuest) && Boolean(msg.content) && msg.id === lastAssistantId
                      const actions = msg.failedError ? (
                        <>
                          <MessageRetryButton onRetry={() => handleRetryFailed(msg.id)} />
                          <button
                            type="button"
                            onClick={() => handleEditFailed(msg.id)}
                            className="inline-flex items-center h-7 px-1.5 rounded-control text-[11px] text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                          >
                            Edit
                          </button>
                        </>
                      ) : isAssistant && msg.content && !isStreamingThis ? (
                        <MessageCopyButton text={msg.content} />
                      ) : undefined

                      return (
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
                          actions={actions}
                          actionsAlwaysVisible={Boolean(msg.failedError)}
                        >
                          <MessageContent>
                            {msg.role === 'user' ? (
                              msg.content
                            ) : msg.content ? (
                              <MessageResponse>
                                {isStreamingThis ? withStreamingCursor(msg.content) : msg.content}
                              </MessageResponse>
                            ) : msg.stopped ? null : (
                              <MessageThinkingDots />
                            )}
                            {msg.stopped && (
                              <p className="text-[11px] text-ink-muted">
                                {msg.content ? 'Stopped.' : 'Stopped before a reply came through.'}
                              </p>
                            )}
                            {showGuestNudge && (
                              <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-surface-2 px-3 py-2 rounded-control border border-line-subtle">
                                <div className="text-[11px] text-ink-body font-sans flex items-center gap-1.5 min-w-0">
                                  <Shield className="w-3 h-3 text-cyan-glow shrink-0" />
                                  <span>Sign up free for full answers and saved chats.</span>
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
                          {msg.failedError && (
                            <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-[11px] text-crimson-text">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{msg.failedError}</span>
                            </p>
                          )}
                        </Message>
                      )
                    })}
                  </ConversationContent>
                </Conversation>

                {isAwayFromBottom && (
                  <button
                    type="button"
                    onClick={handleJumpToLatest}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-surface-2 border border-line shadow-menu text-xs text-ink-body hover:text-ink hover:border-line-hover transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow animate-in fade-in slide-in-from-bottom-1 duration-150"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>Jump to latest</span>
                  </button>
                )}
              </div>
            )}

            {(!isNewChat || (isNarrow && !isPhone)) && <div className="shrink-0">{composer('docked')}</div>}
          </div>
        )}
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

