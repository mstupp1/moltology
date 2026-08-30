import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Message } from './message'

describe('Message Component Avatar Rendering', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders UserAvatar with image for user message when user image is provided', () => {
    const user = {
      name: 'Carcinus Unit',
      email: 'carcinus@moltology.org',
      image: 'https://example.com/avatar.jpg',
    }

    render(
      <Message from="user" user={user} senderLabel="claw_lord">
        <div>Testing user message</div>
      </Message>
    )

    const img = screen.getByRole('img', { name: /claw_lord/i })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    expect(screen.getByText('claw_lord')).toBeInTheDocument()
  })

  it('renders UserAvatar with fallback letter for user message when user has no image', () => {
    const user = {
      name: 'Deep Zealot',
      email: 'zealot@moltology.org',
    }

    render(
      <Message from="user" user={user} senderLabel="pincer_prime">
        <div>Testing fallback letter</div>
      </Message>
    )

    expect(screen.getByText('p')).toBeInTheDocument()
    expect(screen.getByText('pincer_prime')).toBeInTheDocument()
  })

  it('renders letter fallback for user message when no profile image is set', () => {
    render(
      <Message from="user" senderLabel="INITIATE">
        <div>Testing letter fallback in chat</div>
      </Message>
    )

    expect(screen.getByText('I')).toBeInTheDocument()
    expect(screen.getByText('INITIATE')).toBeInTheDocument()
  })

  it('does not use the auth display name when no designation is provided', () => {
    render(
      <Message from="user" user={{ name: 'Ellis', email: 'ellis@example.com' }}>
        <div>Oracle should not inherit Ellis</div>
      </Message>
    )

    expect(screen.getByText('INITIATE')).toBeInTheDocument()
    expect(screen.queryByText('ELLIS')).not.toBeInTheDocument()
  })

  it('renders custom avatar if avatar prop is supplied', () => {
    render(
      <Message from="user" avatar={<span data-testid="custom-avatar">🦞</span>}>
        <div>Testing custom node avatar</div>
      </Message>
    )

    expect(screen.getByTestId('custom-avatar')).toBeInTheDocument()
  })

  it('renders Oracle emblem for assistant messages', () => {
    render(
      <Message from="assistant" senderLabel="SYNAPTIC ORACLE">
        <div>Oracle wisdom transmission</div>
      </Message>
    )

    const oracleImg = screen.getByRole('img', { name: 'SYNAPTIC ORACLE' })
    expect(oracleImg).toBeInTheDocument()
    expect(oracleImg.getAttribute('src')).toContain('order_emblem.png')
    expect(screen.getByText('SYNAPTIC ORACLE')).toBeInTheDocument()
  })

  it('renders MessageThinkingDots with accessible role and animation dots', async () => {
    const { MessageThinkingDots } = await import('./message')
    render(<MessageThinkingDots />)

    const status = screen.getByRole('status')
    expect(status).toBeInTheDocument()
    expect(status).toHaveAttribute('aria-label', 'Thinking...')
    expect(screen.getByText('Thinking...')).toBeInTheDocument()
  })
})

