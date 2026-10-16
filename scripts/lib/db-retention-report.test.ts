import { describe, expect, it } from 'vitest'
import {
  parseRetentionReportArgs,
  resolveRetentionDatabase,
} from './db-retention-report'

describe('retention report target selection', () => {
  it('keeps DATABASE_URL as the default target for existing scheduled runs', () => {
    expect(parseRetentionReportArgs([])).toEqual({ target: 'default' })
    expect(
      resolveRetentionDatabase('default', {
        DATABASE_URL: 'postgresql://weekly-workflow',
        DEV_DATABASE_URL: 'postgresql://dev',
        PROD_DATABASE_URL: 'postgresql://prod',
      })
    ).toEqual({
      target: 'default',
      label: 'default (DATABASE_URL)',
      url: 'postgresql://weekly-workflow',
    })
  })

  it('selects only the URL named by an explicit target', () => {
    const environment = {
      DATABASE_URL: 'postgresql://default',
      DEV_DATABASE_URL: 'postgresql://dev',
      PROD_DATABASE_URL: 'postgresql://prod',
    }
    expect(parseRetentionReportArgs(['--target=dev'])).toEqual({ target: 'dev' })
    expect(resolveRetentionDatabase('dev', environment).url).toBe('postgresql://dev')
    expect(parseRetentionReportArgs(['--target=prod'])).toEqual({ target: 'prod' })
    expect(resolveRetentionDatabase('prod', environment).url).toBe('postgresql://prod')
    expect(resolveRetentionDatabase('prod', { DATABASE_URL: environment.DATABASE_URL }).url).toBeUndefined()
  })

  it('rejects unknown flags, duplicate targets, and the unimplemented apply mode', () => {
    expect(() => parseRetentionReportArgs(['--target=stage'])).toThrow('Unknown argument')
    expect(() => parseRetentionReportArgs(['--unexpected'])).toThrow('Unknown argument')
    expect(() => parseRetentionReportArgs(['--target=dev', '--target=prod'])).toThrow('only once')
    expect(() => parseRetentionReportArgs(['--apply'])).toThrow('--apply is not implemented')
  })
})

