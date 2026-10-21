import React, { useEffect, useRef, useState } from 'react'
import { Check, Copy, RotateCcw } from 'lucide-react'
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
  /** Hover row under the message (copy, retry). Always visible on touch screens. */
  actions?: React.ReactNode
  actionsAlwaysVisible?: boolean
  children: React.ReactNode
}

export const Message: React.FC<MessageProps> = ({
  from,
  timestamp,
  senderLabel,
  user,
  avatar,
  avatarSrc,
  actions,
  actionsAlwaysVisible = false,
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
      className={`group/message flex flex-col w-full ${isUser ? 'items-end' : 'items-start'} ${className}`}
      {...props}
    >
      {/* Member turns read as a plain bubble, like most chat apps; the name stays for screen readers. */}
      <div
        className={
          isUser
            ? 'sr-only'
            : 'flex items-center gap-1.5 mb-1.5 text-[11px] text-ink-muted font-bold uppercase tracking-[0.08em]'
        }
      >
        {renderAvatar()}
        <span>{effectiveSenderLabel}</span>
      </div>
      <div
        title={timestamp || undefined}
        className={
          isUser
            ? 'max-w-[88%] sm:max-w-[80%] px-3.5 py-2.5 text-sm leading-relaxed rounded-card bg-surface-2 border border-line-subtle text-ink whitespace-pre-wrap break-words'
            : 'w-full min-w-0 text-sm leading-[1.7] text-ink-body'
        }
      >
        {children}
      </div>
      {actions && (
        <div
          className={`mt-1 flex items-center gap-0.5 transition-opacity ${
            actionsAlwaysVisible
              ? 'opacity-100'
              : 'opacity-0 group-hover/message:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100'
          }`}
        >
          {actions}
        </div>
      )}
    </div>
  )
}

const ACTION_BUTTON_CLASSES =
  'inline-flex items-center gap-1 h-7 px-1.5 rounded-control text-[11px] text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

export const MessageCopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={ACTION_BUTTON_CLASSES}
      aria-label={copied ? 'Copied' : 'Copy message'}
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      <span className="sr-only sm:not-sr-only">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}

export const MessageRetryButton: React.FC<{ onRetry: () => void; label?: string }> = ({
  onRetry,
  label = 'Retry',
}) => (
  <button type="button" onClick={onRetry} className={ACTION_BUTTON_CLASSES} aria-label={label} title={label}>
    <RotateCcw className="w-3.5 h-3.5" />
    <span>{label}</span>
  </button>
)

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

/** Adds a cursor block to a reply while it streams, unless that would land inside a code fence. */
export function withStreamingCursor(content: string): string {
  const fences = content.match(/```/g)?.length ?? 0
  return fences % 2 === 1 ? content : `${content} ▍`
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


