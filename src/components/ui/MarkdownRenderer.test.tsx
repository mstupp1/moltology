import { describe, it, expect } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import { MarkdownRenderer } from './MarkdownRenderer'

describe('MarkdownRenderer Component', () => {
  it('returns null when content is empty', () => {
    const { container } = render(<MarkdownRenderer content="" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders plain text paragraphs correctly', () => {
    const { getByText } = render(<MarkdownRenderer content="Hello initiate welcome to Moltology" />)
    expect(getByText('Hello initiate welcome to Moltology')).toBeInTheDocument()
  })

  it('renders markdown headers, bold text, and inline code', () => {
    const markdown = `# Ascendance Protocol\n\nUse \`stage3\` for **Soft-Shed** status.`
    const { getByText } = render(<MarkdownRenderer content={markdown} />)

    expect(getByText('Ascendance Protocol')).toBeInTheDocument()
    expect(getByText('stage3')).toBeInTheDocument()
    expect(getByText('Soft-Shed')).toBeInTheDocument()
  })

  it('renders fenced code blocks with language badge', () => {
    const markdown = "```typescript\nconst status = 'ascended';\n```"
    const { getByText } = render(<MarkdownRenderer content={markdown} />)

    expect(getByText(/typescript/i)).toBeInTheDocument()
    expect(getByText("const status = 'ascended';")).toBeInTheDocument()
  })
})
