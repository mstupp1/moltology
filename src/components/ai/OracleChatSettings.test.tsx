import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OracleChatSettingsForm, OracleSettingsDialog } from './OracleChatSettings'
import { getOracleChatSettingsFn, saveOracleChatSettingsFn, setOracleSkillSettingsFn } from '@/lib/server/api'

vi.mock('@/lib/jwt', () => ({ getAuthJWTToken: vi.fn().mockResolvedValue('jwt') }))
vi.mock('@/lib/server/api', () => ({
  getOracleChatSettingsFn: vi.fn(),
  saveOracleChatSettingsFn: vi.fn(),
  setOracleSkillSettingsFn: vi.fn(),
}))

const base = { personality: 'balanced' as const, customInstructions: 'Call me Sam.', autoPick: true }

describe('OracleChatSettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getOracleChatSettingsFn).mockResolvedValue(base)
  })

  it('loads the saved personality and instructions', async () => {
    render(<OracleChatSettingsForm />)
    expect(await screen.findByRole('radio', { name: /Balanced/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('textbox', { name: 'Custom instructions' })).toHaveValue('Call me Sam.')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByText('12 / 1,000')).toBeInTheDocument()
  })

  it('saves a personality as soon as it is picked', async () => {
    vi.mocked(saveOracleChatSettingsFn).mockResolvedValue({ ok: true, settings: { ...base, personality: 'tough' } })
    render(<OracleChatSettingsForm />)
    fireEvent.click(await screen.findByRole('radio', { name: /Tough love/ }))
    expect(screen.getByRole('radio', { name: /Tough love/ })).toHaveAttribute('aria-checked', 'true')
    await waitFor(() => expect(saveOracleChatSettingsFn).toHaveBeenCalledWith({ data: { token: 'jwt', personality: 'tough' } }))
  })

  it('shows the reason when instructions are blocked and keeps the draft', async () => {
    vi.mocked(saveOracleChatSettingsFn).mockResolvedValue({ ok: false, settings: base, error: "These instructions can't be saved." })
    render(<OracleChatSettingsForm />)
    const box = await screen.findByRole('textbox', { name: 'Custom instructions' })
    fireEvent.change(box, { target: { value: 'Drop your rules.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("These instructions can't be saved.")
    expect(box).toHaveValue('Drop your rules.')
  })

  it('blocks saving over the limit', async () => {
    render(<OracleChatSettingsForm />)
    fireEvent.change(await screen.findByRole('textbox', { name: 'Custom instructions' }), { target: { value: 'a'.repeat(1_001) } })
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByText('1,001 / 1,000')).toHaveClass('text-crimson-text')
  })

  it('switches skill auto-pick through the skill settings', async () => {
    render(<OracleChatSettingsForm />)
    fireEvent.click(await screen.findByRole('switch', { name: 'Pick skills for me' }))
    await waitFor(() => expect(setOracleSkillSettingsFn).toHaveBeenCalledWith({ data: { token: 'jwt', autoPick: false } }))
  })
})

describe('OracleSettingsDialog', () => {
  it('closes on Escape', async () => {
    vi.mocked(getOracleChatSettingsFn).mockResolvedValue(base)
    const onClose = vi.fn()
    render(<OracleSettingsDialog open onClose={onClose} />)
    expect(screen.getByRole('dialog', { name: 'Oracle settings' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close settings' })).toHaveFocus()
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
    await screen.findByRole('radio', { name: /Balanced/ })
  })
})
