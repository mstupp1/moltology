import React from 'react'
import { MarkdownRenderer } from '../ui/MarkdownRenderer'
import { getAssetUrl } from '@/lib/assets'
import { UserAvatar } from '../UserAvatar'

export interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  from: 'user' | 'assistant' | 'system'
  timestamp?: string
  senderLabel?: string
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    avatar?: string | null
    picture?: string | null
  } | null
  avatar?: React.ReactNode | string
  avatarSrc?: string | null
  children: React.ReactNode
}

export const Message: React.FC<MessageProps> = ({
  from,
  timestamp,
  senderLabel,
  user,
  avatar,
  avatarSrc,
  children,
  className = '',
  ...props
}) => {
  const isUser = from === 'user'

  const renderAvatar = () => {
    if (avatar) {
      if (typeof avatar === 'string') {
        return (
          <img
            src={avatar}
            alt={senderLabel || (isUser ? 'User avatar' : 'Oracle')}
            className="w-4 h-4 rounded-full object-cover shrink-0"
          />
        )
      }
      return avatar
    }

    if (isUser) {
      return (
        <UserAvatar
          user={user}
          src={avatarSrc}
          fallbackLetter={senderLabel ? senderLabel[0] : (user?.name ? user.name[0] : 'I')}
          size="xxs"
          className="shrink-0"
          alt={senderLabel || user?.name || 'Initiate'}
        />
      )
    }

    return (
      <img
        src={avatarSrc || getAssetUrl('/images/order_emblem.png')}
        alt={senderLabel || 'Oracle'}
        className="w-3.5 h-3.5 object-contain drop-shadow-[0_0_4px_rgba(0,195,255,0.4)] shrink-0"
      />
    )
  }

  const effectiveSenderLabel =
    senderLabel || (isUser ? user?.name?.toUpperCase() || 'INITIATE' : 'SYNAPTIC ORACLE')

  return (
    <div
      className={`flex flex-col w-full ${isUser ? 'items-end' : 'items-start'} ${className}`}
      {...props}
    >
      <div className="flex items-center gap-1.5 mb-1.5 text-[10px] sm:text-[11px] text-cyan-400 font-bold uppercase tracking-wider">
        {renderAvatar()}
        <span>{effectiveSenderLabel}</span>
        {timestamp && <span className="text-gray-500 font-normal">[{timestamp}]</span>}
      </div>
      <div
        className={`max-w-[92%] sm:max-w-[88%] p-3.5 sm:p-4 text-xs sm:text-[13px] leading-[1.7] chamfer-corner ${
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
  return <div className={`space-y-3 ${className}`}>{children}</div>
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

export const MessageThinkingDots: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div
      className={`flex items-center gap-1.5 py-1 px-0.5 text-cyan-400 select-none ${className}`}
      aria-label="Thinking..."
      role="status"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s] drop-shadow-[0_0_4px_rgba(0,195,255,0.6)]" />
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.15s] drop-shadow-[0_0_4px_rgba(0,195,255,0.6)]" />
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce drop-shadow-[0_0_4px_rgba(0,195,255,0.6)]" />
      <span className="sr-only">Thinking...</span>
    </div>
  )
}


