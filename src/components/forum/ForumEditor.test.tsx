import React, { useState } from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { Editor } from '@tiptap/react'
import { ForumEditor } from './ForumEditor'

vi.mock('@/hooks/useMemberSearch', () => ({
  useMemberSearch: (query: string, enabled: boolean) => ({
    results:
      enabled && 'claw_lord'.startsWith(query)
        ? [{ id: 'm1', handle: 'claw_lord', displayName: 'Claw Lord' }]
        : [],
    searching: false,
  }),
}))

beforeAll(() => {
  // ProseMirror measures layout when scrolling the selection into view.
  const rect = () => ({ x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON: () => ({}) })
  Range.prototype.getBoundingClientRect = rect as unknown as () => DOMRect
  Range.prototype.getClientRects = (() => ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] })) as unknown as () => DOMRectList
  document.elementFromPoint = (() => null) as typeof document.elementFromPoint
})

function Harness({ initial = '', onChange }: { initial?: string; onChange?: (md: string) => void }) {
  const [value, setValue] = useState(initial)
  return (
    <>
      <ForumEditor
        value={value}
        onChange={(md) => {
          setValue(md)
          onChange?.(md)
        }}
        aria-label="Write a reply"
        placeholder="Write a reply"
      />
      <output data-testid="markdown">{value}</output>
      <button type="button" onClick={() => setValue('')}>
        clear
      </button>
    </>
  )
}

async function getEditor(): Promise<Editor> {
  const input = await screen.findByTestId('forum-editor-input')
  const editor = (input as unknown as { editor?: Editor }).editor
  if (!editor) throw new Error('editor not mounted')
  return editor
}

describe('ForumEditor', () => {
  it('shows stored markdown as formatted text, not syntax', async () => {
    render(<Harness initial={'**bold** and [site](https://moltology.com)\n\n- one\n- two'} />)
    const input = await screen.findByTestId('forum-editor-input')
    expect(input.querySelector('strong')).toHaveTextContent('bold')
    expect(input.querySelector('a')).toHaveAttribute('href', 'https://moltology.com/')
    expect(input.querySelectorAll('li')).toHaveLength(2)
    expect(input.textContent).not.toContain('**')
  })

  it('uses a 16px font on phones so iOS does not zoom', async () => {
    render(<Harness />)
    expect((await screen.findByTestId('forum-editor-input')).className).toContain('text-[16px]')
  })

  it('is a labelled textbox with a formatting toolbar', async () => {
    render(<Harness />)
    expect(await screen.findByRole('textbox', { name: 'Write a reply' })).toBeInTheDocument()
    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toBeInTheDocument()
    for (const name of ['Bold', 'Italic', 'Link', 'Bulleted list', 'Numbered list', 'Quote', 'Code']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })

  it('bolds the selection from the toolbar and emits markdown', async () => {
    render(<Harness initial="make this loud" />)
    const editor = await getEditor()
    act(() => {
      editor.commands.focus()
      editor.commands.setTextSelection({ from: 11, to: 15 })
    })
    fireEvent.click(screen.getByRole('button', { name: 'Bold' }))
    await waitFor(() => expect(screen.getByTestId('markdown')).toHaveTextContent('make this **loud**'))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true'))
  })

  it('turns the current line into a list', async () => {
    render(<Harness initial="first item" />)
    await getEditor()
    fireEvent.click(screen.getByRole('button', { name: 'Bulleted list' }))
    await waitFor(() => expect(screen.getByTestId('markdown').textContent).toBe('- first item'))
  })

  it('keeps typed markdown characters literal', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const editor = await getEditor()
    act(() => {
      editor.commands.insertContent('2*3*4 <script>alert(1)</script>')
    })
    await waitFor(() =>
      expect(screen.getByTestId('markdown').textContent).toBe('2\\*3\\*4 <script>alert(1)</script>'),
    )
    expect(document.querySelector('script')).toBeNull()
  })

  it('adds a link through the link field and refuses unsafe addresses', async () => {
    render(<Harness initial="read the codex" />)
    const editor = await getEditor()
    act(() => {
      editor.commands.setTextSelection({ from: 10, to: 15 })
    })
    fireEvent.click(screen.getByRole('button', { name: 'Link' }))
    const field = screen.getByLabelText('Link address')

    fireEvent.change(field, { target: { value: 'javascript:alert(1)' } })
    fireEvent.click(screen.getByTestId('forum-link-apply'))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a full web address')
    expect(screen.getByTestId('markdown').textContent).toBe('read the codex')

    fireEvent.change(field, { target: { value: 'moltology.com/codex' } })
    fireEvent.keyDown(field, { key: 'Enter' })
    await waitFor(() =>
      expect(screen.getByTestId('markdown').textContent).toBe('read the [codex](https://moltology.com/codex)'),
    )
    expect(screen.queryByTestId('forum-link-panel')).not.toBeInTheDocument()
  })

  it('drops script links from pasted HTML', async () => {
    render(<Harness />)
    const editor = await getEditor()
    act(() => {
      editor.commands.insertContent('<p><a href="javascript:alert(1)">bad</a> <a href="https://e.com">good</a><img src=x onerror="alert(1)"></p>')
    })
    await waitFor(() => expect(screen.getByTestId('markdown').textContent).toBe('bad [good](https://e.com)'))
  })

  it('follows the parent when it clears the draft', async () => {
    render(<Harness initial="posted text" />)
    const editor = await getEditor()
    fireEvent.click(screen.getByRole('button', { name: 'clear' }))
    await waitFor(() => expect(editor.getText()).toBe(''))
  })

  it('suggests members after @ and inserts the handle as text', async () => {
    render(<Harness />)
    const editor = await getEditor()
    act(() => {
      editor.commands.focus()
      editor.commands.insertContent('Ask @cla')
    })
    const option = await screen.findByTestId('forum-mention-option')
    expect(option).toHaveTextContent('@claw_lord')
    fireEvent.mouseDown(option)
    await waitFor(() => expect(screen.getByTestId('markdown').textContent).toBe('Ask @claw_lord'))
  })
})
