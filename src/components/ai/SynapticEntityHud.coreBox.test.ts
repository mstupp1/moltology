import { describe, expect, it } from 'vitest'
import { CORE_SIZE_PX, computeCoreBox } from './SynapticEntityHud'

describe('computeCoreBox', () => {
  it('uses the same core size on a big page, a floating panel and a phone', () => {
    expect(computeCoreBox(1200, 820, { top: 60, height: 460 }).size).toBe(CORE_SIZE_PX)
    expect(computeCoreBox(400, 560, { top: 48, height: 300 }).size).toBe(CORE_SIZE_PX)
    expect(computeCoreBox(390, 640, { top: 50, height: 320 }).size).toBe(CORE_SIZE_PX)
  })

  it('shrinks only when the open space is too short or narrow', () => {
    expect(computeCoreBox(390, 500, { top: 40, height: 200 }).size).toBe(184)
    expect(computeCoreBox(300, 600, { top: 40, height: 400 }).size).toBe(210)
  })

  it('centers the core in the open space and keeps the square inside the panel width', () => {
    const box = computeCoreBox(400, 560, { top: 48, height: 300 })
    expect(box.cx).toBe(200)
    expect(box.cy).toBe(198)
    expect(box.side).toBe(400)
    expect(computeCoreBox(1200, 820, { top: 60, height: 460 }).side).toBe(576)
  })
})
