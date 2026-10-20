import { describe, expect, it } from 'vitest'
import { filterPrivateStoreTelemetry } from './store-privacy'
describe('store telemetry privacy', () => {
  it('drops customer capabilities and callback secrets', () => {
    for (const url of ['https://moltology.org/store/status?order=example&key=private','/api/printful/webhook?key=private','/api/store/recovery']) expect(filterPrivateStoreTelemetry({ url })).toBeNull()
  })
  it('preserves ordinary page telemetry', () => {
    const event = { url:'https://moltology.org/store',type:'pageview' }
    expect(filterPrivateStoreTelemetry(event)).toBe(event)
  })
})
