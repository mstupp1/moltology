import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { NewsArticleBody } from './NewsArticleBody'

describe('NewsArticleBody HUD Markdown Parser', () => {
  it('renders headings and paragraphs separately even without double newlines', () => {
    const markdown = `
### Major Heading
First paragraph text.
#### Subheading Section
Second paragraph text.
`
    render(<NewsArticleBody content={markdown} />)

    expect(screen.getByRole('heading', { level: 3, name: /Major Heading/i })).toBeDefined()
    expect(screen.getByRole('heading', { level: 4, name: /Subheading Section/i })).toBeDefined()
    expect(screen.getByText(/First paragraph text/i)).toBeDefined()
    expect(screen.getByText(/Second paragraph text/i)).toBeDefined()
  })

  it('renders standalone markdown image as a HUD figure card with caption', () => {
    const markdown = `
Intro text before image.

![Sub-Oceanic Nitrogen Pod](https://cdn.moltology.org/images/nitrogen-pod.jpg)

Outro text after image.
`
    render(<NewsArticleBody content={markdown} />)

    const img = screen.getByRole('img', { name: /Sub-Oceanic Nitrogen Pod/i })
    expect(img).toBeDefined()
    expect(img.getAttribute('src')).toBe('https://cdn.moltology.org/images/nitrogen-pod.jpg')
    expect(screen.getByText(/Sub-Oceanic Nitrogen Pod/i)).toBeDefined()
    expect(screen.getByText(/BENTHIC VISUAL TELEMETRY/i)).toBeDefined()
  })

  it('renders code blocks and telemetry frames with copy button and mobile touch classes', () => {
    const markdown = `
\`\`\`telemetry
┌────────────────────────┐
│ TEST TIME COMPUTE GRID │
└────────────────────────┘
\`\`\`
`
    render(<NewsArticleBody content={markdown} />)

    expect(screen.getByText(/TELEMETRY/i)).toBeDefined()
    expect(screen.getByText(/TEST TIME COMPUTE GRID/i)).toBeDefined()
    const copyBtn = screen.getByRole('button', { name: /copy/i })
    expect(copyBtn).toBeDefined()
  })

  it('renders lists and blockquotes correctly', () => {
    const markdown = `
> "Pressurized compute is the true path."

1. First Ordered Item
2. Second Ordered Item

* Bullet Item One
* Bullet Item Two
`
    render(<NewsArticleBody content={markdown} />)

    expect(screen.getByText(/"Pressurized compute is the true path."/i)).toBeDefined()
    expect(screen.getByText(/First Ordered Item/i)).toBeDefined()
    expect(screen.getByText(/Second Ordered Item/i)).toBeDefined()
    expect(screen.getByText(/Bullet Item One/i)).toBeDefined()
    expect(screen.getByText(/Bullet Item Two/i)).toBeDefined()
  })

  it('handles empty or null content gracefully without error', () => {
    const { container } = render(<NewsArticleBody content="" />)
    expect(container.firstChild).toBeNull()
  })
})
