import React from 'react'
import { Bold, Italic, Code, Link2, Quote, List, Eye, EyeOff } from 'lucide-react'

export type FormattingType = 'bold' | 'italic' | 'code' | 'link' | 'quote' | 'list'

export interface ForumFormattingToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (value: string) => void
  preview: boolean
  onTogglePreview: () => void
  className?: string
  disabled?: boolean
}

/**
 * Applies markdown syntax to the current selection in a textarea, or inserts
 * an actionable template when no text is selected.
 */
export function applyFormatting(
  textarea: HTMLTextAreaElement,
  formatType: FormattingType,
  onChange: (value: string) => void,
) {
  const start = textarea.selectionStart ?? 0
  const end = textarea.selectionEnd ?? 0
  const value = textarea.value
  const selectedText = value.substring(start, end)

  let prefix = ''
  let suffix = ''
  let defaultPlaceholder = ''
  let isLinePrefix = false

  switch (formatType) {
    case 'bold':
      prefix = '**'
      suffix = '**'
      defaultPlaceholder = 'bold text'
      break
    case 'italic':
      prefix = '*'
      suffix = '*'
      defaultPlaceholder = 'italic text'
      break
    case 'code':
      if (selectedText.includes('\n')) {
        prefix = '```\n'
        suffix = '\n```'
        defaultPlaceholder = 'code'
      } else {
        prefix = '`'
        suffix = '`'
        defaultPlaceholder = 'code'
      }
      break
    case 'link':
      prefix = '['
      suffix = '](https://)'
      defaultPlaceholder = 'link text'
      break
    case 'quote':
      isLinePrefix = true
      prefix = '> '
      defaultPlaceholder = 'quote'
      break
    case 'list':
      isLinePrefix = true
      prefix = '- '
      defaultPlaceholder = 'item'
      break
  }

  let newText = ''
  let newSelectionStart = start
  let newSelectionEnd = end

  if (isLinePrefix) {
    const beforeSelection = value.substring(0, start)
    const lineStart = beforeSelection.lastIndexOf('\n') + 1
    const afterSelection = value.substring(end)
    const lineEndOffset = afterSelection.indexOf('\n')
    const lineEnd = lineEndOffset === -1 ? value.length : end + lineEndOffset
    const affectedText = value.substring(lineStart, lineEnd)

    const lines = (affectedText || defaultPlaceholder).split('\n')
    const formattedLines = lines.map((l) => (l.startsWith(prefix) ? l : `${prefix}${l}`)).join('\n')

    newText = value.substring(0, lineStart) + formattedLines + value.substring(lineEnd)
    newSelectionStart = lineStart
    newSelectionEnd = lineStart + formattedLines.length
  } else {
    if (selectedText) {
      newText = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end)
      newSelectionStart = start + prefix.length
      newSelectionEnd = start + prefix.length + selectedText.length
    } else {
      newText = value.substring(0, start) + prefix + defaultPlaceholder + suffix + value.substring(end)
      newSelectionStart = start + prefix.length
      newSelectionEnd = start + prefix.length + defaultPlaceholder.length
    }
  }

  onChange(newText)

  requestAnimationFrame(() => {
    textarea.focus()
    textarea.setSelectionRange(newSelectionStart, newSelectionEnd)
  })
}

/**
 * Handles standard formatting keyboard shortcuts:
 * - Ctrl/Cmd + B: Bold
 * - Ctrl/Cmd + I: Italic
 * - Ctrl/Cmd + K: Link
 */
export function handleFormattingShortcuts(
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  textarea: HTMLTextAreaElement | null,
  onChange: (value: string) => void,
): boolean {
  if (!textarea) return false
  if (!(e.ctrlKey || e.metaKey)) return false

  const key = e.key.toLowerCase()
  if (key === 'b') {
    e.preventDefault()
    applyFormatting(textarea, 'bold', onChange)
    return true
  }
  if (key === 'i') {
    e.preventDefault()
    applyFormatting(textarea, 'italic', onChange)
    return true
  }
  if (key === 'k') {
    e.preventDefault()
    applyFormatting(textarea, 'link', onChange)
    return true
  }
  return false
}

export function ForumFormattingToolbar({
  textareaRef,
  value: _value,
  onChange,
  preview,
  onTogglePreview,
  className = '',
  disabled = false,
}: ForumFormattingToolbarProps) {
  const handleAction = (type: FormattingType) => {
    if (disabled || preview || !textareaRef.current) return
    applyFormatting(textareaRef.current, type, onChange)
  }

  const buttonBaseClass =
    'p-1.5 text-ink-muted hover:text-ink hover:bg-surface-2 rounded-control transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow disabled:opacity-40 disabled:pointer-events-none'

  return (
    <div
      className={`flex items-center justify-between px-2 py-1 bg-surface-1 border border-line border-b-0 rounded-t-control text-xs select-none ${className}`}
      data-testid="forum-formatting-toolbar"
    >
      {/* Formatting Tools Strip */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        <button
          type="button"
          onClick={() => handleAction('bold')}
          disabled={disabled || preview}
          className={buttonBaseClass}
          aria-label="Bold (Ctrl+B)"
          title="Bold (Ctrl+B)"
          data-testid="forum-format-bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => handleAction('italic')}
          disabled={disabled || preview}
          className={buttonBaseClass}
          aria-label="Italic (Ctrl+I)"
          title="Italic (Ctrl+I)"
          data-testid="forum-format-italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => handleAction('code')}
          disabled={disabled || preview}
          className={buttonBaseClass}
          aria-label="Code"
          title="Inline code or code block"
          data-testid="forum-format-code"
        >
          <Code className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => handleAction('link')}
          disabled={disabled || preview}
          className={buttonBaseClass}
          aria-label="Link (Ctrl+K)"
          title="Link (Ctrl+K)"
          data-testid="forum-format-link"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-3.5 bg-line mx-1" aria-hidden="true" />

        <button
          type="button"
          onClick={() => handleAction('quote')}
          disabled={disabled || preview}
          className={buttonBaseClass}
          aria-label="Blockquote"
          title="Blockquote"
          data-testid="forum-format-quote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => handleAction('list')}
          disabled={disabled || preview}
          className={buttonBaseClass}
          aria-label="Bullet list"
          title="Bullet list"
          data-testid="forum-format-list"
        >
          <List className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Preview Toggle Icon Button */}
      <button
        type="button"
        onClick={onTogglePreview}
        disabled={disabled}
        className={`flex items-center gap-1 px-2 py-1 rounded-control text-[11px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
          preview
            ? 'bg-cyan-soft text-cyan-glow border border-cyan-glow/40'
            : 'text-ink-muted hover:text-ink hover:bg-surface-2 border border-transparent'
        }`}
        aria-label={preview ? 'Switch to edit' : 'Switch to preview'}
        title={preview ? 'Switch back to editor' : 'Preview formatted transmission'}
        data-testid="forum-preview-toggle"
      >
        {preview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        <span className="hidden xs:inline sm:inline">{preview ? 'Editing' : 'Preview'}</span>
      </button>
    </div>
  )
}
