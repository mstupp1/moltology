/** Preserve brand suffixes while advancing the service worker's runtime cache namespace. */
export function advanceServiceWorkerVersion(content: string) {
  const pattern = /const VERSION = 'moltology-hub-v(\d+)([^']*)'/
  const match = content.match(pattern)
  if (!match) throw new Error('Could not find the service worker cache version.')
  const version = Number(match[1]) + 1
  return {
    version,
    content: content.replace(pattern, `const VERSION = 'moltology-hub-v${version}${match[2]}'`),
  }
}
