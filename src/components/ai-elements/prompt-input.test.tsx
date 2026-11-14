import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { PromptInput, OracleModelPicker, filterSkillOptions, readSlashQuery } from './prompt-input'
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

  it('keeps oversized drafts and blocks both Enter and click until they fit the tier', () => {
    const onSubmit = vi.fn()
    const { rerender } = render(<PromptInput onSubmit={onSubmit} accessTier="free" />)
    const box = screen.getByRole('textbox', { name: 'Message' }) as HTMLTextAreaElement
    fireEvent.change(box, { target: { value: 'a'.repeat(1501) } })
    expect(box.value).toHaveLength(1501)
    expect(box).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled()
    expect(screen.getByText(/Free Oracle messages can contain up to 1,500 characters/i)).toBeInTheDocument()
    fireEvent.keyDown(box, { key: 'Enter' })
    expect(onSubmit).not.toHaveBeenCalled()
    rerender(<PromptInput onSubmit={onSubmit} accessTier="premium" />)
    expect(screen.queryByText(/characters/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled()
    fireEvent.change(box, { target: { value: 'a'.repeat(4001) } })
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled()
    expect(screen.getByText(/Oracle MAX messages can contain up to 4,000 characters/i)).toBeInTheDocument()
    rerender(<PromptInput onSubmit={onSubmit} accessTier="free" />)
    fireEvent.change(box, { target: { value: 'a'.repeat(1500) } })
    expect(screen.queryByText(/characters/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
    expect(onSubmit).toHaveBeenCalledWith({ text: 'a'.repeat(1500) })
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

describe('PromptInput skills', () => {
  const skills = [
    { id: 'focus-rounds', name: 'Focus rounds', summary: 'Work in 25-minute rounds.' },
    { id: 'two-minute-start', name: 'Two-minute start', summary: 'Get moving.' },
  ]

  it('reads "/" queries and filters by name or id', () => {
    expect(readSlashQuery('/')).toBe('')
    expect(readSlashQuery('/two min')).toBe('two min')
    expect(readSlashQuery('hello /focus')).toBeNull()
    expect(readSlashQuery('/focus\nmore')).toBeNull()
    expect(filterSkillOptions(skills, 'two-minute').map((s) => s.id)).toEqual(['two-minute-start'])
    expect(filterSkillOptions(skills, '')).toHaveLength(2)
  })

  function Harness({ onSubmit = vi.fn() }: { onSubmit?: (m: { text: string }) => void }) {
    const [active, setActive] = React.useState<string | null>(null)
    const activeSkill = skills.find((s) => s.id === active) ?? null
    return (
      <PromptInput
        onSubmit={onSubmit}
        skills={skills}
        activeSkill={activeSkill}
        onPickSkill={setActive}
        onClearSkill={() => setActive(null)}
      />
    )
  }

  it('lists skills after "/", picks one with the keyboard, and shows it as a chip', () => {
    const onSubmit = vi.fn()
    render(<Harness onSubmit={onSubmit} />)
    const box = screen.getByRole('textbox', { name: 'Message' }) as HTMLTextAreaElement
    fireEvent.change(box, { target: { value: '/' } })
    const list = screen.getByRole('listbox', { name: 'Skills' })
    expect(within(list).getAllByRole('option')).toHaveLength(2)
    fireEvent.keyDown(box, { key: 'ArrowDown' })
    fireEvent.keyDown(box, { key: 'Enter' })
    expect(onSubmit).not.toHaveBeenCalled()
    expect(box.value).toBe('')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Turn off Two-minute start' })).toBeInTheDocument()
  })

  it('narrows the list as the member types and turns the skill off with Backspace in an empty box', () => {
    render(<Harness />)
    const box = screen.getByRole('textbox', { name: 'Message' }) as HTMLTextAreaElement
    fireEvent.change(box, { target: { value: '/foc' } })
    const option = screen.getByRole('option', { name: /Focus rounds/ })
    fireEvent.click(option)
    expect(screen.getByRole('button', { name: 'Turn off Focus rounds' })).toBeInTheDocument()
    fireEvent.keyDown(box, { key: 'Backspace' })
    expect(screen.queryByRole('button', { name: 'Turn off Focus rounds' })).not.toBeInTheDocument()
  })

  it('closes the list on Escape and sends the text as a normal message', () => {
    const onSubmit = vi.fn()
    render(<Harness onSubmit={onSubmit} />)
    const box = screen.getByRole('textbox', { name: 'Message' }) as HTMLTextAreaElement
    fireEvent.change(box, { target: { value: '/shrug' } })
    expect(screen.getByText(/No skill matches/)).toBeInTheDocument()
    fireEvent.keyDown(box, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    fireEvent.keyDown(box, { key: 'Enter' })
    expect(onSubmit).toHaveBeenCalledWith({ text: '/shrug' })
  })

  it('shows no skill controls without skills', () => {
    render(<PromptInput onSubmit={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Message' }), { target: { value: '/' } })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Skills' })).not.toBeInTheDocument()
  })
})
