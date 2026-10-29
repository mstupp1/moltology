import React from 'react'

export interface ConversationProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const Conversation = React.forwardRef<HTMLDivElement, ConversationProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex flex-col flex-1 overflow-y-auto px-4 py-5 sm:px-6 font-sans text-sm bg-transparent select-text ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Conversation.displayName = 'Conversation'

export const ConversationContent: React.FC<ConversationProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`space-y-6 w-full max-w-3xl mx-auto ${className}`} {...props}>
      {children}
    </div>
  )
}
