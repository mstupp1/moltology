import { describe, expect, it } from 'vitest'
import { assertNoKeywordCta } from './instagram-copy-policy'

describe('Instagram reviewed-copy policy', () => {
  it.each([
    { caption: 'Comment "GUIDE" to receive the protocol.' },
    { firstComment: 'Comment QUIZ for the audit.' },
    { imagePrompt: 'Render the CTA: Drop “SAVE” below.' },
    { caption: 'Reply guide for access.' },
    { caption: 'Type the word focus below.' },
    { caption: 'I will send the link in your DMs.' },
    { commentKeyword: 'GUIDE', caption: 'Open the manual.' },
    { commentTriggerKeyword: 'QUIZ', caption: 'Save this.' },
  ])('blocks retired funnel copy: %j', (content) => {
    expect(() => assertNoKeywordCta(content)).toThrow('retired')
  })

  it.each([
    { caption: 'Save this before planning Monday.', firstComment: 'https://moltology.org/quiz' },
    { caption: 'Send this to your meeting buddy.' },
    { caption: 'Read the Moltmaxxing Protocol Guide. The link is in the first comment.' },
    { caption: 'Choose which meeting to shed.', commentKeyword: null },
  ])('allows useful share/save asks and direct resource invitations: %j', (content) => {
    expect(() => assertNoKeywordCta(content)).not.toThrow()
  })
})
