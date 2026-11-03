import React from 'react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SynapticEntityCanvas } from './SynapticEntityCanvas'
import { createOracleEntityBridge } from '@/lib/ai/oracle-entity-bridge'

describe('SynapticEntityCanvas', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the fallback orb in non-WebGL environments and does not register pointer movement handlers', () => {
    const bridge = createOracleEntityBridge()
    render(<SynapticEntityCanvas bridge={bridge} />)

    const container = screen.getByTestId('synaptic-entity-canvas')
    expect(container).toBeInTheDocument()
    expect(screen.getByTestId('synaptic-entity-fallback')).toBeInTheDocument()

    // Ensure pointer movement does not mutate or throw
    fireEvent.pointerMove(container, { clientX: 120, clientY: 80 })
    fireEvent.pointerLeave(container)
    expect(screen.getByTestId('synaptic-entity-fallback')).toBeInTheDocument()
  })
})
