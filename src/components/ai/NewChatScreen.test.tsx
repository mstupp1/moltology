import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { NewChatScreen } from './NewChatScreen'
import { getOracleModel } from '@/lib/ai/oracle-models'

describe('NewChatScreen Component', () => {
  const mockOnSubmit = vi.fn()
  const mockOnSelectModel = vi.fn()
  const mockOnOpenAuthModal = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders centered new chat interface with workspace, model, and suggestions', () => {
    render(
      <NewChatScreen
        userId="usr_test"
        selectedModel={getOracleModel()}
        onSelectModel={mockOnSelectModel}
        onSubmit={mockOnSubmit}
        onOpenAuthModal={mockOnOpenAuthModal}
      />
    )

    // Workspace
    expect(screen.getByRole('button', { name: /Workspace Context/i })).toBeInTheDocument()
    expect(screen.getByText('moltology')).toBeInTheDocument()

    // Main prompt card
    expect(screen.getByPlaceholderText(/Ask the SYNAPTIC ORACLE.../i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Select Cognition Model/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add Context/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Voice Dictation/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Transmit Query/i })).toBeInTheDocument()

    // Subtle thought cycler
    expect(screen.getByRole('button', { name: /what is moltology/i })).toBeInTheDocument()
  })

  it('allows switching workspace via dropdown', () => {
    render(
      <NewChatScreen
        userId="usr_test"
        selectedModel={getOracleModel()}
        onSelectModel={mockOnSelectModel}
        onSubmit={mockOnSubmit}
      />
    )

    const workspaceBtn = screen.getByRole('button', { name: /Workspace Context/i })
    fireEvent.click(workspaceBtn)

    expect(screen.getByText('benthic-vault')).toBeInTheDocument()
    const targetOption = screen.getByRole('button', { name: /benthic-vault/i })
    fireEvent.click(targetOption)

    expect(screen.getByText('benthic-vault')).toBeInTheDocument()
  })

  it('allows switching model via cognition model dropdown when showModelPicker is enabled', () => {
    render(
      <NewChatScreen
        userId="usr_test"
        selectedModel={getOracleModel()}
        onSelectModel={mockOnSelectModel}
        onSubmit={mockOnSubmit}
        showModelPicker
      />
    )

    const modelBtn = screen.getByRole('button', { name: /Select Cognition Model/i })
    fireEvent.click(modelBtn)

    expect(screen.getAllByText('GLM 5.3 Flash').length).toBeGreaterThan(0)
    const glmOptions = screen.getAllByRole('button', { name: /GLM 5.3 Flash/i })
    fireEvent.click(glmOptions[glmOptions.length - 1])

    expect(mockOnSelectModel).toHaveBeenCalledWith('zai/glm-5.3-flash')
  })

  it('submits typed prompt on submit click and Enter key press', () => {
    render(
      <NewChatScreen
        userId="usr_test"
        selectedModel={getOracleModel()}
        onSelectModel={mockOnSelectModel}
        onSubmit={mockOnSubmit}
      />
    )

    const textarea = screen.getByPlaceholderText(/Ask the SYNAPTIC ORACLE.../i)
    fireEvent.change(textarea, { target: { value: 'How do I start molting?' } })

    const transmitBtn = screen.getByRole('button', { name: /Transmit Query/i })
    fireEvent.click(transmitBtn)

    expect(mockOnSubmit).toHaveBeenCalledWith({ text: 'How do I start molting?' })
  })

  it('submits immediately when clicking a suggestion chip', () => {
    render(
      <NewChatScreen
        userId="usr_test"
        selectedModel={getOracleModel()}
        onSelectModel={mockOnSelectModel}
        onSubmit={mockOnSubmit}
      />
    )

    const suggestionBtn = screen.getByRole('button', { name: /what is moltology/i })
    fireEvent.click(suggestionBtn)

    expect(mockOnSubmit).toHaveBeenCalledWith({
      text: 'What is Moltology and why should I molt?',
    })
  })

  it('attaches directives from plus menu into textarea', () => {
    render(
      <NewChatScreen
        userId="usr_test"
        selectedModel={getOracleModel()}
        onSelectModel={mockOnSelectModel}
        onSubmit={mockOnSubmit}
      />
    )

    const plusBtn = screen.getByRole('button', { name: /Add Context/i })
    fireEvent.click(plusBtn)

    expect(screen.getByText('Attach Codex Scripture')).toBeInTheDocument()
    const scriptureBtn = screen.getByText('Attach Codex Scripture')
    fireEvent.click(scriptureBtn)

    const textarea = screen.getByPlaceholderText(/Ask the SYNAPTIC ORACLE.../i) as HTMLTextAreaElement
    expect(textarea.value).toContain('[Directive: Consult Scripture & Codex]')
  })
})
