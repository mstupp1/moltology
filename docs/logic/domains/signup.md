---
id: signup
title: Signup screening
order: 5
color: '#ff7a45'
summary: New accounts pass a honeypot, a timing signal, a disposable-domain list, and a Jev bot check. Screening fails open when the model is down.
rules:
  - id: signup.pipeline
    title: Signup screening pipeline
    kind: flow
    statement: New email signups and first-time Google accounts are screened before the account is trusted. Later Google sign-ins are not scored.
    dependsOn: [auth.better-auth]
    anchors:
      - file: src/lib/quality/signup-screen.ts
        symbol: shouldScreenSignup
      - file: src/lib/server/signup-auth.ts
        symbol: validateSignupUser
    tests: [src/lib/quality/signup-screen.test.ts]
    flow:
      - id: submit
        label: Signup submitted
        kind: start
        next: [honeypot]
      - id: honeypot
        label: Honeypot field filled?
        next:
          - { to: reject-400, label: 'yes' }
          - { to: provider, label: 'no' }
      - id: reject-400
        label: 400, no model call
        kind: outcome
        tone: block
      - id: provider
        label: Google, trusted domain, real name?
        next:
          - { to: allow-fast, label: 'yes' }
          - { to: disposable, label: 'no' }
      - id: allow-fast
        label: Allow (fast path)
        kind: outcome
        tone: allow
      - id: disposable
        label: Disposable email domain?
        next:
          - { to: challenge, label: 'yes' }
          - { to: jev, label: 'no' }
      - id: jev
        label: Jev bot check (800ms)
        kind: action
        next:
          - { to: allow-open, label: 'timeout' }
          - { to: decide, label: 'answered' }
      - id: allow-open
        label: Allow (fail open)
        kind: outcome
        tone: allow
      - id: decide
        label: Decide by confidence
        next:
          - { to: block, label: '> bar' }
          - { to: challenge, label: 'risky' }
          - { to: allow, label: 'clean' }
      - id: block
        label: Block, log risk event
        kind: outcome
        tone: block
      - id: challenge
        label: Confirm inbox first
        kind: outcome
        tone: warn
      - id: allow
        label: Allow
        kind: outcome
        tone: allow
  - id: signup.honeypot
    title: Honeypot rejects bots
    kind: gate
    statement: The email signup form sends a hidden confirm_website field. If it is filled, the request returns 400 before Better Auth or Jev run, and the attempt is logged with no user id.
    dependsOn: [signup.pipeline]
    anchors:
      - file: src/lib/signup-telemetry.ts
        symbol: SIGNUP_HONEYPOT_FIELD
      - file: src/lib/server/signup-gate.ts
        symbol: readEmailSignupGate
    tests: [src/lib/server/signup-gate.test.ts, src/lib/signup-telemetry.test.ts]
  - id: signup.fast-form
    title: Fast form signal
    kind: threshold
    statement: An email signup completed in under 1,500 ms is marked fast. It is a signal passed to Jev, not a block on its own.
    dependsOn: [signup.pipeline]
    anchors:
      - file: src/lib/signup-telemetry.ts
        symbol: SIGNUP_FAST_MS
    tests: [src/lib/signup-telemetry.test.ts]
  - id: signup.disposable-domains
    title: Disposable domains are challenged
    kind: gate
    statement: Email signups from a known disposable domain skip the model and must confirm their inbox before the session is kept.
    dependsOn: [signup.pipeline]
    anchors:
      - file: src/lib/quality/signup-screen.ts
        symbol: DISPOSABLE_EMAIL_DOMAINS
    tests: [src/lib/quality/signup-screen.test.ts]
  - id: signup.google-fast-path
    title: Google fast path
    kind: gate
    statement: A new Google account on a common provider domain with a non-empty name is allowed without calling the model.
    dependsOn: [signup.pipeline]
    anchors:
      - file: src/lib/quality/signup-screen.ts
        symbol: TRUSTED_EMAIL_DOMAINS
    tests: [src/lib/quality/signup-screen.test.ts]
  - id: signup.jev-budget
    title: 800 ms model budget
    kind: limit
    statement: The signup Jev call has an 800 ms budget, shorter than the 1,200 ms used by the forum and Oracle, so signup never feels slow.
    dependsOn: [signup.pipeline, forum.jev-shared]
    anchors:
      - file: src/lib/quality/signup-screen.ts
        symbol: SIGNUP_JEV_TIMEOUT_MS
    tests: [src/lib/quality/signup-screen.test.ts]
  - id: signup.fail-open
    title: Screening fails open
    kind: invariant
    statement: If Jev times out, errors, or the gate throws, the signup is allowed. Screening must never lock real people out because a model is down.
    dependsOn: [signup.pipeline]
    anchors:
      - file: src/lib/quality/signup-screen.ts
        symbol: screenSignup
    tests: [src/lib/quality/signup-screen.test.ts]
  - id: signup.block-thresholds
    title: Block confidence bars
    kind: threshold
    statement: Email signups are blocked above 0.8 bot confidence, or when Jev says block with a high-risk score. Google accounts are blocked only above 0.9 and only when the email rule would also block. Exactly 0.8 stays on the allow side.
    dependsOn: [signup.pipeline]
    anchors:
      - file: src/lib/quality/signup-screen.ts
        symbol: SIGNUP_BLOCK_CONFIDENCE
      - file: src/lib/quality/signup-screen.ts
        symbol: GOOGLE_BLOCK_CONFIDENCE
      - file: src/lib/quality/signup-screen.ts
        symbol: decideSignupScreen
    tests: [src/lib/quality/signup-screen.test.ts]
  - id: signup.challenge
    title: Suspicious signups confirm the inbox
    kind: gate
    statement: A signup that needs verification gets a confirmation email and its fresh session is dropped, even when global verification is off. Password sign-in stays on the confirm-email screen until the inbox is confirmed.
    dependsOn: [signup.block-thresholds, signup.disposable-domains, auth.email-verification-flag]
    anchors:
      - file: src/lib/server/signup-auth.ts
        symbol: withholdChallengedSignup
      - file: src/lib/server/signup-auth.ts
        symbol: rejectChallengedSignIn
  - id: signup.risk-events
    title: Risk outcomes are logged privately
    kind: invariant
    statement: Screening outcomes go to signup_risk_events, not to profiles or the auth user table. Blocked attempts store no user id, and members cannot read the table with their JWT.
    dependsOn: [signup.pipeline]
    anchors:
      - file: src/lib/server/signup-risk-events.ts
        symbol: recordSignupRiskEvent
  - id: signup.turnstile-optional
    title: Turnstile only checks tokens it gets
    kind: gate
    statement: Blog comments and lead capture verify a Cloudflare Turnstile token when one is sent. A request with no token skips the check.
    flag:
      level: gap
      note: Bots can skip Turnstile by leaving the token out. Require it on public write paths, and fail closed when TURNSTILE_SECRET_KEY is missing in production.
    anchors:
      - file: src/lib/server/turnstile.ts
        symbol: verifyTurnstileToken
      - file: src/lib/server/db-services.ts
        symbol: submitLeadHandler
    tests: [src/lib/server/turnstile.test.ts]
---

Screening uses cheap local checks first, then asks Jev only when needed. Every path fails open, because a false block costs a real member.
