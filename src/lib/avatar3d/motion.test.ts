import { describe, expect, it } from 'vitest'
import { jump } from './motion'

describe('jump', () => {
  const at = (q: number) => jump(q, 0.3, 0.16)

  it('stands still before and after', () => {
    expect(at(0)).toEqual({ body: 0, feet: 0, toe: 0, lean: 0 })
    expect(at(1)).toEqual({ body: 0, feet: 0, toe: 0, lean: 0 })
    expect(Math.abs(at(0.999).body)).toBeLessThan(0.01)
  })

  it('crouches before it leaves the ground', () => {
    const crouch = at(0.2)
    expect(crouch.body).toBeLessThan(-0.1)
    expect(crouch.feet).toBe(0)
  })

  it('tucks the feet in the air: they rise less than the hips but stay off the ground', () => {
    const top = at(0.51)
    expect(top.body).toBeGreaterThan(0.3)
    expect(top.feet).toBeGreaterThan(0.2)
    // The legs are shorter than standing (feet closer to the hips than the 0.05 straight-leg reach).
    expect(top.feet).toBeGreaterThan(top.body - 0.05)
  })

  it('lands on bent knees and never puts the feet through the floor', () => {
    expect(at(0.8).body).toBeLessThan(-0.05)
    for (let q = 0; q <= 1; q += 0.01) expect(at(q).feet).toBeGreaterThanOrEqual(0)
  })
})
