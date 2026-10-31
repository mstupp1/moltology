import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { PromptInput } from './prompt-input'
import { getOracleModel } from '@/lib/ai/oracle-models'

describe('PromptInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    delete (window as any).webkitSpeechRecognition
  })

  it('sends on Enter and clears the box, but Shift+Enter does not send', () => {
    const onSubmit = vi.fn()
    render(<PromptInput onSubmit={onSubmit} />)
    const box = screen.getByRole('textbox', { name: 'Message' }) as HTMLTextAreaElement

    fireEvent.change(box, { target: { value: 'How deep is the deep?' } })
    fireEvent.keyDown(box, { key: 'Enter', shiftKey: true })
    expect(onSubmit).not.toHaveBeenCalled()

    fireEvent.keyDown(box, { key: 'Enter' })
    expect(onSubmit).toHaveBeenCalledWith({ text: 'How deep is the deep?' })
    expect(box.value).toBe('')
  })

  it('has no fake attachment menu', () => {
    render(<PromptInput onSubmit={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /Add Context/i })).not.toBeInTheDocument()
  })

  it('swaps send for Stop while a reply streams', () => {
    const onStop = vi.fn()
    render(<PromptInput onSubmit={vi.fn()} onStop={onStop} status="streaming" />)
    expect(screen.queryByRole('button', { name: 'Send message' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Stop reply' }))
    expect(onStop).toHaveBeenCalled()
  })

  it('works as a controlled box so the owner can restore a draft', () => {
    const onValueChange = vi.fn()
    render(<PromptInput onSubmit={vi.fn()} value="Restored draft" onValueChange={onValueChange} />)
    const box = screen.getByRole('textbox', { name: 'Message' }) as HTMLTextAreaElement
    expect(box.value).toBe('Restored draft')
    fireEvent.change(box, { target: { value: 'Restored draft!' } })
    expect(onValueChange).toHaveBeenCalledWith('Restored draft!')
  })

  it('hides the mic where the browser cannot dictate and shows it where it can', () => {
    const { unmount } = render(<PromptInput onSubmit={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /dictation/i })).not.toBeInTheDocument()
    unmount()

    ;(window as any).webkitSpeechRecognition = class {
      start() {}
      stop() {}
      abort() {}
    }
    render(<PromptInput onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Start dictation' })).toBeInTheDocument()
  })

  it('shows the model picker only when a model and handler are passed', () => {
    const onSelectModel = vi.fn()
    render(<PromptInput onSubmit={vi.fn()} selectedModel={getOracleModel()} onSelectModel={onSelectModel} />)
    fireEvent.click(screen.getByRole('button', { name: /Select model/i }))
    expect(screen.getByText('In / 1M')).toBeInTheDocument()
    expect(screen.getByText('$0.02')).toBeInTheDocument()
    expect(screen.getByText('$0.19')).toBeInTheDocument()
    expect(screen.queryByText(/GLM/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: /DeepSeek V4.1 Flash/i }).at(-1)!)
    expect(onSelectModel).toHaveBeenCalledWith('deepseek/deepseek-v4.1-flash')
  })

  it('stops a streaming reply with Escape', () => {
    const onStop = vi.fn()
    render(<PromptInput onSubmit={vi.fn()} onStop={onStop} status="streaming" />)
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Message' }), { key: 'Escape' })
    expect(onStop).toHaveBeenCalled()
  })

  it('lays out on one row in compact mode and shows a footnote when given', () => {
    const { container } = render(<PromptInput onSubmit={vi.fn()} compact footnote="Check anything important." />)
    expect(container.querySelector('form')?.className).toContain('items-end')
    expect(screen.getByText('Check anything important.')).toBeInTheDocument()
  })
})
