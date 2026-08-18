import React, { useState, useEffect, useRef } from 'react'
import {
  BrainCircuit,
  X,
  RefreshCw,
  AlertCircle,
  Minimize2,
  PanelRight,
  Maximize2,
  ChevronDown,
  Shield,
  UserPlus,
  RotateCcw,
} from 'lucide-react'
import { Conversation, ConversationContent } from '../ai-elements/conversation'
import { Message, MessageContent, MessageResponse } from '../ai-elements/message'
import { PromptInput } from '../ai-elements/prompt-input'
import { sendChatMessageFn, getAIMessagesFn } from '../../lib/server/api'
import { useSafeOracle, OracleMode } from '../hud/OracleContext'
import { ORACLE_MODELS, DEFAULT_ORACLE_MODEL_ID, getOracleModel } from '../../lib/ai/oracle-models'
import { AuthModal } from '../AuthModal'
import { BenthicCTAButton } from '../hud/BenthicCTAButton'

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
  onResetLayout?: () => void
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  isGuest?: boolean
}

const DEFAULT_PROMPT_SHORTCUTS = [
  { label: '🦞 What is Moltology?', prompt: 'What is Moltology and why should I molt?' },
  { label: '⚡ How to level up', prompt: 'How do I earn Molt Credits and upgrade my shell?' },
  { label: '🛡️ Stop hesitating', prompt: 'How do I stop hesitating and build emotional resilience?' },
]

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
  onResetLayout,
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
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
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
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

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
      className={`flex flex-col bg-[#080d0d] border border-cyan-900/60 shadow-2xl font-mono overflow-hidden h-full w-full ${className}`}
    >
      {/* Shared Simplified Header */}
      <div
        className={`bg-[#0b1010] border-b border-cyan-900/50 px-3 py-2 flex items-center justify-between gap-2 shrink-0 select-none ${
          isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        {...headerDragProps}
      >
        {/* Left Section: Icon, Title & Model Pill */}
        <div className="flex items-center space-x-2 min-w-0 flex-1 truncate">
          <BrainCircuit className="w-4 h-4 text-cyan-400 animate-pulse shrink-0 pointer-events-none" />
          <span className="text-xs font-bold text-cyan-300 tracking-wider truncate pointer-events-none hidden xs:inline">
            {personaName}
          </span>

          {/* Model Selector */}
          <div
            className="relative pointer-events-auto shrink-0"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModelMenuOpen((v) => !v)}
              className="flex items-center gap-1 bg-[#040707] border border-cyan-900/70 px-2 py-0.5 chamfer-corner text-[10px] text-cyan-200 hover:border-cyan-500/70 transition-all max-w-[130px]"
              title="Select Oracle model"
            >
              <span>{selectedModel.label}</span>
              <ChevronDown className="w-3 h-3 text-cyan-500 shrink-0" />
            </button>

            {modelMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setModelMenuOpen(false)} />
                <div className="absolute left-0 top-full mt-1 z-50 bg-[#0b1010] border border-cyan-900/70 shadow-xl shadow-cyan-950/80 chamfer-corner py-1 min-w-44">
                  {ORACLE_MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedModelId(m.id)
                        setModelMenuOpen(false)
                      }}
                      className={`w-full text-left px-2.5 py-1.5 flex items-center gap-2 text-[11px] transition-colors ${
                        m.id === selectedModelId
                          ? 'bg-cyan-950 text-cyan-200'
                          : 'text-gray-300 hover:bg-cyan-950/50'
                      }`}
                    >
                      <span className="truncate">{m.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mode Switcher & Panel Controls */}
        <div
          className="flex items-center space-x-1 shrink-0 pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {showModeControls && oracle && (
            <div className="flex items-center bg-[#040707] border border-cyan-900/70 p-0.5 chamfer-corner space-x-0.5">
              <button
                onClick={() => handleModeSwitch('popout')}
                className={`p-1 transition-all rounded-none ${
                  oracle.mode === 'popout'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/80 shadow-[0_0_8px_rgba(0,195,255,0.4)]'
                    : 'text-gray-400 hover:text-cyan-300 hover:bg-cyan-950/40'
                }`}
                title="Popout Overlay Widget"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleModeSwitch('sidebar')}
                className={`p-1 transition-all rounded-none ${
                  oracle.mode === 'sidebar'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/80 shadow-[0_0_8px_rgba(0,195,255,0.4)]'
                    : 'text-gray-400 hover:text-cyan-300 hover:bg-cyan-950/40'
                }`}
                title="Dock to Right Sidebar"
              >
                <PanelRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleModeSwitch('page')}
                className={`p-1 transition-all rounded-none ${
                  oracle.mode === 'page'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/80 shadow-[0_0_8px_rgba(0,195,255,0.4)]'
                    : 'text-gray-400 hover:text-cyan-300 hover:bg-cyan-950/40'
                }`}
                title="Expand to Full Dedicated Page"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {onResetLayout && (
            <button
              onClick={onResetLayout}
              className="text-gray-400 hover:text-cyan-300 p-1 transition-colors"
              title="Reset Window Position & Size"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setMessages([buildInitialWelcome()])}
            className="text-gray-400 hover:text-cyan-300 p-1 transition-colors"
            title="Reset Conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-red-400 p-1 transition-colors"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Prompt Shortcuts */}
      <div
        className="px-3 py-1.5 bg-[#050808] border-b border-cyan-950 flex gap-1.5 overflow-x-auto text-[10px] no-scrollbar shrink-0"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {DEFAULT_PROMPT_SHORTCUTS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handlePromptSubmit({ text: item.prompt })}
            className="bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-800/40 text-cyan-300 px-2 py-0.5 whitespace-nowrap transition-all chamfer-corner"
          >
            {item.label}
          </button>
        ))}
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
                    <div className="text-[10.5px] text-red-200/90 font-mono flex items-center gap-1.5 min-w-0">
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
              <BrainCircuit className="w-4 h-4 animate-spin text-cyan-400" />
              <span className="animate-pulse text-[11px]">
                Synthesizing response via {selectedModel.label}...
              </span>
            </div>
          )}
          <div ref={endRef} />
        </ConversationContent>
      </Conversation>

      {/* Input Box */}
      <div className="shrink-0">
        <PromptInput onSubmit={handlePromptSubmit} status={isSending ? 'streaming' : 'ready'} />
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
