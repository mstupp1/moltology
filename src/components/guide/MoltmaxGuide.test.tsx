import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { MoltmaxGuideCard } from '@/components/guide/MoltmaxGuideCard'
import { MoltmaxGuideModal } from '@/components/guide/MoltmaxGuideModal'
import { MoltmaxGuideFloatingPill } from '@/components/guide/MoltmaxGuideFloatingPill'
import { submitLeadHandler } from '@/lib/server/db-services'

vi.mock('@/lib/server/api', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    submitLeadFn: vi.fn(async ({ data }: any) => {
      return {
        success: true,
        isExisting: false,
        email: data?.email,
        downloadUrl: '/downloads/the-2026-moltmaxxing-protocol-guide.pdf',
        message: 'Decryption verified.',
      }
    }),
  }
})

describe('Moltmax Guide Lead Capture Components', () => {
  it('renders MoltmaxGuideCard with price anchoring, features, and opt-in checkbox', () => {
    render(<MoltmaxGuideCard />)

    expect(screen.getByText(/DOWNLOAD THE DEFINITIVE 2026/i)).toBeDefined()
    expect(screen.getByText(/REGULAR \$149\.00/i)).toBeDefined()
    expect(screen.getByText(/\$0\.00 \(100% FREE TODAY\)/i)).toBeDefined()
    expect(screen.getByText(/The 24-Hour Ecdysis Protocol/i)).toBeDefined()
    expect(screen.getByText(/400–600 Nm Pincer Grip Holds/i)).toBeDefined()
    expect(screen.getByPlaceholderText(/Enter email to claim free copy\.\.\./i)).toBeDefined()
    expect(screen.getByText(/Send me occasional updates, new field manuals, and articles/i)).toBeDefined()
  })

  it('renders MoltmaxGuideModal when open and supports email submission with opt-in', async () => {
    const onClose = vi.fn()
    const onOpenAuthSignup = vi.fn()

    render(
      <MoltmaxGuideModal
        isOpen={true}
        onClose={onClose}
        onOpenAuthSignup={onOpenAuthSignup}
      />
    )

    expect(screen.getByText(/GET THE 2026/i)).toBeDefined()
    expect(screen.getByText(/VALUE \$149\.00 USD/i)).toBeDefined()
    expect(screen.getByText(/FREE TODAY \(\$0\.00\)/i)).toBeDefined()

    const optInCheckbox = screen.getByRole('checkbox')
    expect(optInCheckbox).toBeDefined()
    expect(optInCheckbox).not.toBeChecked()

    fireEvent.click(optInCheckbox)
    expect(optInCheckbox).toBeChecked()

    const emailInput = screen.getByPlaceholderText(/initiate@benthic-core\.org/i)
    fireEvent.change(emailInput, { target: { value: 'initiate@moltology.org' } })

    const submitBtn = screen.getByRole('button', { name: /CLAIM 100% FREE FIELD MANUAL/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/YOUR FIELD MANUAL IS READY!/i)).toBeDefined()
      expect(screen.getByText(/BIND TELEMETRY TO FREE BENTHIC ACCOUNT/i)).toBeDefined()
    })

    const activateBtn = screen.getByRole('button', { name: /ACTIVATE FREE MOLTOLOGY ACCOUNT/i })
    fireEvent.click(activateBtn)
    expect(onOpenAuthSignup).toHaveBeenCalledWith('initiate@moltology.org')
  })

  it('renders MoltmaxGuideFloatingPill correctly', () => {
    const onOpen = vi.fn()
    render(<MoltmaxGuideFloatingPill onOpenGuideModal={onOpen} />)
    expect(screen.getByText(/2026 Moltmax Field Manual/i)).toBeDefined()
    expect(screen.getByText(/FREE PROTOCOL/i)).toBeDefined()
  })

  it('submitLeadHandler validates email and returns downloadUrl', async () => {
    const res = await submitLeadHandler({
      data: {
        email: 'test-initiate@benthic.org',
        source: 'test_suite',
      },
    })

    expect(res.success).toBe(true)
    expect(res.email).toBe('test-initiate@benthic.org')
    expect(res.downloadUrl).toContain('downloads/the-2026-moltmaxxing-protocol-guide.pdf')
  })
})
