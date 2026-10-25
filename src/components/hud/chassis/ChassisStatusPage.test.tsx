import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ChassisStatusPage } from './ChassisStatusPage'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { getChassisLoadoutFn, saveCharacterFn } from '@/lib/server/api'
import {
  clearChassisLoadoutCache,
  setCachedChassisLoadout,
  type ChassisLoadoutPayload,
} from '@/lib/chassis-loadout'
import {
  ALL_EQUIPMENT_CATALOG,
  STARTER_EQUIPMENT_CATALOG_IDS,
  STARTER_EQUIPPED_SLOTS,
} from '@/lib/equipment-seed-data'
vi.mock('@/hooks/useAuthSession', () => ({ useAuthSession: () => ({ userId: 'user-1' }) }))
vi.mock('@/lib/jwt', () => ({ getAuthJWTToken: vi.fn().mockResolvedValue('token') }))
vi.mock('@/lib/server/api', () => ({ getChassisLoadoutFn: vi.fn(), saveCharacterFn: vi.fn() }))
vi.mock('@/hooks/useHudPersist', () => ({
  useHudPersist: () => ({ begin: vi.fn(), end: vi.fn() }),
}))
vi.mock('../avatar/AvatarCreatorPreview', () => ({
  AvatarCreatorPreview: ({ config }: any) => (
    <div data-testid="preview" data-config={JSON.stringify(config)} />
  ),
}))
vi.mock('../avatar/AvatarCreatorPanel', () => ({
  AvatarCreatorPanel: ({ value, onChange }: any) => (
    <button onClick={() => onChange({ ...value, race: 'crab' })}>Become crab</button>
  ),
}))
const payload: ChassisLoadoutPayload = {
  catalog: ALL_EQUIPMENT_CATALOG,
  items: STARTER_EQUIPMENT_CATALOG_IDS.map((id, i) => ({
    id: `b1000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
    catalogItemId: id,
    equippedSlot: i < 7 ? STARTER_EQUIPPED_SLOTS[i] : null,
    vaultIndex: i < 7 ? null : i - 7,
  })),
  vaultSize: 20,
  totals: { attack: 0, defense: 0, intelligence: 0, perception: 0, speed: 0 },
  config: { style: 'critters', seed: 'saved', race: 'lobster' },
  appearanceRevision: 4,
}
const preview = () => JSON.parse(screen.getByTestId('preview').getAttribute('data-config')!)
async function mount() {
  render(
    <ToastProvider>
      <ChassisStatusPage />
    </ToastProvider>,
  )
  await screen.findByTestId('preview')
}
function choose(name: string) {
  fireEvent.click(screen.getByRole('button', { name: `${name}, Head` }))
}
describe('unified character workspace', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearChassisLoadoutCache()
    vi.mocked(getChassisLoadoutFn).mockResolvedValue(structuredClone(payload))
    vi.mocked(saveCharacterFn).mockImplementation(async ({ data }: any) => ({
      ...structuredClone(payload),
      config: data.config,
      appearanceRevision: 5,
      items: data.placements.map((p: any) => ({
        ...payload.items.find((i) => i.id === p.id),
        ...p,
      })),
    }))
  })
  it('shows a live loadout, owned and preview pieces, with no usable powers', async () => {
    await mount()
    expect(preview().equipment.head.visualKey).toBe('soft-shell-visor')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    expect(screen.getAllByText('Preview only').length).toBeGreaterThan(0)
    expect(screen.queryByText('Ready')).not.toBeInTheDocument()
    expect(
      screen.getByText('Loadout stats · character flavor').closest('details'),
    ).not.toHaveAttribute('open')
  })
  it('keeps owned equipment local until save, and discards it completely', async () => {
    await mount()
    choose('Bow')
    fireEvent.click(screen.getByRole('button', { name: 'Equip on head' }))
    expect(preview().equipment.head.visualKey).toBe('creator-bow')
    expect(saveCharacterFn).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }))
    expect(preview().equipment.head.visualKey).toBe('soft-shell-visor')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
  })
  it('never includes an unowned try-on in saved configuration or placements', async () => {
    await mount()
    choose('Oracle Dome Lattice')
    fireEvent.click(screen.getByRole('button', { name: 'Try on' }))
    expect(preview().equipment.head.visualKey).toBe('oracle-dome-lattice')
    expect(screen.getByRole('status')).toHaveTextContent('Preview only')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    fireEvent.click(screen.getByRole('tab', { name: 'body' }))
    fireEvent.click(screen.getByRole('button', { name: 'Become crab' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(saveCharacterFn).toHaveBeenCalledTimes(1))
    const data = vi.mocked(saveCharacterFn).mock.calls[0][0].data
    expect(data.config.race).toBe('crab')
    expect(data.config).not.toHaveProperty('equipment')
    expect(data.expectedRevision).toBe(4)
    expect(data.placements).toHaveLength(19)
    expect(data.placements.find((i) => i.equippedSlot === 'head')?.id).toBe(payload.items[3].id)
  })
  it('retains draft edits after a rejected save and allows retry', async () => {
    vi.mocked(saveCharacterFn).mockRejectedValueOnce(
      new Error('Your character changed in another session. Reload before saving.'),
    )
    await mount()
    choose('Bow')
    fireEvent.click(screen.getByRole('button', { name: 'Equip on head' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await screen.findByText(/Your character changed in another session/)
    expect(preview().equipment.head.visualKey).toBe('creator-bow')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled()
  })
  it('lets both pincer slots use independently owned instances', async () => {
    await mount()
    fireEvent.click(screen.getByRole('button', { name: /^Right pincer/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Mitten gauntlet, Claws' }))
    fireEvent.click(screen.getByRole('button', { name: 'Equip on right pincer' }))
    fireEvent.click(screen.getByRole('button', { name: /^Left pincer/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Slender gauntlet, Claws' }))
    fireEvent.click(screen.getByRole('button', { name: 'Equip on left pincer' }))
    expect(preview().equipment['claws-1'].visualKey).toBe('creator-mitten')
    expect(preview().equipment['claws-2'].visualKey).toBe('creator-slim')
  })
  it('does not overwrite local edits with a delayed background refresh', async () => {
    setCachedChassisLoadout('user-1', structuredClone(payload))
    let finish!: (value: ChassisLoadoutPayload) => void
    vi.mocked(getChassisLoadoutFn).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    await mount()
    await waitFor(() => expect(getChassisLoadoutFn).toHaveBeenCalledTimes(1))
    choose('Bow')
    fireEvent.click(screen.getByRole('button', { name: 'Equip on head' }))
    await act(async () => finish(structuredClone(payload)))
    expect(preview().equipment.head.visualKey).toBe('creator-bow')
  })
})
