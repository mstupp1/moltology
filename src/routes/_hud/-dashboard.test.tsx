import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

describe('Dashboard activity stream source', () => {
  it('does not ship canned luxury-sedan, credit-drop, fathom, or torque events', () => {
    const routeSrc = readFileSync(resolve(process.cwd(), 'src/routes/_hud/dashboard.tsx'), 'utf8')
    const viewSrc = readFileSync(resolve(process.cwd(), 'src/components/hud/DashboardView.tsx'), 'utf8')
    expect(routeSrc).not.toMatch(/Luxury Sedan/)
    expect(routeSrc).not.toMatch(/\+450\.00 MC/)
    expect(viewSrc).not.toMatch(/Luxury Sedan/)
    expect(viewSrc).not.toMatch(/\+450\.00 MC/)
    expect(viewSrc).not.toMatch(/3,400/)
    expect(viewSrc).not.toMatch(/Pincer Torque recalibrated/)
    expect(viewSrc).not.toMatch(/INITIAL_ACTIVITIES/)
    expect(viewSrc).toMatch(/ActivityStreamPanel/)
    expect(viewSrc).toMatch(/ResumeOracleConsultation/)
  })

  it('places Forum and Connections cards under Daily Alignment and above Activity', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/components/hud/DashboardView.tsx'), 'utf8')
    const routine = src.indexOf('<DailyRoutineWidget')
    const forum = src.indexOf('<ForumHubCard')
    const connections = src.indexOf('<ConnectionsHubCard')
    const activity = src.indexOf('<ActivityStreamPanel')

    expect(src).toMatch(/ForumHubCard/)
    expect(src).toMatch(/ConnectionsHubCard/)
    expect(src).toMatch(/lg:col-span-6/)
    expect(routine).toBeGreaterThan(-1)
    expect(forum).toBeGreaterThan(routine)
    expect(connections).toBeGreaterThan(forum)
    expect(activity).toBeGreaterThan(connections)
  })
})
