import { describe, expect, it, vi } from 'vitest'
import {
  GOOGLE_BLOCK_CONFIDENCE,
  SIGNUP_BLOCKED_MESSAGE,
  SIGNUP_JEV_TIMEOUT_MS,
  SIGNUP_QUESTIONS,
  decideSignupScreen,
  describeEmailStructure,
  screenSignup,
  shouldScreenSignup,
} from './signup-screen'

const emailBase = {
  provider: 'email' as const,
  disposableDomain: false,
  fastSubmission: false,
  emailDomain: 'example.com',
  country: 'US',
  fastPath: false,
}

describe('signup screen decisions', () => {
  it('pins the Jev question schema and the 800ms signup budget', () => {
    expect(SIGNUP_JEV_TIMEOUT_MS).toBe(800)
    expect(SIGNUP_QUESTIONS.is_bot_or_burner.type).toBe('boolean')
    expect(SIGNUP_QUESTIONS.risk_level.type).toBe('score')
    expect(SIGNUP_QUESTIONS.risk_level.criteria).toEqual(['clean', 'low_risk', 'suspicious', 'high_risk'])
    expect(SIGNUP_QUESTIONS.action.type).toBe('choice')
    expect(Object.keys(SIGNUP_QUESTIONS.action.criteria)).toEqual([
      'allow',
      'require_email_verification',
      'challenge',
      'block',
    ])
    expect(SIGNUP_BLOCKED_MESSAGE).toMatch(/Try a different email/)
  })

  it('describes email shape without keeping the full address', () => {
    expect(describeEmailStructure('ada', 'example.com')).toBe('normal')
    expect(describeEmailStructure('ada+news', 'example.com')).toBe('plus_alias')
    expect(describeEmailStructure('ada.lovelace', 'gmail.com')).toBe('dotted_gmail')
    expect(describeEmailStructure('a'.repeat(24), 'example.com')).toBe('long_local')
  })

  it('does not block at the 0.8 boundary when the choice is allow', () => {
    const decision = decideSignupScreen(
      {
        is_bot_or_burner: { probability: 0.8 },
        risk_level: { score: 3 },
        action: { choice: 'allow' },
      },
      emailBase,
    )
    expect(decision.action).toBe('allow')
    expect(decision.reason).toBe('jev')
    expect(decision.botScore).toBe(80)
    expect(decision.riskLevel).toBe('high_risk')
  })

  it('blocks email at 0.81 with high risk and a block choice, and allows Google', () => {
    const answers = {
      is_bot_or_burner: { probability: 0.81 },
      risk_level: { score: 3 },
      action: { choice: 'block' },
    }
    expect(decideSignupScreen(answers, emailBase).action).toBe('block')
    expect(decideSignupScreen(answers, { ...emailBase, provider: 'google' }).action).toBe('allow')
  })

  it('blocks Google only above the higher confidence bar', () => {
    const answers = {
      is_bot_or_burner: { probability: 0.91 },
      risk_level: { score: 3 },
      action: { choice: 'block' },
    }
    expect(GOOGLE_BLOCK_CONFIDENCE).toBe(0.9)
    expect(decideSignupScreen(answers, { ...emailBase, provider: 'google' }).action).toBe('block')
  })

  it('downgrades a lone block choice to email verification', () => {
    const decision = decideSignupScreen(
      {
        is_bot_or_burner: { probability: 0.4 },
        risk_level: { score: 1 },
        action: { choice: 'block' },
      },
      emailBase,
    )
    expect(decision.action).toBe('require_email_verification')
  })

  it('treats challenge as email verification', () => {
    const decision = decideSignupScreen(
      {
        is_bot_or_burner: { probability: 0.2 },
        risk_level: { score: 2 },
        action: { choice: 'challenge' },
      },
      emailBase,
    )
    expect(decision.action).toBe('require_email_verification')
  })

  it('raises an optimistic allow when confidence and risk are both high', () => {
    const decision = decideSignupScreen(
      {
        is_bot_or_burner: { probability: 0.81 },
        risk_level: { score: 2 },
        action: { choice: 'allow' },
      },
      emailBase,
    )
    expect(decision.action).toBe('require_email_verification')
  })

  it('fails open when Jev returns nothing', () => {
    const decision = decideSignupScreen(null, emailBase)
    expect(decision.action).toBe('allow')
    expect(decision.reason).toBe('fail_open')
    expect(decision.botScore).toBeNull()
  })

  it('requires verification for disposable email domains and skips the evaluator', async () => {
    const evaluate = vi.fn()
    const decision = await screenSignup(
      { provider: 'email', email: 'bot@mailinator.com', displayName: 'Initiate', elapsedMs: 4000 },
      { evaluate },
    )
    expect(evaluate).not.toHaveBeenCalled()
    expect(decision.action).toBe('require_email_verification')
    expect(decision.reason).toBe('disposable_domain')
    expect(decision.emailDomain).toBe('mailinator.com')
  })

  it('fast-paths a named Google account on a trusted domain', async () => {
    const evaluate = vi.fn()
    const decision = await screenSignup(
      { provider: 'google', email: 'ada@gmail.com', displayName: 'Ada Lovelace' },
      { evaluate },
    )
    expect(evaluate).not.toHaveBeenCalled()
    expect(decision.action).toBe('allow')
    expect(decision.reason).toBe('fast_path')
  })

  it('fails open when the evaluator throws', async () => {
    const decision = await screenSignup(
      { provider: 'email', email: 'ada@example.com', displayName: 'Initiate', elapsedMs: 2000 },
      { evaluate: async () => { throw new Error('gateway down') } },
    )
    expect(decision.action).toBe('allow')
    expect(decision.reason).toBe('fail_open')
  })

  it('fails open when the default evaluator is skipped', async () => {
    const decision = await screenSignup({
      provider: 'email',
      email: 'ada@example.com',
      displayName: 'Initiate',
      elapsedMs: 1499,
    })
    expect(decision.action).toBe('allow')
    expect(decision.reason).toBe('fail_open')
    expect(decision.fastSubmission).toBe(true)
  })

  it('screens new email and Google accounts and skips later sign-ins', () => {
    expect(shouldScreenSignup({ action: 'create-user', method: 'email-password' })).toBe(true)
    expect(shouldScreenSignup({ action: 'create-user', method: 'oauth', oauth: { providerId: 'google' } })).toBe(true)
    expect(shouldScreenSignup({ action: 'sign-in', method: 'oauth', oauth: { providerId: 'google' } })).toBe(false)
    expect(shouldScreenSignup({ action: 'link-account', method: 'oauth', oauth: { providerId: 'google' } })).toBe(false)
    expect(shouldScreenSignup({ action: 'create-user', method: 'oauth', oauth: { providerId: 'github' } })).toBe(false)
  })
})
