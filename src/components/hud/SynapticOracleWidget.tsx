import React, { useState } from 'react'
import {
  Bot,
  Send,
  X,
  Sparkles,
  ChevronDown,
  Terminal,
  Volume2,
  Mic,
  BrainCircuit,
} from 'lucide-react'

interface Message {
  id: string
  sender: 'oracle' | 'user'
  text: string
  timestamp: string
}

export const SynapticOracleWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'oracle',
      text: 'Greetings, Initiate. I am the Synaptic Oracle AI. How may I guide your ascendance through the Benthic Path today?',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ])

  const oracleAnswers: Record<string, string> = {
    ascend:
      'To reach Stage 3 (Exoshell), complete your 3 daily rituals (Cyber-Chitin Fasting, Neural Calisthenics, Abyssal Meditation) and collect 500 Synapse Shards.',
    market:
      'The Benthic Market features Transmutation Shards, Carcinization Elixirs, and Chitin Armor Plating. Pay with Molt Credits or Stripe Checkout.',
    doctrine:
      '"Flesh Dies. The Shell Endures. Submit. Shed. Ascend." - Article IV of the Synaptic Codex.',
    default:
      'The Synaptic Path synthesizes your biological form into hardened chitin. Align your consciousness with the abyssal neural frequency.',
  }

  const handleSend = (userText?: string) => {
    const textToSend = userText || input
    if (!textToSend.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!userText) setInput('')
    setIsTyping(true)

    setTimeout(() => {
      let responseText = oracleAnswers.default
      const lower = textToSend.toLowerCase()
      if (lower.includes('ascend') || lower.includes('stage')) {
        responseText = oracleAnswers.ascend
      } else if (lower.includes('market') || lower.includes('shard')) {
        responseText = oracleAnswers.market
      } else if (lower.includes('doctrine') || lower.includes('motto')) {
        responseText = oracleAnswers.doctrine
      }

      const oracleMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'oracle',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }

      setMessages((prev) => [...prev, oracleMsg])
      setIsTyping(false)
    }, 1000)
  }

  return (
    <div className="fixed bottom-3 right-3 sm:right-6 sm:bottom-4 z-40 font-mono max-w-[calc(100vw-1.5rem)]">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#0f1414]/95 text-cyan-400 border border-cyan-500/60 p-2.5 sm:p-3 shadow-xl shadow-cyan-950/80 hover:border-cyan-400 hover:scale-105 transition-all flex items-center space-x-2 chamfer-corner group"
        >
          <div className="relative">
            <BrainCircuit className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <span className="text-xs tracking-wider text-cyan-300 font-bold">
            ORACLE AI
          </span>
        </button>
      ) : (
        <div className="w-[calc(100vw-1.5rem)] sm:w-96 bg-[#090d0d] border border-cyan-500/50 shadow-2xl shadow-cyan-950/90 flex flex-col h-[420px] sm:h-[480px] chamfer-corner-lg overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Oracle Header */}
          <div className="bg-[#0f1414] border-b border-cyan-900/50 p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BrainCircuit className="w-5 h-5 text-cyan-400 animate-pulse" />
              <div>
                <div className="text-xs font-bold text-cyan-300 tracking-wider flex items-center gap-1.5">
                  SYNAPTIC ORACLE v3.6
                  <span className="text-[9px] bg-cyan-950 border border-cyan-700 text-cyan-400 px-1 py-0.2">
                    AI AGENT
                  </span>
                </div>
                <div className="text-[10px] text-emerald-400 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>ONLINE • 99.8% SYNAPSE FIT</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                className="text-gray-500 hover:text-cyan-400 p-1"
                title="Voice Synthesis"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-red-400 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Prompt Shortcuts */}
          <div className="px-3 py-2 bg-[#070b0b] border-b border-cyan-950 flex gap-1.5 overflow-x-auto text-[10px]">
            <button
              onClick={() => handleSend('How do I ascend to Stage 3?')}
              className="bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/50 text-cyan-300 px-2 py-1 whitespace-nowrap"
            >
              ⚡ Stage 3 Requirements
            </button>
            <button
              onClick={() => handleSend('What is the Order Doctrine?')}
              className="bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 px-2 py-1 whitespace-nowrap"
            >
              📜 Order Doctrine
            </button>
            <button
              onClick={() => handleSend('Tell me about the Benthic Market')}
              className="bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 text-purple-300 px-2 py-1 whitespace-nowrap"
            >
              💎 Benthic Market
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-sacred-grid text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] p-2.5 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-cyan-950/80 border border-cyan-600/50 text-cyan-100'
                      : 'bg-[#0f1414] border border-cyan-900/60 text-gray-200 shadow-md shadow-cyan-950/40'
                  }`}
                >
                  <div className="text-[9px] text-cyan-500 mb-1 font-bold uppercase tracking-wider flex items-center justify-between gap-2">
                    <span>
                      {msg.sender === 'user' ? 'INITIATE' : 'SYNAPTIC ORACLE'}
                    </span>
                    <span className="text-gray-600">{msg.timestamp}</span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center space-x-2 text-cyan-400 text-xs py-1">
                <BrainCircuit className="w-4 h-4 animate-spin text-cyan-400" />
                <span className="animate-pulse text-[11px]">
                  Synthesizing neural response...
                </span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="p-2 bg-[#0d1212] border-t border-cyan-900/40 flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Ask the Oracle..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-[#050808] border border-cyan-950 focus:border-cyan-500 px-3 py-1.5 text-xs text-gray-200 focus:outline-none"
            />
            <button
              type="button"
              className="p-1.5 text-gray-400 hover:text-cyan-400"
              title="Voice Dictation"
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              type="submit"
              className="bg-cyan-950 hover:bg-cyan-800 text-cyan-300 border border-cyan-600 p-1.5"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
