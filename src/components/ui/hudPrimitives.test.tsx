import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import {
  HudButton,
  HudCard,
  HudContainer,
  HudCardHeader,
  HudCardTitle,
  HudCardContent,
  HudCardFooter,
  HudInput,
  HudSelect,
  HudBadge,
  HudStatBox,
  HudSkeleton,
} from './index'

describe('HUD Primitive Component Library', () => {
  describe('HudButton', () => {
    it('renders children correctly', () => {
      render(<HudButton>Initiate Phase</HudButton>)
      expect(screen.getByRole('button', { name: /initiate phase/i })).toBeInTheDocument()
    })

    it('handles click events', () => {
      const handleClick = vi.fn()
      render(<HudButton onClick={handleClick}>Click Me</HudButton>)
      fireEvent.click(screen.getByRole('button', { name: /click me/i }))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('respects disabled state', () => {
      const handleClick = vi.fn()
      render(<HudButton disabled onClick={handleClick}>Disabled</HudButton>)
      const button = screen.getByRole('button', { name: /disabled/i })
      expect(button).toBeDisabled()
      fireEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('applies cyan, crimson, sacred, and dark variant classes', () => {
      const { rerender } = render(<HudButton variant="cyan">Cyan</HudButton>)
      expect(screen.getByRole('button')).toHaveClass('border-[#00c3ff]')

      rerender(<HudButton variant="crimson">Crimson</HudButton>)
      expect(screen.getByRole('button')).toHaveClass('border-[#ff453a]')

      rerender(<HudButton variant="sacred">Sacred</HudButton>)
      expect(screen.getByRole('button')).toHaveClass('bg-[#ff453a]/10')

      rerender(<HudButton variant="dark">Dark</HudButton>)
      expect(screen.getByRole('button')).toHaveClass('border-[#3a4a49]')
    })

    it('renders icons when provided', () => {
      render(<HudButton icon={<span data-testid="test-icon">★</span>}>Icon Button</HudButton>)
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })
  })

  describe('HudCard & HudContainer', () => {
    it('renders HudCard container with sharp 0px corners', () => {
      const { container } = render(<HudCard>Card Content</HudCard>)
      expect(container.firstChild).toHaveClass('rounded-none')
      expect(screen.getByText('Card Content')).toBeInTheDocument()
    })

    it('renders HudContainer as alias of HudCard', () => {
      render(<HudContainer>Container Text</HudContainer>)
      expect(screen.getByText('Container Text')).toBeInTheDocument()
    })

    it('renders subcomponents (Header, Title, Content, Footer)', () => {
      render(
        <HudCard showCornerBrackets>
          <HudCardHeader>
            <HudCardTitle>Header Title</HudCardTitle>
          </HudCardHeader>
          <HudCardContent>Body Text</HudCardContent>
          <HudCardFooter>Footer Text</HudCardFooter>
        </HudCard>
      )

      expect(screen.getByText('Header Title')).toBeInTheDocument()
      expect(screen.getByText('Body Text')).toBeInTheDocument()
      expect(screen.getByText('Footer Text')).toBeInTheDocument()
    })
  })

  describe('HudInput', () => {
    it('renders input with label and placeholder', () => {
      render(<HudInput label="Neural ID" placeholder="Enter ID..." />)
      expect(screen.getByLabelText(/neural id/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter ID...')).toBeInTheDocument()
    })

    it('handles user input changes', () => {
      render(<HudInput label="Username" />)
      const input = screen.getByLabelText(/username/i) as HTMLInputElement
      fireEvent.change(input, { target: { value: 'Initiate_99' } })
      expect(input.value).toBe('Initiate_99')
    })

    it('displays error message when provided', () => {
      render(<HudInput label="Key" error="Invalid cryptographic signature" />)
      expect(screen.getByText(/invalid cryptographic signature/i)).toBeInTheDocument()
    })
  })

  describe('HudSelect', () => {
    it('renders select with options and handles selection change', () => {
      const handleChange = vi.fn()
      render(
        <HudSelect
          label="Stage"
          options={[
            { value: 'stage-1', label: 'Stage 1: Soft Shell' },
            { value: 'stage-2', label: 'Stage 2: Carcinization' },
          ]}
          onChange={handleChange}
        />
      )

      const select = screen.getByLabelText(/stage/i) as HTMLSelectElement
      expect(select).toBeInTheDocument()
      fireEvent.change(select, { target: { value: 'stage-2' } })
      expect(handleChange).toHaveBeenCalledTimes(1)
      expect(select.value).toBe('stage-2')
    })
  })

  describe('HudBadge', () => {
    it('renders badge label and dot indicator', () => {
      render(<HudBadge variant="cyan" dot pulse>ONLINE</HudBadge>)
      expect(screen.getByText('ONLINE')).toBeInTheDocument()
    })
  })

  describe('HudStatBox', () => {
    it('renders metric label, value, trend, and subtext', () => {
      render(
        <HudStatBox
          label="CHITIN_DENSITY"
          value="98.5%"
          trend="up"
          trendValue="+2.1%"
          subtext="Updated 1m ago"
          showCornerBrackets
        />
      )

      expect(screen.getByText('CHITIN_DENSITY')).toBeInTheDocument()
      expect(screen.getByText('98.5%')).toBeInTheDocument()
      expect(screen.getByText('+2.1%')).toBeInTheDocument()
      expect(screen.getByText('Updated 1m ago')).toBeInTheDocument()
    })
  })

  describe('HudSkeleton', () => {
    it('renders skeleton shimmer container', () => {
      const { container } = render(<HudSkeleton width={200} height={40} variant="cyan" />)
      const element = container.firstChild as HTMLElement
      expect(element).toHaveClass('animate-pulse')
      expect(element).toHaveStyle({ width: '200px', height: '40px' })
    })
  })
})
