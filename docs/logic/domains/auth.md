---
id: auth
title: Accounts & sign-in
order: 4
color: '#5b8cff'
summary: Self-hosted Better Auth with email and password plus Google. Sessions are cookie-cached, and writes use short-lived JWTs.
rules:
  - id: auth.better-auth
    title: Self-hosted Better Auth
    kind: invariant
    statement: Accounts live in the app's own user, session, account, verification, and jwks tables through Better Auth. The app no longer depends on Managed Neon Auth.
    anchors:
      - file: src/lib/auth-server.ts
        symbol: auth
    tests: [src/lib/auth-server.test.ts]
  - id: auth.production-secret
    title: Production needs a real secret
    kind: gate
    statement: In production, startup fails unless BETTER_AUTH_SECRET is set and at least 16 characters. Only local development may fall back to the dev secret.
    dependsOn: [auth.better-auth]
    anchors:
      - file: src/lib/auth-server.ts
        symbol: getAuthSecret
  - id: auth.password-length
    title: Minimum password length
    kind: limit
    statement: New email and password accounts need a password of at least 8 characters. Sign-in still accepts older passwords of 6 or 7 characters.
    dependsOn: [auth.better-auth]
    anchors:
      - file: src/lib/auth-server.ts
        symbol: auth.minPasswordLength
      - file: src/lib/auth-config.ts
        symbol: MIN_PASSWORD_LENGTH
    tests: [src/lib/auth-server.test.ts]
  - id: auth.jwt-for-writes
    title: JWTs carry identity to writes
    kind: flow
    statement: The client mints a JWT from the session and sends it with each mutation. The server verifies it against JWKS. Opaque session cookies are never treated as JWTs.
    dependsOn: [auth.better-auth, access.write-auth]
    anchors:
      - file: src/lib/jwt.ts
        symbol: verifyAuthJWT
      - file: src/lib/jwt.ts
        symbol: looksLikeJwt
    tests: [src/lib/jwt.test.ts]
  - id: auth.session-cookie-cache
    title: Five-minute session cookie cache
    kind: threshold
    statement: get-session reads a signed session_data cookie for up to 5 minutes before touching Postgres. The client does not refetch the session on window focus or on a timer.
    dependsOn: [auth.better-auth, data.neon-compute-budget]
    flag:
      level: watch
      note: Sign-out and revocation can lag up to 5 minutes on cached reads. Mutations still verify JWTs, so writes are not affected.
    anchors:
      - file: src/lib/auth-config.ts
        symbol: AUTH_SESSION_COOKIE_CACHE
      - file: src/lib/auth-config.ts
        symbol: AUTH_SESSION_CLIENT_OPTIONS
    tests: [src/lib/auth-config.test.ts]
  - id: auth.google-linking
    title: Google links only to verified accounts
    kind: permission
    statement: A Google sign-in with the same email links to an existing email account only when that account's email is verified. Otherwise the member signs in with their password and connects Google from Settings. This holds whether or not global email verification is on.
    dependsOn: [auth.better-auth, auth.email-verification-flag]
    anchors:
      - file: src/lib/auth-server.ts
        symbol: ACCOUNT_LINKING_OPTIONS
    tests: [src/lib/auth-accounts.test.ts, src/lib/auth-server.test.ts]
  - id: auth.email-verification-flag
    title: Global email verification is off
    kind: gate
    status: soft-launch
    statement: Email verification is only required when EMAIL_VERIFICATION_ENABLED is explicitly true. It stays off until the mail domain is verified. Signups flagged as suspicious are challenged either way.
    dependsOn: [auth.better-auth]
    anchors:
      - file: src/lib/auth-config.ts
        symbol: isEmailVerificationEnabled
    tests: [src/lib/auth-config.test.ts]
  - id: auth.oauth-errors
    title: OAuth errors land on /auth
    kind: flow
    statement: Better Auth API errors redirect to /auth with a plain, actionable message instead of the generic error page.
    dependsOn: [auth.better-auth]
    anchors:
      - file: src/lib/auth-server.ts
        symbol: getAuthApiErrorUrl
    tests: [src/lib/auth-oauth-errors.test.ts]
  - id: auth.marketing-consent
    title: Marketing requires explicit confirmed consent
    kind: permission
    statement: Public lead requests and unverified members must confirm email ownership before joining marketing Contacts. Verified members can opt in directly. Signup consent is stored on the server and account verification activates a checked opt-in. Unchecked public forms leave existing subscriptions unchanged; simulated members cannot subscribe.
    dependsOn: [auth.better-auth]
    anchors:
      - file: src/lib/server/email-opt-in.ts
        symbol: requestEmailOptIn
      - file: src/lib/server/email-opt-in.ts
        symbol: setEmailPreference
      - file: src/lib/server/email-opt-in.ts
        symbol: confirmSignupMarketing
      - file: src/lib/server/email-opt-in.ts
        symbol: handleEmailOptInConfirm
    tests: [src/lib/server/email-preferences.test.ts, src/lib/server/email-opt-in.test.ts]
  - id: auth.marketing-targets
    title: One contact with lifecycle targeting
    kind: flow
    statement: Confirmed subscribers belong to All Subscribers and either Leads or Users. Registration moves an existing subscribed lead to Users while preserving its provider unsubscribe state. Account creation and opt-out alone never create a marketing Contact.
    dependsOn: [auth.marketing-consent]
    anchors:
      - file: src/lib/server/email-opt-in.ts
        symbol: handleMarketingSignup
      - file: src/lib/server/resend-contacts.ts
        symbol: subscribeResendContact
      - file: src/lib/server/resend-contacts.ts
        symbol: moveResendContactToUsers
    tests: [src/lib/server/email-preferences.test.ts, src/lib/server/resend-contacts.test.ts]
  - id: auth.marketing-unsubscribe
    title: Opt-outs update existing contacts and local preferences
    kind: flow
    statement: Settings opt-out marks an existing Contact unsubscribed and clears matching lead/profile preferences. Signed contact.updated webhooks apply provider opt-outs only after checking current provider status. Repeated deliveries are safe, failures trigger provider retries, and routine events never re-subscribe a Contact. There is no scheduled reconciliation worker.
    dependsOn: [auth.marketing-consent, auth.jwt-for-writes]
    anchors:
      - file: src/lib/server/resend-contacts.ts
        symbol: unsubscribeResendContact
      - file: src/lib/server/resend-webhook.ts
        symbol: verifyResendWebhook
      - file: src/lib/server/resend-webhook.ts
        symbol: handleResendWebhook
    tests: [src/lib/server/resend-webhook.test.ts, src/lib/server/email-preferences.test.ts]

---

Auth moved off Managed Neon Auth because its background polling kept Neon compute awake and blew the compute budget. Identity for writes is always a verified JWT, never a client-supplied id.
