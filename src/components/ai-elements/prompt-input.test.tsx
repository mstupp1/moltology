import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { PromptInput, OracleModelPicker } from './prompt-input'
import { getOracleModel, ORACLE_MODELS } from '@/lib/ai/oracle-models'

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

  it('shows every model with access, purpose, and pricing details', () => {
    render(<PromptInput onSubmit={vi.fn()} selectedModel={getOracleModel()} onSelectModel={vi.fn()} />)
    fireEvent.keyDown(screen.getByRole('button', { name: 'Select model' }), { key: 'Enter' })
    const menu = screen.getByRole('menu', { name: 'Oracle models' })
    for (const model of ORACLE_MODELS) {
      expect(within(menu).getByText(model.label)).toBeInTheDocument()
    }
    expect(within(menu).getAllByText('In / 1M')).toHaveLength(ORACLE_MODELS.length)
    expect(within(menu).getAllByText('Premium').length).toBeGreaterThan(0)
    expect(within(menu).getAllByText('Free').length).toBeGreaterThan(0)
    expect(within(menu).getByText('Guest')).toBeInTheDocument()
    expect(within(menu).getByText('Titles')).toBeInTheDocument()
    expect(menu.closest('[data-radix-popper-content-wrapper]')).toBeInTheDocument()
  })

  it('keeps Premium, title-only and guest preview rows informational for a free member', () => {
    const onSelectModel = vi.fn()
    const freeChat = ORACLE_MODELS.find((model) => model.access === 'free' && model.roles.includes('chat'))!
    render(<OracleModelPicker selectedModel={freeChat} onSelectModel={onSelectModel} accessTier="free" />)
    fireEvent.keyDown(screen.getByRole('button', { name: 'Select model' }), { key: 'Enter' })
    for (const model of ORACLE_MODELS.filter((model) => model.access !== 'free' || !model.roles.includes('chat'))) {
      const row = screen.getByRole('menuitem', { name: new RegExp(model.label) })
      expect(row).toHaveAttribute('aria-disabled', 'true')
      fireEvent.click(row)
    }
    expect(onSelectModel).not.toHaveBeenCalled()
    expect(screen.getByRole('menu', { name: 'Oracle models' })).toBeInTheDocument()
  })

  it('lets Premium members select a chat model and closes the menu', async () => {
    const onSelectModel = vi.fn()
    const premiumChat = ORACLE_MODELS.find((model) => model.access === 'premium' && model.roles.includes('chat'))!
    render(<OracleModelPicker selectedModel={getOracleModel()} onSelectModel={onSelectModel} accessTier="premium" />)
    fireEvent.keyDown(screen.getByRole('button', { name: 'Select model' }), { key: 'Enter' })
    fireEvent.click(screen.getByRole('menuitem', { name: new RegExp(premiumChat.label) }))
    expect(onSelectModel).toHaveBeenCalledWith(premiumChat.id)
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })

  it('dismisses the model menu with Escape and restores trigger focus', async () => {
    render(<OracleModelPicker selectedModel={getOracleModel()} onSelectModel={vi.fn()} />)
    const trigger = screen.getByRole('button', { name: 'Select model' })
    fireEvent.keyDown(trigger, { key: 'Enter' })
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('stops a streaming reply with Escape', () => {
    const onStop = vi.fn()
    render(<PromptInput onSubmit={vi.fn()} onStop={onStop} status="streaming" />)
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Message' }), { key: 'Escape' })
    expect(onStop).toHaveBeenCalled()
  })

  it('keeps the model picker above the compact compose row', () => {
    const { container } = render(
      <PromptInput compact onSubmit={vi.fn()} selectedModel={getOracleModel()} onSelectModel={vi.fn()} />,
    )
    const trigger = screen.getByRole('button', { name: 'Select model' })
    expect(trigger.closest('form')).toBeNull()
    const form = container.querySelector('form')!
    expect(form.className).toContain('items-end')
    expect(within(form).getByRole('textbox', { name: 'Message' })).toBeInTheDocument()
    expect(within(form).getByRole('button', { name: 'Send message' })).toBeInTheDocument()
    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(screen.getByRole('menu', { name: 'Oracle models' })).toBeInTheDocument()
  })

  it('does not let Premium select the free model without no-training protection', () => {
    const onSelectModel = vi.fn()
    const premium = ORACLE_MODELS.find((model) => model.access === 'premium' && model.roles.includes('chat'))!
    const free = ORACLE_MODELS.find((model) => model.access === 'free')!
    render(<OracleModelPicker selectedModel={premium} onSelectModel={onSelectModel} accessTier="premium" />)
    fireEvent.keyDown(screen.getByRole('button', { name: 'Select model' }), { key: 'Enter' })
    const row = screen.getByRole('menuitem', { name: new RegExp(free.label) })
    expect(row).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(row)
    expect(onSelectModel).not.toHaveBeenCalled()
  })

  it('lays out on one row in compact mode and shows a footnote when given', () => {
    const { container } = render(<PromptInput onSubmit={vi.fn()} compact footnote="Check anything important." />)
    expect(container.querySelector('form')?.className).toContain('items-end')
    expect(screen.getByText('Check anything important.')).toBeInTheDocument()
  })
})
