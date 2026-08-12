/**
 * Helper to determine if an incoming HTTP request prefers Markdown content.
 * Matches `Accept: text/markdown`, explicit `.md` URL paths, or known AI scraper User-Agents.
 */

export function isMarkdownPreferred(request?: Request | null, urlPath?: string): boolean {
  if (urlPath && urlPath.endsWith('.md')) {
    return true
  }

  if (!request || !request.headers) {
    return false
  }

  const acceptHeader = request.headers.get('accept') || request.headers.get('Accept') || ''
  if (acceptHeader.includes('text/markdown') || acceptHeader.includes('text/x-markdown')) {
    return true
  }

  return false
}

/**
 * AI Scraper detection helper.
 */
export function isAIScraperUserAgent(userAgentHeader?: string | null): boolean {
  if (!userAgentHeader) return false
  const ua = userAgentHeader.toLowerCase()
  const aiAgents = [
    'gptbot',
    'chatgpt-user',
    'claude-web',
    'claudebot',
    'perplexitybot',
    'google-extended',
    'bytespider',
    'ccbot',
    'diffbot',
    'cohere-ai',
  ]
  return aiAgents.some((agent) => ua.includes(agent))
}
