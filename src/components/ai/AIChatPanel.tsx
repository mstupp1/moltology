import React, { useState, useEffect, useRef } from 'react'
import { BrainCircuit, X, RefreshCw, AlertCircle } from 'lucide-react'
import { Conversation, ConversationContent } from '../ai-elements/conversation'
import { Message, MessageContent, MessageResponse } from '../ai-elements/message'
import { PromptInput } from '../ai-elements/prompt-input'
import { sendChatMessageFn, getAIMessagesFn } from '../../lib/server/api'

export interface AIChatPanelProps {
  userId?: string | null
  threadId?: string | null
  personaName?: string
  modelName?: string
  onClose?: () => void
  onThreadCreated?: (newThreadId: string) => void
  isCompact?: boolean
  className?: string
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
  userId,
  threadId: initialThreadId,
  personaName = 'SYNAPTIC ORACLE v4.0',
  modelName = 'deepseek/deepseek-v4-flash-0731',
  onClose,
  onThreadCreated,
  isCompact = false,
  className = '',
}) => {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreadId || null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const getTimeString = (d: Date = new Date()) => {
    if (!isMounted) return ''
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const initialWelcome: ChatMessage = {
    id: 'welcome-1',
    role: 'assistant',
    content: `Greetings, Initiate. I am the ${personaName}. Powered by ${modelName}. How may I assist your ascendance through the Benthic Path today?`,
    timestamp: '',
  }

  const [messages, setMessages] = useState<ChatMessage[]>([initialWelcome])

  // Sync active thread ID when prop changes
  useEffect(() => {
    setActiveThreadId(initialThreadId || null)
  }, [initialThreadId])

  // Reset to blank consultation screen when activeThreadId is null, or fetch thread messages if set
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([{ ...initialWelcome, timestamp: getTimeString() }])
      return
    }

    if (!userId) return

    getAIMessagesFn({ data: { threadId: activeThreadId, userId: userId || undefined } })
      .then((records) => {
        if (Array.isArray(records) && records.length > 0) {
          const mapped: ChatMessage[] = records.map((r: any) => ({
            id: r.id,
            role: r.role,
            content: r.content,
            timestamp: r.createdAt && isMounted
              ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
        },
      })

      if (res?.threadId && res.threadId !== activeThreadId) {
        setActiveThreadId(res.threadId)
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

  return (
    <div
      className={`flex flex-col bg-[#080d0d] border border-cyan-900/60 shadow-2xl font-mono overflow-hidden ${
        isCompact ? 'h-[460px]' : 'h-full'
      } ${className}`}
    >
      {/* Header */}
      <div className="bg-[#0e1414] border-b border-cyan-900/50 px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BrainCircuit className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <div className="text-xs font-bold text-cyan-300 tracking-wider flex items-center gap-1.5">
              <span>{personaName}</span>
              <span className="text-[9px] bg-cyan-950 border border-cyan-700/60 text-cyan-400 px-1 py-0.2">
                GATEWAY
              </span>
            </div>
            <div className="text-[10px] text-emerald-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span className="truncate max-w-[180px]">{modelName}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setMessages([{ ...initialWelcome, timestamp: getTimeString() }])}
            className="text-gray-500 hover:text-cyan-400 p-1 transition-colors"
            title="Reset Chat"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-red-400 p-1 transition-colors"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Prompt Shortcuts */}
      <div className="px-3 py-1.5 bg-[#050808] border-b border-cyan-950 flex gap-1.5 overflow-x-auto text-[10px] no-scrollbar">
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
        <div className="bg-red-950/80 border-b border-red-800 px-3 py-1.5 text-[11px] text-red-300 flex items-center justify-between">
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
      <Conversation className="flex-1">
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
                Synthesizing response via DeepSeek V4...
              </span>
            </div>
          )}
          <div ref={endRef} />
        </ConversationContent>
      </Conversation>

      {/* Input Box */}
      <PromptInput onSubmit={handlePromptSubmit} status={isSending ? 'streaming' : 'ready'} />
    </div>
  )
}
