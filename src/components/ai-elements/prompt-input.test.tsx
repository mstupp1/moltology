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

  it('shows model names without pricing, latency, the directory header or preview', () => {
    render(<PromptInput onSubmit={vi.fn()} selectedModel={getOracleModel()} onSelectModel={vi.fn()} />)
    fireEvent.keyDown(screen.getByRole('button', { name: 'Select model' }), { key: 'Enter' })
    const menu = screen.getByRole('menu', { name: 'Oracle models' })
    const listedModels = ORACLE_MODELS.filter((model) => model.roles.includes('chat'))
    for (const model of listedModels) {
      expect(within(menu).getAllByText(model.label)[0]).toBeInTheDocument()
    }
    expect(within(menu).queryByText('In / 1M')).not.toBeInTheDocument()
    expect(within(menu).queryByText('Out / 1M')).not.toBeInTheDocument()
    expect(within(menu).queryByText('First token')).not.toBeInTheDocument()
    expect(within(menu).queryByText(/Prices per million tokens/)).not.toBeInTheDocument()
    expect(within(menu).getAllByText('Oracle MAX').length).toBeGreaterThan(0)
    expect(within(menu).queryByText('Free')).not.toBeInTheDocument()
    expect(within(menu).queryByText('Chat + Titles')).not.toBeInTheDocument()
    expect(within(menu).queryByText('Chat')).not.toBeInTheDocument()
    expect(within(menu).queryByText('Guest preview')).not.toBeInTheDocument()
    expect(within(menu).queryByText('Models')).not.toBeInTheDocument()
    expect(within(menu).queryByText('DeepSeek V4.1 Flash 1017')).not.toBeInTheDocument()
    expect(within(menu).queryByText('Claude Haiku 5.5')).not.toBeInTheDocument()
    expect(within(menu).queryByText(/Sonnet/)).not.toBeInTheDocument()
    expect(within(menu).queryByText('Mistral Nemo 12B')).not.toBeInTheDocument()
    expect(within(menu).getAllByRole('menuitemradio')).toHaveLength(2)
    expect(menu.querySelectorAll('[data-oracle-provider]')).toHaveLength(0)
    expect(menu.querySelector('[data-oracle-tier=lite]')).toBeInTheDocument()
    expect(menu.querySelector('[data-oracle-tier=max]')).toBeInTheDocument()
    expect(menu.closest('[data-radix-popper-content-wrapper]')).toBeInTheDocument()
  })

  it('keeps the MAX row informational for a free member', () => {
    const onSelectModel = vi.fn()
    const freeChat = ORACLE_MODELS.find((model) => model.access === 'free' && model.roles.includes('chat'))!
    render(<OracleModelPicker selectedModel={freeChat} onSelectModel={onSelectModel} accessTier="free" />)
    fireEvent.keyDown(screen.getByRole('button', { name: 'Select model' }), { key: 'Enter' })
    for (const model of ORACLE_MODELS.filter((model) => model.roles.includes('chat') && (model.access !== 'free' || !model.roles.includes('chat')))) {
      const row = screen.getByRole('menuitemradio', { name: model.label })
      expect(row).toHaveAttribute('aria-disabled', 'true')
      fireEvent.click(row)
    }
    expect(onSelectModel).not.toHaveBeenCalled()
    expect(screen.getByRole('menu', { name: 'Oracle models' })).toBeInTheDocument()
  })

  it('shows Lite selected for guests while both chat options stay disabled', () => {
    const onSelectModel = vi.fn()
    render(<OracleModelPicker selectedModel={getOracleModel()} onSelectModel={onSelectModel} accessTier="guest" />)
    expect(screen.getByRole('button', { name: 'Select model' })).toHaveTextContent('Oracle Lite')
    fireEvent.keyDown(screen.getByRole('button', { name: 'Select model' }), { key: 'Enter' })
    const lite = screen.getByRole('menuitemradio', { name: 'Oracle Lite' })
    expect(lite).toHaveAttribute('aria-checked', 'true')
    for (const row of screen.getAllByRole('menuitemradio')) {
      expect(row).toHaveAttribute('aria-disabled', 'true')
      fireEvent.click(row)
    }
    expect(onSelectModel).not.toHaveBeenCalled()
    expect(screen.getAllByRole('menuitemradio')).toHaveLength(2)
  })

  it('lets Premium members select a chat model and closes the menu', async () => {
    const onSelectModel = vi.fn()
    const premiumChat = ORACLE_MODELS.find((model) => model.access === 'premium' && model.roles.includes('chat'))!
    render(<OracleModelPicker selectedModel={getOracleModel()} onSelectModel={onSelectModel} accessTier="premium" />)
    fireEvent.keyDown(screen.getByRole('button', { name: 'Select model' }), { key: 'Enter' })
    fireEvent.click(screen.getByRole('menuitemradio', { name: premiumChat.label }))
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

  it('keeps the model picker and send controls in the toolbar below the message', () => {
    const { container } = render(
      <PromptInput compact onSubmit={vi.fn()} selectedModel={getOracleModel()} onSelectModel={vi.fn()} />,
    )
    const trigger = screen.getByRole('button', { name: 'Select model' })
    expect(trigger.closest('form')).not.toBeNull()
    const form = container.querySelector('form')!
    expect(form.className).toContain('flex-col')
    const toolbar = trigger.parentElement!.parentElement!
    expect(within(toolbar).getByRole('button', { name: 'Send message' })).toBeInTheDocument()
    expect(within(toolbar).queryByRole('textbox')).not.toBeInTheDocument()
    expect(within(form).getByRole('textbox', { name: 'Message' })).toBeInTheDocument()
    expect(within(form).getByRole('button', { name: 'Send message' })).toBeInTheDocument()
    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(screen.getByRole('menu', { name: 'Oracle models' })).toBeInTheDocument()
  })

  it('shows underlying model names only when enabled for admins', () => {
    render(<OracleModelPicker selectedModel={getOracleModel()} onSelectModel={vi.fn()} showModelNames />)
    fireEvent.keyDown(screen.getByRole('button', { name: 'Select model' }), { key: 'Enter' })
    expect(screen.getByText('DeepSeek V4.1 Flash 1017')).toBeInTheDocument()
    expect(screen.getByText('Claude Haiku 5.5')).toBeInTheDocument()
    const menu = screen.getByRole('menu', { name: 'Oracle models' })
    expect(menu.querySelector('[data-oracle-provider=deepseek]')).toBeInTheDocument()
    expect(menu.querySelector('[data-oracle-provider=anthropic]')).toBeInTheDocument()
  })

  it('lets MAX members select Lite with no-training routing', () => {
    const onSelectModel = vi.fn()
    const premium = ORACLE_MODELS.find((model) => model.access === 'premium')!
    render(<OracleModelPicker selectedModel={premium} onSelectModel={onSelectModel} accessTier="premium" />)
    fireEvent.keyDown(screen.getByRole('button', { name: 'Select model' }), { key: 'Enter' })
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Oracle Lite' }))
    expect(onSelectModel).toHaveBeenCalledWith(getOracleModel().id)
  })

  it('lays out on one row in compact mode and shows a footnote when given', () => {
    const { container } = render(<PromptInput onSubmit={vi.fn()} compact footnote="Check anything important." />)
    expect(container.querySelector('form')?.className).toContain('items-end')
    expect(screen.getByText('Check anything important.')).toBeInTheDocument()
  })
})
