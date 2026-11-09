import React from 'react'
import { Link } from '@tanstack/react-router'
import { BookOpen } from 'lucide-react'
import { codexVerseAnchor, type AlignmentCodexRef } from '@/lib/alignment-tasks'
import { cn } from '@/lib/utils'

interface AlignmentCodexLinkProps {
  codex: AlignmentCodexRef
  taskTitle: string
  /** Show the Codex name next to the icon (wide layouts) or the icon alone (narrow panels). */
  showLabel?: boolean
  onNavigate?: () => void
  className?: string
}

/** Opens the Codex verse or scripture behind a daily alignment task. */
export function AlignmentCodexLink({ codex, taskTitle, showLabel = false, onNavigate, className }: AlignmentCodexLinkProps) {
  return (
    <Link
      to="/codex/$slug"
      params={{ slug: codex.slug }}
      hash={codex.verse ? codexVerseAnchor(codex.verse) : undefined}
      onClick={onNavigate}
      title={`${codex.label} in the Codex`}
      aria-label={`Read about ${taskTitle} in the Codex: ${codex.label}`}
      data-testid="alignment-codex-link"
      className={cn(
        'shrink-0 inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-10 px-3 text-[11px] text-ink-muted hover:text-cyan-glow hover:bg-surface-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow',
        className,
      )}
    >
      <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      {showLabel && <span className="truncate max-w-[10rem]">{codex.label}</span>}
    </Link>
  )
}
