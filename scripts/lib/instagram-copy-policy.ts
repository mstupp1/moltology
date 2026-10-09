/** Reject retired comment funnels in reviewed public copy before media ingestion. */
export function assertNoKeywordCta(content: Record<string, unknown>): void {
  for (const key of ['commentKeyword', 'commentTriggerKeyword']) {
    if (typeof content[key] === 'string' && content[key].trim()) {
      throw new Error('Keyword comment CTAs are retired. Remove the keyword field and use one share/save or direct resource invitation.')
    }
  }
  const text = ['caption', 'firstComment', 'hookHeadline', 'imagePrompt', 'narrationScript', 'youtubeDescription']
    .map((key) => typeof content[key] === 'string' ? content[key] : '')
    .join('\n')
  const quotedOrNamedKeyword = /\b(?:comment|reply|type|drop|write)\s+(?:["'“‘][^"'”’\n]+["'”’]|(?:the\s+)?(?:word|keyword)\b)/i
  const upperCaseKeyword = /\b(?:[Cc]omment|COMMENT|[Rr]eply|REPLY|[Tt]ype|TYPE|[Dd]rop|DROP|[Ww]rite|WRITE)\s+[A-Z][A-Z0-9_-]+\b/
  const keywordForReward = /\b(?:comment|reply|type|drop|write)\s+[\p{L}\p{N}_-]+\s+(?:below\s+)?(?:to|for|and)\b/iu
  if (quotedOrNamedKeyword.test(text) || upperCaseKeyword.test(text) || keywordForReward.test(text) || /\b(?:dms?|direct messages?)\b/i.test(text)) {
    throw new Error('Keyword comment CTAs and DM promises are retired. Use one share/save or direct resource invitation.')
  }
}
