import { describe, expect, it, vi } from 'vitest'
import { devArguments } from './dev.mjs'

describe('development launcher', () => {
  it('uses the runner and a free port before auth starts', async () => {
    const available = vi.fn(async (port: number) => port === 3002)
    expect(await devArguments([], {}, available)).toEqual({
      args: ['--port', '3002', '--configLoader', 'runner'], port: 3002,
    })
    expect(available.mock.calls.map(([port]) => port)).toEqual([3000, 3001, 3002])
  })
  it.each([['--port', '3100'], ['--port=3100']])('preserves explicit CLI ports: %s', async (...args) => {
    const available = vi.fn()
    expect((await devArguments(args, { PORT: '3200' }, available)).port).toBe(3100)
    expect(available).not.toHaveBeenCalled()
  })
  it('honors PORT and config loader overrides', async () => {
    expect(await devArguments(['--configLoader=bundle'], { PORT: '3200' })).toEqual({
      args: ['--configLoader=bundle', '--port', '3200'], port: 3200,
    })
  })
  it.each(['0', '65536', 'abc', '3000junk'])('rejects invalid ports: %s', async (port) => {
    await expect(devArguments(['--port', port])).rejects.toThrow('between 1 and 65535')
  })
  it('reports port exhaustion and permission failures', async () => {
    await expect(devArguments([], {}, async () => false)).rejects.toThrow('No free development port')
    await expect(devArguments([], {}, async () => { throw new Error('EPERM') })).rejects.toThrow('EPERM')
  })
})
