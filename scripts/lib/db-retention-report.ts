export type RetentionReportTarget = 'default' | 'dev' | 'prod'

export type RetentionReportArgs = {
  target: RetentionReportTarget
}

export type RetentionReportEnvironment = {
  DATABASE_URL?: string
  DEV_DATABASE_URL?: string
  PROD_DATABASE_URL?: string
}

export type ResolvedRetentionDatabase = {
  target: RetentionReportTarget
  label: string
  url?: string
}

export function parseRetentionReportArgs(args: string[]): RetentionReportArgs {
  let target: RetentionReportTarget = 'default'
  let sawTarget = false

  for (const arg of args) {
    if (arg === '--apply') {
      throw new Error('--apply is not implemented. This reporter is dry-run only.')
    }
    if (arg === '--target=dev' || arg === '--target=prod') {
      if (sawTarget) throw new Error('Specify --target only once.')
      target = arg.endsWith('=dev') ? 'dev' : 'prod'
      sawTarget = true
      continue
    }
    throw new Error(`Unknown argument: ${arg}`)
  }

  return { target }
}

export function resolveRetentionDatabase(
  target: RetentionReportTarget,
  environment: RetentionReportEnvironment
): ResolvedRetentionDatabase {
  if (target === 'dev') {
    return { target, label: 'dev', url: environment.DEV_DATABASE_URL }
  }
  if (target === 'prod') {
    return { target, label: 'prod', url: environment.PROD_DATABASE_URL }
  }
  return {
    target,
    label: 'default (DATABASE_URL)',
    url: environment.DATABASE_URL,
  }
}


