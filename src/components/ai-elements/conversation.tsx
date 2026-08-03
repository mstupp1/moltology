import React from 'react'

export interface ConversationProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const Conversation: React.FC<ConversationProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`flex flex-col flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs bg-sacred-grid ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export const ConversationContent: React.FC<ConversationProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`space-y-4 w-full ${className}`} {...props}>
      {children}
    </div>
  )
}
