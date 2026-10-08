import { describe, expect, it } from 'vitest'
import { CONTACT_COPY, contactTopicLabel, parseContactTopic, validateContactFields } from './contact-form'

describe('contact form helpers', () => {
  it('normalizes valid fields', () => {
    expect(
      validateContactFields({ name: '  Tester\n Crab ', email: ' A@B.co ', message: ' <b>Hello</b> there, crab ' }),
    ).toEqual({ ok: true, name: 'Tester Crab', email: 'a@b.co', message: 'Hello there, crab' })
  })

  it('reports the first failing constraint', () => {
    expect(validateContactFields({ name: '', email: 'a@b.co', message: 'long enough text' })).toEqual({
      ok: false,
      error: CONTACT_COPY.nameRequired,
    })
    expect(validateContactFields({ name: 'A', email: 'nope', message: 'long enough text' })).toEqual({
      ok: false,
      error: CONTACT_COPY.emailRequired,
    })
    expect(validateContactFields({ name: 'A', email: 'a@b.co', message: 'short' })).toEqual({
      ok: false,
      error: CONTACT_COPY.messageRequired,
    })
  })

  it('parses topics with a general fallback', () => {
    expect(parseContactTopic('CAREERS')).toBe('careers')
    expect(parseContactTopic('doctrine')).toBe('general')
    expect(contactTopicLabel('press')).toBe('Press & partnerships')
  })
})
