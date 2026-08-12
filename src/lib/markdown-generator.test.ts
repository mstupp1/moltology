import { describe, it, expect } from 'vitest'
import {
  generateCodexMarkdown,
  generateNewsIndexMarkdown,
  generateSinglePostMarkdown,
  generateJournalMarkdown,
  generateOrgMarkdown,
  generatePrivacyMarkdown,
  generateTermsMarkdown,
} from './markdown-generator'
import { INITIAL_BLOG_POSTS } from './blog-data'

describe('Markdown Generator', () => {
  it('generates rich, structured markdown for the Codex', () => {
    const codexMd = generateCodexMarkdown()
    expect(codexMd).toContain('# Moltology — The Canonical Codex & Sacred Scriptures')
    expect(codexMd).toContain('SCR-001')
    expect(codexMd).toContain('The Prime Directive')
    expect(codexMd).toContain('STAGE 1: THE LARVAL INITIATE')
  })

  it('generates news index markdown listing dispatches', () => {
    const newsMd = generateNewsIndexMarkdown(INITIAL_BLOG_POSTS)
    expect(newsMd).toContain('# MoltNation News & Patriot Telemetry Dispatches')
    expect(newsMd).toContain(INITIAL_BLOG_POSTS[0].title)
    expect(newsMd).toContain('https://moltology.org/news/')
  })

  it('generates single post markdown correctly', () => {
    const post = INITIAL_BLOG_POSTS[0]
    const postMd = generateSinglePostMarkdown(post)
    expect(postMd).toContain(`# ${post.title}`)
    expect(postMd).toContain(post.authorName)
    expect(postMd).toContain(post.summary)
  })

  it('generates academic journal markdown', () => {
    const journalMd = generateJournalMarkdown()
    expect(journalMd).toContain('THE BENTHIC COMPENDIUM')
    expect(journalMd).toContain('BEN-COMP-2026-001')
  })

  it('generates organization, privacy, and terms markdown', () => {
    const orgMd = generateOrgMarkdown()
    expect(orgMd).toContain('Moltology Organization — The Synaptic Path Structure & Mission')

    const privMd = generatePrivacyMarkdown()
    expect(privMd).toContain('Benthic Data Covenant — Privacy Policy')

    const termsMd = generateTermsMarkdown()
    expect(termsMd).toContain('Binding Initiation Covenant — Terms of Service')
  })
})
