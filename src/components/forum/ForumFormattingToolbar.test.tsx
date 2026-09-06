import React, { createRef } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  ForumFormattingToolbar,
  applyFormatting,
  handleFormattingShortcuts,
} from './ForumFormattingToolbar'
import { ForumPostBody } from './ForumPostBody'

describe('ForumFormattingToolbar', () => {
  it('renders formatting tool buttons and preview icon toggle', () => {
    const textareaRef = createRef<HTMLTextAreaElement>()
    const onTogglePreview = vi.fn()
    const onChange = vi.fn()

    render(
      <ForumFormattingToolbar
        textareaRef={textareaRef}
        value=""
        onChange={onChange}
        preview={false}
        onTogglePreview={onTogglePreview}
      />,
    )

    expect(screen.getByTestId('forum-formatting-toolbar')).toBeInTheDocument()
    expect(screen.getByTestId('forum-format-bold')).toBeInTheDocument()
    expect(screen.getByTestId('forum-format-italic')).toBeInTheDocument()
    expect(screen.getByTestId('forum-format-code')).toBeInTheDocument()
    expect(screen.getByTestId('forum-format-link')).toBeInTheDocument()
    expect(screen.getByTestId('forum-format-quote')).toBeInTheDocument()
    expect(screen.getByTestId('forum-format-list')).toBeInTheDocument()
    expect(screen.getByTestId('forum-preview-toggle')).toBeInTheDocument()
  })

  it('calls onTogglePreview when preview toggle button is clicked', () => {
    const textareaRef = createRef<HTMLTextAreaElement>()
    const onTogglePreview = vi.fn()
    const onChange = vi.fn()

    render(
      <ForumFormattingToolbar
        textareaRef={textareaRef}
        value=""
        onChange={onChange}
        preview={false}
        onTogglePreview={onTogglePreview}
      />,
    )

    fireEvent.click(screen.getByTestId('forum-preview-toggle'))
    expect(onTogglePreview).toHaveBeenCalledTimes(1)
  })

  it('applies bold formatting to selected text', () => {
    const textarea = document.createElement('textarea')
    textarea.value = 'hello world'
    textarea.selectionStart = 0
    textarea.selectionEnd = 5 // 'hello'
    document.body.appendChild(textarea)

    const onChange = vi.fn()
    applyFormatting(textarea, 'bold', onChange)

    expect(onChange).toHaveBeenCalledWith('**hello** world')
    document.body.removeChild(textarea)
  })

  it('inserts bold template when no text is selected', () => {
    const textarea = document.createElement('textarea')
    textarea.value = ''
    textarea.selectionStart = 0
    textarea.selectionEnd = 0
    document.body.appendChild(textarea)

    const onChange = vi.fn()
    applyFormatting(textarea, 'bold', onChange)

    expect(onChange).toHaveBeenCalledWith('**bold text**')
    document.body.removeChild(textarea)
  })

  it('applies link formatting template', () => {
    const textarea = document.createElement('textarea')
    textarea.value = 'click here'
    textarea.selectionStart = 0
    textarea.selectionEnd = 10
    document.body.appendChild(textarea)

    const onChange = vi.fn()
    applyFormatting(textarea, 'link', onChange)

    expect(onChange).toHaveBeenCalledWith('[click here](https://)')
    document.body.removeChild(textarea)
  })

  it('applies quote prefix to current line', () => {
    const textarea = document.createElement('textarea')
    textarea.value = 'The molt is mandatory'
    textarea.selectionStart = 4
    textarea.selectionEnd = 4
    document.body.appendChild(textarea)

    const onChange = vi.fn()
    applyFormatting(textarea, 'quote', onChange)

    expect(onChange).toHaveBeenCalledWith('> The molt is mandatory')
    document.body.removeChild(textarea)
  })

  it('handles Ctrl/Cmd + B shortcut', () => {
    const textarea = document.createElement('textarea')
    textarea.value = 'important'
    textarea.selectionStart = 0
    textarea.selectionEnd = 9
    document.body.appendChild(textarea)

    const onChange = vi.fn()
    const event = {
      key: 'b',
      ctrlKey: true,
      metaKey: false,
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent<HTMLTextAreaElement>

    const handled = handleFormattingShortcuts(event, textarea, onChange)
    expect(handled).toBe(true)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith('**important**')
    document.body.removeChild(textarea)
  })
})

describe('ForumPostBody markdown rendering', () => {
  it('renders bold, italic, code, and links in post bodies', () => {
    render(
      <ForumPostBody
        content="This is **bold**, this is *italic*, here is `inline_code`, and [Website](https://moltology.com)."
      />,
    )

    expect(screen.getByText('bold')).toHaveClass('font-bold')
    expect(screen.getByText('italic')).toHaveClass('italic')
    expect(screen.getByText('inline_code')).toHaveClass('font-mono')
    const link = screen.getByRole('link', { name: 'Website' })
    expect(link).toHaveAttribute('href', 'https://moltology.com')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
