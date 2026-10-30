import { describe, expect, it } from 'vitest'
import { createOracleEntityBridge } from './oracle-entity-bridge'

describe('createOracleEntityBridge', () => {
  it('starts idle and reuses its live state object for every frame and snapshot', () => {
    const bridge = createOracleEntityBridge()
    const snapshot = bridge.getSnapshot()
    expect(snapshot).toEqual({
      lifecycle: 'idle', contentMode: 'prose', typingIntensity: 0, thinkingTension: 0,
      streamVelocity: 0, pulseEnergy: 0, synapseFlash: 0, colorShift: 0,
      totalCharsStreamed: 0, lastChunkDelta: '',
    })
    expect(bridge.stepFrame(1 / 60, 0)).toBe(snapshot)
    expect(bridge.getSnapshot()).toBe(snapshot)
  })

  it('bumps and clamps typing intensity, decays it over frames, and clears an empty draft', () => {
    const bridge = createOracleEntityBridge()
    bridge.notifyUserTyping(1, 0)
    expect(bridge.getSnapshot().lifecycle).toBe('typing')
    expect(bridge.getSnapshot().typingIntensity).toBeCloseTo(0.35)
    bridge.notifyUserTyping(2, 10)
    bridge.notifyUserTyping(3, 20)
    expect(bridge.getSnapshot().typingIntensity).toBe(1)
    expect(bridge.stepFrame(0.1, 120).typingIntensity).toBeLessThan(1)
    bridge.notifyUserTyping(0, 130)
    expect(bridge.getSnapshot().lifecycle).toBe('idle')
    expect(bridge.getSnapshot().typingIntensity).toBe(0)
  })

  it('builds thinking tension after submit and ignores typing during a response', () => {
    const bridge = createOracleEntityBridge()
    bridge.notifyStreamStart(0)
    expect(bridge.getSnapshot().lifecycle).toBe('thinking')
    const firstTension = bridge.stepFrame(0.1, 100).thinkingTension
    expect(firstTension).toBeGreaterThan(0)
    expect(bridge.stepFrame(0.1, 200).thinkingTension).toBeGreaterThan(firstTension)
    bridge.notifyUserTyping(3, 210)
    expect(bridge.getSnapshot().lifecycle).toBe('thinking')
    bridge.ingestStreamText('Hello', 300)
    const tension = bridge.getSnapshot().thinkingTension
    expect(bridge.stepFrame(0.1, 400).thinkingTension).toBeLessThan(tension)
  })

  it('ingests only incremental growth and produces velocity, pulses, and punctuation flashes', () => {
    const bridge = createOracleEntityBridge()
    bridge.notifyStreamStart(0)
    bridge.ingestStreamText('Hello', 100)
    expect(bridge.getSnapshot()).toMatchObject({
      lifecycle: 'streaming', contentMode: 'prose', totalCharsStreamed: 5,
      lastChunkDelta: 'Hello', synapseFlash: 0,
    })
    expect(bridge.getSnapshot().streamVelocity).toBeGreaterThan(0)
    expect(bridge.getSnapshot().pulseEnergy).toBeGreaterThan(0)
    bridge.ingestStreamText('Hello!', 200)
    expect(bridge.getSnapshot()).toMatchObject({
      totalCharsStreamed: 6, lastChunkDelta: '!', synapseFlash: 1,
    })
    const unchanged = { ...bridge.getSnapshot() }
    bridge.ingestStreamText('Hello!', 300)
    bridge.ingestStreamText('Hi', 400)
    expect(bridge.getSnapshot()).toEqual(unchanged)
    bridge.ingestStreamText('Hello! More', 200)
    expect(Number.isFinite(bridge.getSnapshot().streamVelocity)).toBe(true)
    expect(bridge.getSnapshot().streamVelocity).toBeLessThanOrEqual(1)
  })

  it('detects open fences and returns to prose once a plain fenced block closes', () => {
    const bridge = createOracleEntityBridge()
    bridge.ingestStreamText('An example: ```\nhello', 0)
    expect(bridge.getSnapshot().contentMode).toBe('code')
    expect(bridge.getSnapshot().synapseFlash).toBe(1)
    bridge.ingestStreamText('An example: ```\nhello\n```\nExplanation.', 100)
    expect(bridge.getSnapshot().contentMode).toBe('prose')
  })

  it.each(['const value = 1', 'function example()', 'import example', 'export default 1', 'x => x', '{ value }'])(
    'detects code markers in %s', (text) => {
      const bridge = createOracleEntityBridge()
      bridge.ingestStreamText(text, 0)
      expect(bridge.getSnapshot().contentMode).toBe('code')
    },
  )

  it.each(['1. Follow this step', '- Follow this step', 'PROTOCOL:\nFollow this step'])(
    'detects directives in %s', (text) => {
      const bridge = createOracleEntityBridge()
      bridge.ingestStreamText(text, 0)
      expect(bridge.getSnapshot().contentMode).toBe('directive')
    },
  )

  it('decays transient stream signals after tokens stop arriving', () => {
    const bridge = createOracleEntityBridge()
    bridge.ingestStreamText('Hello!', 0)
    const before = { ...bridge.getSnapshot() }
    const after = bridge.stepFrame(0.1, 300)
    expect(after.streamVelocity).toBeLessThan(before.streamVelocity)
    expect(after.pulseEnergy).toBeLessThan(before.pulseEnergy)
    expect(after.synapseFlash).toBeLessThan(before.synapseFlash)
  })

  it.each([false, true])('ends a stream with hadError=%s and preserves its text metrics', (hadError) => {
    const bridge = createOracleEntityBridge()
    bridge.ingestStreamText('Hello', 0)
    bridge.notifyStreamEnd(hadError, 100)
    expect(bridge.getSnapshot()).toMatchObject({
      lifecycle: hadError ? 'error' : 'idle', totalCharsStreamed: 5,
      lastChunkDelta: 'Hello', synapseFlash: 0.25,
    })
  })

  it('resets stream counters on a new stream and resets all state without replacing the snapshot', () => {
    const bridge = createOracleEntityBridge()
    const initial = { ...bridge.getSnapshot() }
    const snapshot = bridge.getSnapshot()
    bridge.ingestStreamText('A previous response', 0)
    bridge.notifyStreamStart(100)
    expect(snapshot.totalCharsStreamed).toBe(0)
    expect(snapshot.lastChunkDelta).toBe('')
    bridge.ingestStreamText('New', 200)
    expect(snapshot.lastChunkDelta).toBe('New')
    bridge.reset()
    expect(bridge.getSnapshot()).toBe(snapshot)
    expect(snapshot).toEqual(initial)
  })

  it('clamps frame deltas and smoothly approaches lifecycle color targets', () => {
    const bridge = createOracleEntityBridge()
    bridge.setLifecycle('error')
    const first = bridge.stepFrame(10, 100).colorShift
    expect(first).toBeCloseTo(1 - Math.exp(-0.5))
    for (let frame = 0; frame < 30; frame++) bridge.stepFrame(0.1, 200 + frame * 100)
    expect(bridge.getSnapshot().colorShift).toBeCloseTo(1)
    bridge.setLifecycle('idle')
    expect(bridge.stepFrame(-1, 4000).colorShift).toBeLessThan(1)
    expect(Number.isFinite(bridge.stepFrame(Number.NaN, 4001).colorShift)).toBe(true)
  })
})
