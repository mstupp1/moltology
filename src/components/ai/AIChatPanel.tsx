import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Pencil,
  AlertCircle,
  Minimize2,
  Maximize2,
  PanelRight,
  MessageSquare,
  Shield,
  UserPlus,
} from 'lucide-react'
import { Conversation, ConversationContent } from '../ai-elements/conversation'
import { Message, MessageContent, MessageResponse } from '../ai-elements/message'
import { PromptInput } from '../ai-elements/prompt-input'
import { NewChatScreen, DEFAULT_PROMPT_SHORTCUTS } from './NewChatScreen'
import { sendChatMessageFn, getAIMessagesFn } from '../../lib/server/api'
import { useSafeOracle, OracleMode } from '../hud/OracleContext'
import { ORACLE_MODELS, DEFAULT_ORACLE_MODEL_ID, getOracleModel } from '../../lib/ai/oracle-models'
import { AuthModal } from '../AuthModal'
import { BenthicCTAButton } from '../hud/BenthicCTAButton'
import { getAssetUrl } from '../../lib/assets'

export interface AIChatPanelProps {
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

  const userId = propUserId !== undefined ? propUserId : oracle?.userId || null
  const isGuest = !userId
  const activeThreadId =
    oracle?.activeThreadId !== undefined ? oracle.activeThreadId : propThreadId || null

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState<string>(DEFAULT_ORACLE_MODEL_ID)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const getTimeString = (d: Date = new Date()) => {
    if (!isMounted) return ''
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const selectedModel = getOracleModel(selectedModelId)

  const buildInitialWelcome = (): ChatMessage => ({
    id: 'welcome-1',
    role: 'assistant',
    content: isGuest
      ? `Welcome! I am the ${personaName}. You're currently exploring in Guest Mode, so answers are brief and chats aren't saved. Sign up for free to unlock full guidance and save your history!`
      : `Welcome back! I am the ${personaName}. What would you like to explore or improve today?`,
    timestamp: getTimeString(),
    isGuest: false,
  })

  const [messages, setMessages] = useState<ChatMessage[]>([buildInitialWelcome()])

  // Check if current conversation has active user messages
  const hasUserMessages = messages.some((m) => m.role === 'user')

  // Reset to welcome screen when activeThreadId is null, or fetch thread messages if set
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([buildInitialWelcome()])
      return
    }

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
        }
      })
      .catch((err) => console.warn('Failed to load thread messages:', err))
  }, [activeThreadId, userId, isMounted, isGuest, selectedModelId])

  // Auto scroll to bottom
  useEffect(() => {
    if (hasUserMessages) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isSending, hasUserMessages])

  const handlePromptSubmit = async ({ text }: { text: string }) => {
    setErrorMessage(null)
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: getTimeString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setIsSending(true)

    try {
      const payloadMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await sendChatMessageFn({
        data: {
          messages: payloadMessages,
          userId: userId || undefined,
          threadId: activeThreadId || undefined,
          model: selectedModelId,
        },
      })

      if (res?.threadId && res.threadId !== activeThreadId) {
        if (oracle) {
          oracle.setActiveThreadId(res.threadId)
          oracle.refreshThreads()
        }
        if (onThreadCreated) {
          onThreadCreated(res.threadId)
        }
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res?.text || 'The Oracle acknowledges your query.',
        timestamp: getTimeString(),
        isGuest: Boolean((res as any)?.isGuest || isGuest),
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      setErrorMessage(err.message || 'Transmission interrupted. Please check network/guardrails.')
    } finally {
      setIsSending(false)
    }
  }

  const handleModeSwitch = (targetMode: OracleMode) => {
    if (oracle) {
      oracle.setMode(targetMode)
    }
  }

  const handleNewChat = () => {
    if (oracle) {
      oracle.setActiveThreadId(null)
    }
    setMessages([buildInitialWelcome()])
    setErrorMessage(null)
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
      className={`flex flex-col bg-[#070c0e]/60 backdrop-blur-md border border-cyan-900/40 shadow-2xl font-sans overflow-hidden h-full w-full ${className}`}
    >
      {/* Shared Simplified Header */}
      <div
        className={`bg-[#070c0e]/75 backdrop-blur-md border-b border-cyan-900/40 px-3 py-2 flex items-center justify-between gap-2 shrink-0 select-none ${
          isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        {...headerDragProps}
      >
        {/* Left Section: Icon, Title & Model Pill */}
        <div className="flex items-center space-x-2 min-w-0 flex-1 truncate">
          {onToggleConversations && (
            <button
              type="button"
              onClick={onToggleConversations}
              className="flex items-center gap-1.5 bg-[#040707] hover:bg-cyan-950/70 text-cyan-400 hover:text-cyan-200 border border-cyan-800/60 hover:border-cyan-500/70 px-2 py-1 chamfer-corner text-xs font-medium md:hidden transition-colors shrink-0 select-none shadow-sm cursor-pointer"
              title="View Conversations"
              aria-label="Toggle Conversations"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold tracking-wider uppercase hidden xs:inline">
                Conversations
              </span>
            </button>
          )}

          <img
            src={getAssetUrl('/images/order_emblem.png')}
            alt="Oracle"
            className="w-4 h-4 object-contain filter hue-rotate-180 brightness-110 drop-shadow-[0_0_6px_rgba(0,195,255,0.6)] shrink-0 pointer-events-none"
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
        <div className="flex-1 overflow-y-auto min-h-0">
          <NewChatScreen
            userId={userId}
            isGuest={isGuest}
            selectedModel={selectedModel}
            onSelectModel={(id) => setSelectedModelId(id)}
            onSubmit={handlePromptSubmit}
            isSending={isSending}
            personaName={personaName}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            shortcuts={DEFAULT_PROMPT_SHORTCUTS}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Message Canvas */}
          <Conversation className="flex-1 min-h-0">
            <ConversationContent>
              {messages.map((msg) => (
                <Message
                  key={msg.id}
                  from={msg.role === 'user' ? 'user' : 'assistant'}
                  timestamp={msg.timestamp}
                >
                  <MessageContent>
                    <MessageResponse>{msg.content}</MessageResponse>
                    {msg.role === 'assistant' && (msg.isGuest || isGuest) && (
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
              {isSending && (
                <div className="flex items-center space-x-2 text-cyan-400 text-xs py-1">
                  <img
                    src={getAssetUrl('/images/order_emblem.png')}
                    alt="Oracle synthesizing"
                    className="w-4 h-4 object-contain filter hue-rotate-180 brightness-110 animate-spin drop-shadow-[0_0_6px_rgba(0,195,255,0.6)]"
                  />
                  <span className="animate-pulse text-[11px]">
                    Synthesizing response via {selectedModel.label}...
                  </span>
                </div>
              )}
              <div ref={endRef} />
            </ConversationContent>
          </Conversation>

          {/* Active Conversation Input Box */}
          <div className="shrink-0">
            <PromptInput
              onSubmit={handlePromptSubmit}
              status={isSending ? 'streaming' : 'ready'}
              selectedModel={selectedModel}
              onSelectModel={(id) => setSelectedModelId(id)}
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

