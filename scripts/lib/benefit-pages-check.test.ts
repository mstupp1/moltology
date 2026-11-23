import { describe, expect, it } from 'vitest'
import { BENEFIT_PAGES } from '../../src/lib/benefits/summaries'
import type { BenefitPage } from '../../src/lib/benefits/types'
import { checkBenefitPages } from './benefit-pages-check'

const modules = import.meta.glob<{ default: BenefitPage }>('../../src/lib/benefits/pages/*.ts', { eager: true })
const pages = Object.values(modules).map((mod) => mod.default)

describe('benefit pages', () => {
  it('pass the content and SEO rules', () => {
    const errors = checkBenefitPages(BENEFIT_PAGES, pages).filter((issue) => issue.level === 'error')
    expect(errors).toEqual([])
  })

  it('flags long titles, missing disclaimers and copy shared between pages', () => {
    const libido = pages.find((page) => page.slug === 'libido')!
    const broken = {
      ...libido,
      title: 'A title that is far too long to fit in a search result snippet | Moltology',
      disclaimer: undefined,
    } as BenefitPage
    const twin = { ...libido, slug: 'twin', topic: 'Twin', related: ['libido', 'spirituality'] } as BenefitPage
    const rules = checkBenefitPages(
      [...BENEFIT_PAGES, { slug: 'twin', topic: 'Twin', kit: 'clinic', blurb: '', indexed: libido.indexed, updated: libido.updated }],
      [broken, twin, ...pages.filter((page) => page.slug !== 'libido')],
    ).map((issue) => `${issue.slug}:${issue.rule}`)
    expect(rules).toContain('libido:title-length')
    expect(rules).toContain('libido:disclaimer')
    expect(rules).toContain('twin:duplicate-copy')
  })

  it('flags reveal questions in FAQs, invented outcomes and reused hooks', () => {
    const [first, second, ...rest] = pages
    const noisy = {
      ...first,
      faqs: [...first.faqs, { question: 'How much does it cost?', answer: 'Nothing.' }],
      hook: { ...first.hook, text: 'Most members feel calmer within the first week.' },
    } as BenefitPage
    const copycat = { ...second, hook: { ...second.hook, href: first.hook.href } } as BenefitPage
    const rules = checkBenefitPages(BENEFIT_PAGES, [noisy, copycat, ...rest]).map((issue) => `${issue.slug}:${issue.rule}`)
    expect(rules).toContain(`${first.slug}:faq-intent`)
    expect(rules).toContain(`${first.slug}:claim`)
    expect(rules).toContain(`${second.slug}:hook-reused`)
  })
  it('flags keyword-style FAQ questions, answers that point at the page and British spelling', () => {
    const [first, ...rest] = pages
    const noisy = {
      ...first,
      faqs: [...first.faqs, { question: 'How to stay calm?', answer: 'Read the linked passage and practise daily.' }],
    } as BenefitPage
    const rules = checkBenefitPages(BENEFIT_PAGES, [noisy, ...rest]).map((issue) => `${issue.slug}:${issue.rule}`)
    expect(rules).toContain(`${first.slug}:faq-grammar`)
    expect(rules).toContain(`${first.slug}:faq-standalone`)
    expect(rules).toContain(`${first.slug}:spelling`)
  })
})
