import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useMemberSearch } from '@/hooks/useMemberSearch'
import { MEMBER_SEARCH_MIN_CHARS } from '@/lib/member-search'
import { insertMentionAtCursor, mentionQueryAtCursor } from '@/lib/forum-mentions'

const LIST_LIMIT = 8

export function MentionTextarea({
  id,
  value,
  onChange,
  placeholder,
  rows = 4,
  autoFocus = false,
  className,
  disabled,
  'aria-label': ariaLabel,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  autoFocus?: boolean
  className?: string
  disabled?: boolean
  'aria-label'?: string
}) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const listboxId = `${fieldId}-mention-list`
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [cursor, setCursor] = useState(0)
  const [highlight, setHighlight] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  const mention = mentionQueryAtCursor(value, cursor)
  const query = mention?.query ?? ''
  const open = Boolean(mention) && !dismissed
  const searchEnabled = open && query.length >= MEMBER_SEARCH_MIN_CHARS
  const { results, searching } = useMemberSearch(query, searchEnabled)

  const options = useMemo(
    () => results.filter((member) => Boolean(member.handle?.trim())).slice(0, LIST_LIMIT),
    [results],
  )

  useEffect(() => {
    setHighlight(0)
  }, [query, open])

  useEffect(() => {
    setDismissed(false)
  }, [query])

  const syncCursor = () => {
    const next = textareaRef.current?.selectionStart
    if (typeof next === 'number') setCursor(next)
  }

  const applyMention = (handle: string) => {
    const next = insertMentionAtCursor(value, cursor, handle)
    onChange(next.text)
    requestAnimationFrame(() => {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(next.cursor, next.cursor)
      setCursor(next.cursor)
    })
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!open) return

    if (event.key === 'Escape') {
      event.preventDefault()
      setDismissed(true)
      return
    }

    if (options.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlight((index) => (index + 1) % options.length)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight((index) => (index - 1 + options.length) % options.length)
      return
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      const chosen = options[highlight]
      const handle = chosen?.handle?.trim()
      if (!handle) return
      event.preventDefault()
      applyMention(handle)
    }
  }

  return (
    <div className="relative">
      <textarea
        id={id}
        ref={textareaRef}
        rows={rows}
        value={value}
        autoFocus={autoFocus}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        placeholder={placeholder}
        className={className}
        onChange={(event) => {
          onChange(event.target.value)
          setCursor(event.target.selectionStart)
        }}
        onKeyDown={onKeyDown}
        onClick={syncCursor}
        onKeyUp={syncCursor}
        onSelect={syncCursor}
      />

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Member designations"
          data-testid="forum-mention-autocomplete"
          className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-[#070b0b] border border-[#00ffff]/50 chamfer-corner shadow-[0_0_16px_rgba(0,255,255,0.12)]"
        >
          {!searchEnabled && (
            <p className="px-3 py-2 text-[11px] text-[#839493]">Type a designation to hail them.</p>
          )}
          {searchEnabled && searching && options.length === 0 && (
            <p className="px-3 py-2 text-[11px] text-[#839493]">Scanning designations...</p>
          )}
          {searchEnabled && !searching && options.length === 0 && (
            <p className="px-3 py-2 text-[11px] text-[#839493]">No member carries that designation.</p>
          )}
          {options.map((member, index) => {
            const handle = member.handle!.trim()
            return (
              <button
                key={member.id}
                type="button"
                role="option"
                aria-selected={index === highlight}
                data-testid="forum-mention-option"
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  index === highlight
                    ? 'bg-[#00ffff]/15 text-[#00ffff]'
                    : 'text-[#dfe3e3] hover:bg-[#171c1c]'
                }`}
                onMouseDown={(event) => {
                  event.preventDefault()
                  applyMention(handle)
                }}
              >
                <span className="font-bold">@{handle}</span>
                {member.displayName && member.displayName !== handle && (
                  <span className="ml-2 text-[#839493]">{member.displayName}</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
