import React from 'react'
import { User } from 'lucide-react'
import { MarkdownRenderer } from '../ui/MarkdownRenderer'
import { getAssetUrl } from '@/lib/assets'

export interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  from: 'user' | 'assistant' | 'system'
  timestamp?: string
  senderLabel?: string
  children: React.ReactNode
}

export const Message: React.FC<MessageProps> = ({
  from,
  timestamp,
  senderLabel,
  children,
  className = '',
  ...props
}) => {
  const isUser = from === 'user'

  return (
    <div
      className={`flex flex-col w-full ${isUser ? 'items-end' : 'items-start'} ${className}`}
      {...props}
    >
      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
        {isUser ? (
          <>
            <User className="w-3 h-3 text-cyan-400" />
            <span>{senderLabel || 'INITIATE'}</span>
          </>
        ) : (
          <>
            <img
              src={getAssetUrl('/images/order_emblem.png')}
              alt="Oracle"
              className="w-3.5 h-3.5 object-contain filter hue-rotate-180 brightness-110 drop-shadow-[0_0_4px_rgba(0,195,255,0.5)]"
            />
            <span>{senderLabel || 'SYNAPTIC ORACLE'}</span>
          </>
        )}
        {timestamp && <span className="text-gray-500 font-normal">[{timestamp}]</span>}
      </div>
      <div
        className={`max-w-[88%] p-3 text-xs leading-relaxed chamfer-corner ${
          isUser
            ? 'bg-cyan-950/70 backdrop-blur-xs border border-cyan-600/50 text-cyan-100 shadow-md shadow-cyan-950/40'
            : 'bg-[#0a1214]/80 backdrop-blur-sm border border-cyan-800/45 text-gray-200 shadow-lg shadow-cyan-950/40'
        }`}
      >
        {children}
      </div>
    </div>
  )
}

export const MessageContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`space-y-2 ${className}`}>{children}</div>
}

export const MessageResponse: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  if (typeof children === 'string') {
    return <MarkdownRenderer content={children} className={className} />
  }
  return <div className={`whitespace-pre-wrap ${className}`}>{children}</div>
}
