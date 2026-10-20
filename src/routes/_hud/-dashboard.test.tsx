import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const viewSrc = () => readFileSync(resolve(process.cwd(), 'src/components/hud/DashboardView.tsx'), 'utf8')

describe('Dashboard view source', () => {
  it('does not ship canned activity events or auto-rotating carousels', () => {
    const routeSrc = readFileSync(resolve(process.cwd(), 'src/routes/_hud/dashboard.tsx'), 'utf8')
    const src = viewSrc()
    expect(routeSrc).not.toMatch(/Luxury Sedan/)
    expect(src).not.toMatch(/Luxury Sedan|\+450\.00 MC|3,400|Pincer Torque recalibrated|INITIAL_ACTIVITIES/)
    expect(src).not.toMatch(/LaunchpadCarousel|HudPromoBentoCard/)
    expect(src).toMatch(/ActivityStreamPanel/)
    expect(src).toMatch(/PremiumDashboardBanner/)
  })

  it('puts the member’s day first, then people, then places, then what is new', () => {
    const src = viewSrc()
    const order = [
      '<DashboardTodayStrip',
      '<DailyRoutineWidget',
      '<ForumHubCard',
      '<ConnectionsHubCard',
      '<ActivityStreamPanel',
      '<DashboardShortcuts',
      '<DashboardNewsPanel',
      '<DashboardChangelogPanel',
    ].map((tag) => src.indexOf(tag))

    expect(order.every((i) => i > -1)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })
})
