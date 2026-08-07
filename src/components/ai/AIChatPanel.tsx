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
} from 'lucide-react'
import { Conversation, ConversationContent } from '../ai-elements/conversation'
import { Message, MessageContent, MessageResponse } from '../ai-elements/message'
import { PromptInput } from '../ai-elements/prompt-input'
import { sendChatMessageFn, getAIMessagesFn } from '../../lib/server/api'
import { useSafeOracle, OracleMode } from '../hud/OracleContext'
import { ORACLE_MODELS, DEFAULT_ORACLE_MODEL_ID, getOracleModel } from '../../lib/ai/oracle-models'

export interface AIChatPanelProps {
  userId?: string | null
  threadId?: string | null
  personaName?: string
  onClose?: () => void
  onThreadCreated?: (newThreadId: string) => void
  isCompact?: boolean
  className?: string
  showModeControls?: boolean
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

const DEFAULT_PROMPT_SHORTCUTS = [
  { label: '⚡ Stage 3 Protocol', prompt: 'What are the clearances required for Stage 3 Exoshell?' },
  { label: '📜 Order Doctrine', prompt: 'Explain Article I of the Prime Directive on Carcinization.' },
  { label: '💎 Benthic Market', prompt: 'How do I transmute assets into Molt Credits and Synapse Shards?' },
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
}) => {
  const oracle = useSafeOracle()

  const userId = propUserId !== undefined ? propUserId : oracle?.userId || null
  const activeThreadId =
    oracle?.activeThreadId !== undefined ? oracle.activeThreadId : propThreadId || null

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState<string>(DEFAULT_ORACLE_MODEL_ID)
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const getTimeString = (d: Date = new Date()) => {
    if (!isMounted) return ''
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const selectedModel = getOracleModel(selectedModelId)

  const initialWelcome: ChatMessage = {
    id: 'welcome-1',
    role: 'assistant',
    content: `Greetings, Initiate. I am the ${personaName}. Powered by ${selectedModel.label}. How may I assist your ascendance through the Benthic Path today?`,
    timestamp: '',
  }

  const [messages, setMessages] = useState<ChatMessage[]>([initialWelcome])

  // Reset to welcome screen when activeThreadId is null, or fetch thread messages if set
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([{ ...initialWelcome, timestamp: getTimeString() }])
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
  }, [activeThreadId, userId, isMounted])

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
      className={`flex flex-col bg-[#080d0d] border border-cyan-900/60 shadow-2xl font-mono overflow-hidden ${
        isCompact ? 'h-[480px]' : 'h-full'
      } ${className}`}
    >
      {/* Shared Simplified Header */}
      <div className="bg-[#0b1010] border-b border-cyan-900/50 px-3 py-2 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center space-x-2 min-w-0">
          <BrainCircuit className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs font-bold text-cyan-300 tracking-wider truncate">
              {personaName}
            </span>
          </div>

          {/* Model Selector */}
          <div className="relative">
            <button
              onClick={() => setModelMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 bg-[#040707] border border-cyan-900/70 px-2 py-0.5 chamfer-corner text-[10px] text-cyan-200 hover:border-cyan-500/70 transition-all"
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
        <div className="flex items-center space-x-1 shrink-0">
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

          <button
            onClick={() => setMessages([{ ...initialWelcome, timestamp: getTimeString() }])}
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
      <div className="px-3 py-1.5 bg-[#050808] border-b border-cyan-950 flex gap-1.5 overflow-x-auto text-[10px] no-scrollbar shrink-0">
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
    </div>
  )
}
