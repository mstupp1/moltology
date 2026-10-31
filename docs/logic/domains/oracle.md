---
id: oracle
title: Oracle AI
order: 8
color: '#ff5fa2'
summary: The Oracle checks input and rolling usage, screens prompts, and routes to Oracle Current or MAX-only Oracle Abyss using the entitlement returned by its atomic usage reservation.
rules:
  - id: oracle.request-pipeline
    title: Oracle request pipeline
    kind: flow
    statement: Every message passes flood and local input checks. Guests get a canned reply. Members pass usage and prompt screening, then atomically reserve one allowance slot before a new thread or model call. Read or reservation failures return 503; denied allowance returns 429. Failed thread creation releases the reservation.
    anchors:
      - file: src/lib/ai/handle-oracle-chat-request.ts
        symbol: handleOracleChatRequest
    tests: [src/lib/ai/handle-oracle-chat-request.test.ts]
    flow:
      - id: message
        label: Message received
        kind: start
        next: [rate]
      - id: rate
        label: Over 30 a minute here?
        next:
          - { to: limited, label: 'yes' }
          - { to: guard, label: 'no' }
      - id: limited
        label: 429 rate limited
        kind: outcome
        tone: warn
      - id: guard
        label: Last turn, length, injection, harm
        next:
          - { to: refused, label: 'fail' }
          - { to: identity, label: 'pass' }
      - id: refused
        label: Refused locally
        kind: outcome
        tone: block
      - id: identity
        label: Verified JWT?
        next:
          - { to: guest, label: 'no' }
          - { to: usage, label: 'yes' }
      - id: guest
        label: Canned guest reply
        kind: outcome
      - id: usage
        label: Over minute or daily allowance?
        next:
          - { to: over, label: 'yes' }
          - { to: unavailable, label: 'unreadable' }
          - { to: preflight, label: 'no' }
      - id: unavailable
        label: 503, no model call
        kind: outcome
        tone: warn
      - id: over
        label: 429 with Retry-After
        kind: outcome
        tone: warn
      - id: preflight
        label: Moderation preflight
        kind: action
        next:
          - { to: jailbreak, label: 'jailbreak' }
          - { to: route, label: 'ok or down' }
      - id: jailbreak
        label: Refused (jailbreak)
        kind: outcome
        tone: block
      - id: route
        label: Reserve usage and create a thread if needed
        kind: action
        next: [stream]
      - id: stream
        label: Stream entitled model
        kind: outcome
        tone: allow
  - id: oracle.rate-limit
    title: Thirty a minute flood guard
    kind: limit
    statement: Each member, or each IP address for guests, can send up to 30 Oracle messages per minute to one server instance. It is a cheap first layer in front of the per-member allowance.
    dependsOn: [oracle.request-pipeline]
    flag:
      level: watch
      note: Uses the same in-memory limiter as the forum, so limits are per server instance. The durable per-member allowance is the real limit for members.
    anchors:
      - file: src/lib/ai/guardrails.ts
        symbol: checkRateLimit
    tests: [src/lib/ai/guardrails.test.ts]
  - id: oracle.usage-allowance
    title: Rolling allowances, Premium gets 10x
    kind: limit
    statement: Free members can send 5 Oracle messages a minute, 15 per rolling 5 hours, and 100 per rolling 7 days. Oracle MAX receives 10x. Both windows must have capacity; usage is checked and reserved atomically across instances before model calls and survives thread deletion. New-thread failure releases the reservation. Chat shows five-hour usage and both windows in details and Settings.
    dependsOn: [oracle.request-pipeline, premium.no-standing, economy.red-line]
    anchors:
      - file: src/lib/ai/service.ts
        symbol: reserveOracleChatUsage
      - file: src/lib/ai/service.ts
        symbol: releaseOracleChatUsage
      - file: src/lib/ai/usage-limits.ts
        symbol: ORACLE_FREE_LIMITS
      - file: src/lib/ai/usage-limits.ts
        symbol: ORACLE_PREMIUM_LIMITS
      - file: src/lib/ai/usage-limits.ts
        symbol: decideOracleUsage
      - file: src/lib/ai/service.ts
        symbol: getOracleUsageSnapshot
      - file: src/lib/ai/usage-limits.ts
        symbol: buildOracleUsageSnapshot
      - file: src/lib/server/oracle-usage.ts
        symbol: getOracleUsageHandler
    tests: [src/lib/ai/usage-limits.test.ts, src/lib/ai/handle-oracle-chat-request.test.ts, src/lib/server/oracle-usage.test.ts, src/hooks/useOracleUsage.test.tsx, src/components/ai/OracleUsage.test.tsx]
  - id: oracle.request-caps
    title: History and reply size caps
    kind: limit
    statement: A request sends at most the newest 20 turns and 16,000 characters of history, and a reply stops at 1,024 tokens. Only user and assistant turns reach the model, and the last turn must be the member's own.
    dependsOn: [oracle.request-pipeline]
    flag:
      level: gap
      note: History still comes from the browser, so a member can rewrite earlier assistant turns. Loading history from stored thread messages would close this.
    anchors:
      - file: src/lib/ai/usage-limits.ts
        symbol: ORACLE_MAX_HISTORY_MESSAGES
      - file: src/lib/ai/usage-limits.ts
        symbol: ORACLE_MAX_OUTPUT_TOKENS
      - file: src/lib/ai/oracle-chat.ts
        symbol: toModelMessages
    tests: [src/lib/ai/oracle-chat.test.ts, src/lib/ai/usage-limits.test.ts]
  - id: oracle.input-guardrails
    title: Local input guardrails
    kind: gate
    statement: Messages must be non-empty and at most 4,000 characters. Obvious prompt-injection phrases and explicit harm are refused before any model call.
    dependsOn: [oracle.request-pipeline, forum.content-safety]
    anchors:
      - file: src/lib/ai/guardrails.ts
        symbol: validateInputGuardrails
      - file: src/lib/ai/guardrails.ts
        symbol: INJECTION_PATTERNS
    tests: [src/lib/ai/guardrails.test.ts]
  - id: oracle.jailbreak-gate
    title: Paraphrased jailbreaks are refused
    kind: gate
    statement: The moderation model refuses a message when it is more than 80% sure it is a jailbreak, which catches paraphrases the local patterns miss.
    dependsOn: [oracle.input-guardrails, forum.jev-shared]
    anchors:
      - file: src/lib/quality/oracle-preflight.ts
        symbol: decideOraclePreflight
      - file: src/lib/quality/oracle-preflight.ts
        symbol: ORACLE_JAILBREAK_ERROR
    tests: [src/lib/quality/oracle-preflight.test.ts]
  - id: oracle.intent-context
    title: Intent picks the prompt context
    kind: flow
    statement: Doctrine questions load the scripture block, chassis and progression questions load a short block, and casual or unrelated questions use the base prompt. When the moderation model is down, the full doctrine context is used.
    dependsOn: [oracle.jailbreak-gate, economy.red-line]
    anchors:
      - file: src/lib/quality/oracle-preflight.ts
        symbol: ORACLE_INTENTS
      - file: src/lib/quality/oracle-preflight.ts
        symbol: contextForOracleIntent
      - file: src/lib/quality/oracle-preflight.ts
        symbol: fallbackOracleDecision
    tests: [src/lib/quality/oracle-preflight.test.ts]
  - id: oracle.model-routing
    title: Membership gates model selection
    kind: permission
    statement: Free members use Oracle Current (DeepSeek V4.1 Flash). Oracle MAX defaults to Oracle Abyss (Claude Sonnet 4.6) and may select Current. The atomic usage reservation supplies the authoritative entitlement; a free member requesting Abyss is routed to Current. Moderation preferences cannot override this gate.
    dependsOn: [oracle.jailbreak-gate, economy.red-line]
    anchors:
      - file: src/lib/ai/oracle-chat.ts
        symbol: orderOracleModels
      - file: src/lib/ai/oracle-chat.ts
        symbol: getOracleCandidateModelIds
    tests: [src/lib/ai/oracle-chat.test.ts, src/lib/ai/handle-oracle-chat-request.test.ts]
  - id: oracle.model-fallback
    title: Model failure preserves the selected tier
    kind: flow
    statement: The Oracle waits for a real first token from the single entitled model. Empty streams, errors, and timeouts return the unavailable message without falling into a more expensive model or silently downgrading Abyss. Thread titles continue to use DeepSeek V4.1 Flash.
    dependsOn: [oracle.model-routing]
    anchors:
      - file: src/lib/ai/oracle-models.ts
        symbol: ORACLE_MODELS
    tests: [src/lib/ai/oracle-chat.test.ts]
  - id: oracle.thread-ownership
    title: Threads are owner-scoped
    kind: permission
    statement: Thread lists, message reads, and writes resolve the member from a verified JWT and only touch that member's threads. A foreign thread id returns not found.
    dependsOn: [access.write-auth]
    anchors:
      - file: src/lib/ai/service.ts
        symbol: getOwnedAIThread
    tests: [src/lib/server/oracle-threads.test.ts]
---

The Oracle is the most expensive surface, because every message is a billed model call. The pipeline refuses abuse cheaply first, caps each member's allowance, then screens the prompt before calling the model allowed by the member's plan and choice.
