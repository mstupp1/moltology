import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { NewsArticleBody, formatInlineMarkdown, safeInlineUrl } from './NewsArticleBody'
import { getAssetUrl } from '@/lib/assets'

describe('NewsArticleBody HUD Markdown Parser', () => {
  it('renders headings and paragraphs separately even without double newlines', () => {
    const markdown = `
### Major Heading
First paragraph text.
#### Subheading Section
Second paragraph text.
##### Deep Telemetry Header
Third paragraph text.
`
    render(<NewsArticleBody content={markdown} />)

    expect(screen.getByRole('heading', { level: 3, name: /Major Heading/i })).toBeDefined()
    expect(screen.getByRole('heading', { level: 4, name: /Subheading Section/i })).toBeDefined()
    expect(screen.getByRole('heading', { level: 5, name: /Deep Telemetry Header/i })).toBeDefined()
    expect(screen.getByText(/First paragraph text/i)).toBeDefined()
    expect(screen.getByText(/Second paragraph text/i)).toBeDefined()
    expect(screen.getByText(/Third paragraph text/i)).toBeDefined()
  })

  it('renders standalone markdown image as a HUD figure card with caption and resolved asset URL', () => {
    const markdown = `
Intro text before image.

![Sub-Oceanic Nitrogen Pod](images/nitrogen-pod.jpg)

Outro text after image.
`
    render(<NewsArticleBody content={markdown} />)

    const img = screen.getByRole('img', { name: /Sub-Oceanic Nitrogen Pod/i })
    expect(img).toBeDefined()
    expect(img.getAttribute('src')).toBe(getAssetUrl('images/nitrogen-pod.jpg'))
    expect(screen.getByText(/Sub-Oceanic Nitrogen Pod/i)).toBeDefined()
  })

  it('preserves raw angle brackets like <15ms without breaking HTML paragraph rendering', () => {
    const markdown = `
Execution Latency is <15ms (Streaming) and pressure is >50000 Fathoms with **chitin armor**.
`
    render(<NewsArticleBody content={markdown} />)

    expect(screen.getByText(/<15ms \(Streaming\)/i)).toBeDefined()
    expect(screen.getByText(/>50000 Fathoms/i)).toBeDefined()
    expect(screen.getByText(/chitin armor/i)).toBeDefined()
  })

  it('places an authored image caption inside the figure without a second description', () => {
    const { container } = render(<NewsArticleBody content={`![Robot illustration](images/robot.png)

*Conceptual illustration: imagined equipment, not test evidence.*

The article continues here.`} />)

    const caption = container.querySelector('figcaption')!
    expect(caption.textContent).toBe('Conceptual illustration: imagined equipment, not test evidence.')
    expect(screen.getAllByText(/imagined equipment, not test evidence/)).toHaveLength(1)
    expect(screen.queryByText('Robot illustration')).toBeNull()
    expect(screen.getByRole('img', { name: 'Robot illustration' })).toBeDefined()
    expect(screen.getByText('The article continues here.').closest('figure')).toBeNull()
  })

  it('supports multiline underscore captions and preserves linked attribution', () => {
    const { container } = render(<NewsArticleBody content={`![Equipment](images/equipment.png)
_Conceptual illustration.
Credit: [Source](https://example.com)._

## Next section`} />)

    expect(container.querySelector('figcaption')?.textContent).toBe('Conceptual illustration. Credit: Source.')
    expect(screen.getByRole('link', { name: 'Source' }).closest('figcaption')).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Next section' })).toBeDefined()
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

describe('inline markdown links', () => {
  it('drops script URLs and keeps quotes out of attributes', () => {
    const html = formatInlineMarkdown('[click](javascript:alert(1)) [ok](https://e.com/a"onmouseover="x) ![a"b](data:image/svg+xml,x)')
    expect(html).not.toContain('javascript:')
    expect(html).not.toContain('data:image')
    expect(html).not.toMatch(/"\s*onmouseover=/)
    expect(html).toContain('href="https://e.com/a&amp;quot;onmouseover=&amp;quot;x"')
  })

  it('allows http(s), mailto and site-relative links', () => {
    expect(safeInlineUrl('https://moltology.org')).toBe('https://moltology.org')
    expect(safeInlineUrl('/codex')).toBe('/codex')
    expect(safeInlineUrl('mailto:support@moltology.org')).toBe('mailto:support@moltology.org')
    expect(safeInlineUrl('images/news/cover.jpg')).toBe('images/news/cover.jpg')
    expect(safeInlineUrl('//evil.example')).toBeNull()
    expect(safeInlineUrl('JavaScript:alert(1)')).toBeNull()
  })
})
