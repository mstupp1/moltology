/** Bearer order links and callback credentials must never enter client analytics. */
export function filterPrivateStoreTelemetry<T extends { url: string }>(event: T): T | null {
  try {
    const path = new URL(event.url, 'https://moltology.org').pathname
    return path === '/store/status' || path.startsWith('/api/printful/') || path === '/api/store/recovery' ? null : event
  } catch { return null }
}
