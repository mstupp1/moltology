import React, { forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extensions'
import type { SuggestionProps } from '@tiptap/suggestion'
import { Bold, Code, Italic, Link2, List, ListOrdered, Quote } from 'lucide-react'
import { useMemberSearch } from '@/hooks/useMemberSearch'
import { MEMBER_SEARCH_MIN_CHARS } from '@/lib/member-search'
import {
  forumDocToMarkdown,
  forumMarkdownToDoc,
  normalizeForumLinkInput,
  safeForumHref,
  type ForumDocNode,
} from '@/lib/forum-markdown'
import { FORUM_MENTION_QUERY_RE, ForumEditorKeys, ForumMention } from '@/components/forum/forum-editor-extensions'

const MENTION_LIST_LIMIT = 8
const MENTION_MENU_WIDTH = 240

export type ForumEditorHandle = {
  focus: () => void
}

export interface ForumEditorProps {
  value: string
  onChange: (markdown: string) => void
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
  size?: 'compact' | 'default' | 'tall'
  /** Called on Ctrl/Cmd+Enter. */
  onSubmit?: () => void
  'aria-label'?: string
  'aria-labelledby'?: string
  testId?: string
  className?: string
}

type MentionState = {
  query: string
  range: { from: number; to: number }
  left: number
  top: number
}

const SIZE_CLASS: Record<NonNullable<ForumEditorProps['size']>, string> = {
  compact: 'min-h-[72px]',
  default: 'min-h-[110px]',
  tall: 'min-h-[160px]',
}

/** Markdown that is worth parsing when pasted as plain text. */
const MARKDOWN_HINT_RE = /(^|\n)\s*([-*+] |\d+[.)] |> |```)|\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\)|\n/

function inlineOnly(doc: ForumDocNode): ForumDocNode[] | null {
  const blocks = doc.content ?? []
  if (blocks.length === 1 && blocks[0].type === 'paragraph') return blocks[0].content ?? []
  return null
}

/**
 * The forum's writing box: formatted text as you type, stored as markdown.
 *
 * Toolbar and shortcuts cover the essentials only: bold, italic, link,
 * lists, quote and code. Markdown typed by hand (`**bold**`, `- item`, `> `)
 * converts on the fly. Links are limited to http(s) addresses.
 */
export const ForumEditor = forwardRef<ForumEditorHandle, ForumEditorProps>(function ForumEditor(
  {
    value,
    onChange,
    placeholder = '',
    disabled = false,
    autoFocus = false,
    size = 'default',
    onSubmit,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    testId = 'forum-editor',
    className = '',
  },
  ref,
) {
  const fieldId = useId()
  const mentionListId = `${fieldId}-mentions`
  const wrapperRef = useRef<HTMLDivElement>(null)
  const linkInputRef = useRef<HTMLInputElement>(null)
  const lastMarkdownRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const onSubmitRef = useRef(onSubmit)
  const openLinkRef = useRef<() => void>(() => {})
  const mentionKeyRef = useRef<(event: KeyboardEvent) => boolean>(() => false)
  const editorRef = useRef<Editor | null>(null)

  onChangeRef.current = onChange
  onSubmitRef.current = onSubmit

  const [mention, setMention] = useState<MentionState | null>(null)
  const [highlight, setHighlight] = useState(0)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkValue, setLinkValue] = useState('')
  const [linkError, setLinkError] = useState<string | null>(null)
  const [modKey, setModKey] = useState('Ctrl')

  useEffect(() => {
    if (/Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent)) setModKey('⌘')
  }, [])

  const mentionRender = useMemo(() => {
    const place = (props: SuggestionProps) => {
      if (!FORUM_MENTION_QUERY_RE.test(props.query)) {
        setMention(null)
        return
      }
      const rect = props.clientRect?.()
      const wrap = wrapperRef.current?.getBoundingClientRect()
      let left = 0
      let top = 0
      if (rect && wrap) {
        left = Math.max(0, Math.min(rect.left - wrap.left, wrap.width - MENTION_MENU_WIDTH))
        top = rect.bottom - wrap.top + 4
      }
      setMention({ query: props.query, range: props.range, left, top })
    }
    return () => ({
      onStart: place,
      onUpdate: place,
      onExit: () => setMention(null),
      onKeyDown: ({ event }: { event: KeyboardEvent }) => mentionKeyRef.current(event),
    })
  }, [])

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        dropcursor: false,
        trailingNode: false,
        code: { HTMLAttributes: { class: 'forum-editor-code' } },
        codeBlock: { HTMLAttributes: { class: 'forum-editor-codeblock' } },
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          defaultProtocol: 'https',
          isAllowedUri: (url) => safeForumHref(url) !== null,
          shouldAutoLink: (url) => safeForumHref(url) !== null || normalizeForumLinkInput(url) !== null,
          HTMLAttributes: { rel: 'noopener noreferrer nofollow ugc', target: null },
        },
      }),
      Placeholder.configure({ placeholder }),
      ForumEditorKeys.configure({
        onLink: () => openLinkRef.current(),
        onSubmit: () => onSubmitRef.current?.(),
      }),
      ForumMention.configure({ render: mentionRender }),
    ],
    content: forumMarkdownToDoc(value) as JSONContent,
    editorProps: {
      attributes: {
        class: `forum-editor-content ${SIZE_CLASS[size]} max-h-[420px] overflow-y-auto px-3 py-2.5 text-[16px] sm:text-sm text-ink leading-relaxed outline-none break-words`,
        role: 'textbox',
        'aria-multiline': 'true',
        ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
        ...(ariaLabelledBy ? { 'aria-labelledby': ariaLabelledBy } : {}),
        'data-testid': `${testId}-input`,
      },
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain')
        const html = event.clipboardData?.getData('text/html')
        const current = editorRef.current
        if (!current || !text || html) return false
        if (view.state.selection.$from.parent.type.spec.code) return false
        if (!MARKDOWN_HINT_RE.test(text)) return false
        const parsed = forumMarkdownToDoc(text)
        const content = inlineOnly(parsed) ?? parsed.content ?? []
        current.chain().focus().insertContent(content as JSONContent[]).run()
        return true
      },
    },
    onCreate: ({ editor: created }) => {
      editorRef.current = created
      if (autoFocus) created.commands.focus('end')
    },
    onUpdate: ({ editor: updated }) => {
      const markdown = forumDocToMarkdown(updated.getJSON() as ForumDocNode)
      if (markdown === lastMarkdownRef.current) return
      lastMarkdownRef.current = markdown
      onChangeRef.current(markdown)
    },
  })

  // Parent replaced the text (quote inserted, draft cleared after posting).
  useEffect(() => {
    if (!editor || value === lastMarkdownRef.current) return
    lastMarkdownRef.current = value
    editor.commands.setContent(forumMarkdownToDoc(value) as JSONContent, { emitUpdate: false })
  }, [editor, value])

  useEffect(() => {
    editor?.setEditable(!disabled)
  }, [editor, disabled])

  useImperativeHandle(ref, () => ({
    focus: () => editor?.commands.focus('end'),
  }))

  const active = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive('bold'),
            italic: e.isActive('italic'),
            link: e.isActive('link'),
            bulletList: e.isActive('bulletList'),
            orderedList: e.isActive('orderedList'),
            blockquote: e.isActive('blockquote'),
            code: e.isActive('code') || e.isActive('codeBlock'),
            focused: e.isFocused,
          }
        : null,
  })

  /* -------------------------------------------------------- mentions */

  const mentionQuery = mention?.query ?? ''
  const searchEnabled = Boolean(mention) && mentionQuery.length >= MEMBER_SEARCH_MIN_CHARS
  const { results, searching } = useMemberSearch(mentionQuery, searchEnabled)
  const options = useMemo(
    () => results.filter((member) => Boolean(member.handle?.trim())).slice(0, MENTION_LIST_LIMIT),
    [results],
  )

  useEffect(() => {
    setHighlight(0)
  }, [mentionQuery])

  const applyMention = (handle: string) => {
    if (!editor || !mention) return
    editor
      .chain()
      .focus()
      .insertContentAt(mention.range, [{ type: 'text', text: `@${handle} ` }])
      .run()
    setMention(null)
  }

  mentionKeyRef.current = (event: KeyboardEvent) => {
    if (!mention || options.length === 0) return false
    if (event.key === 'ArrowDown') {
      setHighlight((index) => (index + 1) % options.length)
      return true
    }
    if (event.key === 'ArrowUp') {
      setHighlight((index) => (index - 1 + options.length) % options.length)
      return true
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      const handle = options[highlight]?.handle?.trim()
      if (!handle) return false
      applyMention(handle)
      return true
    }
    return false
  }

  /* ------------------------------------------------------------ links */

  openLinkRef.current = () => {
    if (!editor || disabled) return
    const href = (editor.getAttributes('link').href as string | undefined) ?? ''
    setLinkValue(href)
    setLinkError(null)
    setLinkOpen(true)
    requestAnimationFrame(() => linkInputRef.current?.focus())
  }

  const closeLink = () => {
    setLinkOpen(false)
    setLinkError(null)
    editor?.commands.focus()
  }

  const applyLink = () => {
    if (!editor) return
    const href = normalizeForumLinkInput(linkValue)
    if (!href) {
      setLinkError('Enter a full web address, like https://example.com')
      return
    }
    const chain = editor.chain().focus()
    if (editor.state.selection.empty && !editor.isActive('link')) {
      chain.insertContent([{ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }]).run()
    } else {
      chain.extendMarkRange('link').setLink({ href }).run()
    }
    setLinkOpen(false)
    setLinkError(null)
  }

  const removeLink = () => {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run()
    setLinkOpen(false)
    setLinkError(null)
  }

  /* ---------------------------------------------------------- toolbar */

  const toggleCode = () => {
    if (!editor) return
    const { state } = editor
    const { $from, $to, empty } = state.selection
    const multiBlock = !$from.sameParent($to)
    const emptyLine = empty && $from.parent.type.name === 'paragraph' && $from.parent.content.size === 0
    if (editor.isActive('codeBlock') || multiBlock || emptyLine) {
      editor.chain().focus().toggleCodeBlock().run()
    } else {
      editor.chain().focus().toggleCode().run()
    }
  }

  // Pressed states only mean something while the caret is in the box.
  const live = Boolean(active?.focused) || linkOpen

  const tools: Array<{
    key: string
    label: string
    shortcut?: string
    icon: React.ComponentType<{ className?: string }>
    pressed: boolean
    run: () => void
    divider?: boolean
  }> = [
    { key: 'bold', label: 'Bold', shortcut: `${modKey}+B`, icon: Bold, pressed: live && Boolean(active?.bold), run: () => editor?.chain().focus().toggleBold().run() },
    { key: 'italic', label: 'Italic', shortcut: `${modKey}+I`, icon: Italic, pressed: live && Boolean(active?.italic), run: () => editor?.chain().focus().toggleItalic().run() },
    { key: 'link', label: 'Link', shortcut: `${modKey}+K`, icon: Link2, pressed: linkOpen || (live && Boolean(active?.link)), run: () => openLinkRef.current() },
    { key: 'bullet', label: 'Bulleted list', icon: List, pressed: live && Boolean(active?.bulletList), run: () => editor?.chain().focus().toggleBulletList().run(), divider: true },
    { key: 'ordered', label: 'Numbered list', icon: ListOrdered, pressed: live && Boolean(active?.orderedList), run: () => editor?.chain().focus().toggleOrderedList().run() },
    { key: 'quote', label: 'Quote', icon: Quote, pressed: live && Boolean(active?.blockquote), run: () => editor?.chain().focus().toggleBlockquote().run() },
    { key: 'code', label: 'Code', icon: Code, pressed: live && Boolean(active?.code), run: toggleCode },
  ]

  const showMenu = Boolean(mention)

  return (
    <div
      ref={wrapperRef}
      className={`relative rounded-control border bg-surface-2 transition-[border-color,box-shadow] ${
        active?.focused || linkOpen ? 'border-cyan-glow shadow-field-focus' : 'border-line hover:border-line-hover'
      } ${disabled ? 'opacity-60' : ''} ${className}`}
      data-testid={testId}
    >
      <div
        role="toolbar"
        aria-label="Formatting"
        className="flex items-center gap-0.5 px-1.5 py-1 border-b border-line-subtle overflow-x-auto no-scrollbar"
      >
        {tools.map((tool) => {
          const Icon = tool.icon
          const title = tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label
          return (
            <React.Fragment key={tool.key}>
              {tool.divider && <span className="w-px h-4 bg-line-subtle mx-1 shrink-0" aria-hidden="true" />}
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={tool.run}
                disabled={disabled || !editor}
                aria-pressed={tool.pressed}
                aria-label={tool.label}
                title={title}
                data-testid={`forum-format-${tool.key}`}
                className={`inline-flex items-center justify-center min-h-8 min-w-8 shrink-0 rounded-control transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow disabled:opacity-40 disabled:pointer-events-none ${
                  tool.pressed ? 'bg-cyan-soft text-cyan-glow' : 'text-ink-muted hover:text-ink hover:bg-surface-3'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            </React.Fragment>
          )
        })}
      </div>

      {linkOpen && (
        <div className="px-2 py-2 border-b border-line-subtle space-y-1.5" data-testid="forum-link-panel">
          <div className="flex flex-wrap items-center gap-1.5">
            <label htmlFor={`${fieldId}-link`} className="sr-only">
              Link address
            </label>
            <input
              ref={linkInputRef}
              id={`${fieldId}-link`}
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={linkValue}
              placeholder="https://"
              aria-invalid={Boolean(linkError)}
              aria-describedby={linkError ? `${fieldId}-link-error` : undefined}
              onChange={(event) => {
                setLinkValue(event.target.value)
                setLinkError(null)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  applyLink()
                } else if (event.key === 'Escape') {
                  event.preventDefault()
                  closeLink()
                }
              }}
              className={`flex-1 min-w-[160px] min-h-8 bg-surface-1 border px-2 text-xs text-ink rounded-control outline-none placeholder:text-ink-muted transition-[border-color,box-shadow] ${
                linkError ? 'border-crimson-aggro shadow-field-error' : 'border-line focus:border-cyan-glow focus:shadow-field-focus'
              }`}
              data-testid="forum-link-input"
            />
            <button
              type="button"
              onClick={applyLink}
              className="min-h-8 px-3 rounded-control bg-cyan-glow hover:bg-cyan-hover text-abyss text-[11px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
              data-testid="forum-link-apply"
            >
              Apply
            </button>
            {active?.link && (
              <button
                type="button"
                onClick={removeLink}
                className="min-h-8 px-2.5 rounded-control text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted hover:text-ink hover:bg-surface-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                data-testid="forum-link-remove"
              >
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={closeLink}
              className="min-h-8 px-2.5 rounded-control text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted hover:text-ink hover:bg-surface-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              Cancel
            </button>
          </div>
          {linkError && (
            <p id={`${fieldId}-link-error`} className="text-[11px] text-crimson-text" role="alert">
              {linkError}
            </p>
          )}
        </div>
      )}

      {editor ? (
        <EditorContent editor={editor} />
      ) : (
        // Server render and first paint: same box, so the layout does not jump.
        <div className={`${SIZE_CLASS[size]} px-3 py-2.5 text-xs sm:text-sm text-ink-muted`} aria-hidden="true">
          {value ? '' : placeholder}
        </div>
      )}

      {showMenu && (
        <div
          id={mentionListId}
          role="listbox"
          aria-label="Members"
          data-testid="forum-mention-autocomplete"
          style={{ left: mention?.left ?? 0, top: mention?.top ?? 0, width: MENTION_MENU_WIDTH }}
          className="absolute z-30 max-h-48 overflow-y-auto rounded-card border border-line bg-surface-2 shadow-menu p-1"
        >
          {!searchEnabled && <p className="px-3 py-2 text-[11px] text-ink-muted">Type a handle to mention someone.</p>}
          {searchEnabled && searching && options.length === 0 && (
            <p className="px-3 py-2 text-[11px] text-ink-muted">Searching members...</p>
          )}
          {searchEnabled && !searching && options.length === 0 && (
            <p className="px-3 py-2 text-[11px] text-ink-muted">No member has that handle.</p>
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
                className={`w-full text-left px-3 py-2 text-xs rounded-control transition-colors ${
                  index === highlight ? 'bg-surface-3 text-cyan-glow' : 'text-ink hover:bg-surface-3'
                }`}
                onMouseDown={(event) => {
                  event.preventDefault()
                  applyMention(handle)
                }}
              >
                <span className="font-bold">@{handle}</span>
                {member.displayName && member.displayName !== handle && (
                  <span className="ml-2 text-ink-muted">{member.displayName}</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
})

ForumEditor.displayName = 'ForumEditor'
