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
      <Message from="user" user={user}>
        <div>Testing user message</div>
      </Message>
    )

    const img = screen.getByRole('img', { name: /carcinus unit/i })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    expect(screen.getByText('CARCINUS UNIT')).toBeInTheDocument()
  })

  it('renders UserAvatar with fallback letter for user message when user has no image', () => {
    const user = {
      name: 'Deep Zealot',
      email: 'zealot@moltology.org',
    }

    render(
      <Message from="user" user={user}>
        <div>Testing fallback letter</div>
      </Message>
    )

    expect(screen.getByText('D')).toBeInTheDocument()
    expect(screen.getByText('DEEP ZEALOT')).toBeInTheDocument()
  })

  it('renders active bioforge vault avatar from localStorage for user message', () => {
    localStorage.setItem(
      'moltology_saved_avatars',
      JSON.stringify([
        {
          id: 'custom-ascendant',
          name: 'Ascendant Lobster',
          imageUrl: 'https://assets.moltology.org/images/stage4_carcinization.png',
          isActive: true,
        },
      ])
    )

    render(
      <Message from="user" senderLabel="INITIATE">
        <div>Testing vault avatar in chat</div>
      </Message>
    )

    const img = screen.getByRole('img', { name: 'INITIATE' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute(
      'src',
      'https://assets.moltology.org/images/stage4_carcinization.png'
    )
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

