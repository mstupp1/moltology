import React, { useState } from 'react'
import { Send, Mic, Sparkles, Loader2 } from 'lucide-react'

export interface PromptInputProps {
  onSubmit: (message: { text: string }) => void
  status?: 'ready' | 'submitted' | 'streaming' | 'error' | string
  placeholder?: string
  disabled?: boolean
  className?: string
}

export const PromptInput: React.FC<PromptInputProps> = ({
  onSubmit,
  status = 'ready',
  placeholder = 'Ask the Oracle...',
  disabled = false,
  className = '',
}) => {
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || disabled || status === 'streaming') return
    onSubmit({ text: text.trim() })
    setText('')
  }

  const isStreaming = status === 'streaming'

  return (
    <form
      onSubmit={handleSubmit}
      className={`p-2 bg-[#0a0f0f] border-t border-cyan-900/50 flex items-center space-x-2 ${className}`}
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || isStreaming}
        className="flex-1 bg-[#040808] border border-cyan-950 focus:border-cyan-500 text-cyan-100 placeholder-cyan-800 text-xs px-3 py-2 focus:outline-none chamfer-corner transition-colors"
      />
      <button
        type="button"
        className="p-2 text-cyan-600 hover:text-cyan-400 transition-colors"
        title="Voice Dictation"
      >
        <Mic className="w-4 h-4" />
      </button>
      <button
        type="submit"
        disabled={disabled || isStreaming || !text.trim()}
        className="bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-600/70 p-2 disabled:opacity-40 transition-colors flex items-center justify-center chamfer-corner"
      >
        {isStreaming ? (
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </form>
  )
}
