import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

describe('Dashboard activity stream source', () => {
  it('does not ship canned luxury-sedan, credit-drop, fathom, or torque events', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/routes/_hud/dashboard.tsx'), 'utf8')
    expect(src).not.toMatch(/Luxury Sedan/)
    expect(src).not.toMatch(/\+450\.00 MC/)
    expect(src).not.toMatch(/3,400/)
    expect(src).not.toMatch(/Pincer Torque recalibrated/)
    expect(src).not.toMatch(/INITIAL_ACTIVITIES/)
    expect(src).toMatch(/ActivityStreamPanel/)
  })
})
