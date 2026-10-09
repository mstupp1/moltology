import React from 'react'
import { MarkdownRenderer } from '../ui/MarkdownRenderer'
import { BrandAwareImage, BrandIcon } from '../ui/BrandMark'
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
          <BrandAwareImage
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

    if (!avatarSrc) {
      return <BrandIcon label={senderLabel || 'Oracle'} className="w-3.5 h-3.5 shrink-0" />
    }

    return (
      <BrandAwareImage
        src={avatarSrc}
        alt={senderLabel || 'Oracle'}
        className="w-3.5 h-3.5 object-contain shrink-0"
      />
    )
  }

  const effectiveSenderLabel =
    senderLabel || (isUser ? 'INITIATE' : 'SYNAPTIC ORACLE')

  return (
    <div
      className={`flex flex-col w-full ${isUser ? 'items-end' : 'items-start'} ${className}`}
      {...props}
    >
      <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-ink-muted font-bold uppercase tracking-[0.08em]">
        {renderAvatar()}
        <span>{effectiveSenderLabel}</span>
        {timestamp && <span className="text-ink-muted/80 font-normal">[{timestamp}]</span>}
      </div>
      <div
        className={`max-w-[92%] sm:max-w-[88%] p-3.5 sm:p-4 text-xs sm:text-[13px] leading-[1.7] rounded-card ${
          isUser
            ? 'bg-surface-2 border border-line text-ink'
            : 'bg-surface-1/80 backdrop-blur-sm border border-line-subtle hud-sheen text-ink-body'
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
      className={`flex items-center gap-1.5 py-1 px-0.5 text-cyan-glow select-none ${className}`}
      aria-label="Thinking..."
      role="status"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-glow animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-glow animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-glow animate-bounce" />
      <span className="sr-only">Thinking...</span>
    </div>
  )
}


