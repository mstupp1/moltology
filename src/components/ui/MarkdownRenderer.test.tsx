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

  it('renders standard GFM tables with header and row cells', () => {
    const tableMarkdown = `
| Vector | Function | Consequence of Failure |
|---|---|---|
| Sleep 7h+ | Neural chitin crystallizes during REM | Carapace stays porous |
| Electrolyte Load | Conductive signaling optimization | Pincer torque drops |
`
    const { getByRole, getAllByRole, getByText } = render(<MarkdownRenderer content={tableMarkdown} />)

    expect(getByRole('table')).toBeInTheDocument()
    expect(getByText('Vector')).toBeInTheDocument()
    expect(getByText('Function')).toBeInTheDocument()
    expect(getByText('Consequence of Failure')).toBeInTheDocument()
    expect(getByText('Sleep 7h+')).toBeInTheDocument()
    expect(getByText('Neural chitin crystallizes during REM')).toBeInTheDocument()
    expect(getByText('Pincer torque drops')).toBeInTheDocument()
    expect(getAllByRole('row').length).toBe(3) // 1 header row + 2 data rows
  })

  it('renders blockquotes, unordered/ordered lists, and horizontal rules', () => {
    const markdown = `
> AWAITING ACOLYTE INPUT.

---

- Bullet item one
- Bullet item two

1. Numbered item one
2. Numbered item two
`
    const { getByText, container } = render(<MarkdownRenderer content={markdown} />)

    expect(getByText('AWAITING ACOLYTE INPUT.')).toBeInTheDocument()
    expect(container.querySelector('blockquote')).toBeInTheDocument()
    expect(container.querySelector('hr')).toBeInTheDocument()
    expect(getByText('Bullet item one')).toBeInTheDocument()
    expect(getByText('Numbered item one')).toBeInTheDocument()
    expect(container.querySelector('ul')).toBeInTheDocument()
    expect(container.querySelector('ol')).toBeInTheDocument()
  })
})

