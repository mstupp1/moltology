---
id: oracle
title: Oracle AI
order: 8
color: '#ff5fa2'
summary: The Oracle checks rate, input, and each member's usage allowance, screens the prompt with the moderation model, routes it to a fast or deep model, and falls back through a model chain.
rules:
  - id: oracle.request-pipeline
    title: Oracle request pipeline
    kind: flow
    statement: Every Oracle message passes the flood guard, a last-turn check, and local input guardrails. Guests then get a canned reply with no model call. Members are checked against their usage allowance and the jailbreak preflight before a routed, streamed answer.
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
          - { to: preflight, label: 'no' }
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
        label: Record usage, pick context and model
        kind: action
        next: [stream]
      - id: stream
        label: Stream with fallback chain
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
    title: Daily allowance, Premium gets 10x
    kind: limit
    statement: Free members can send 5 Oracle messages a minute and 30 in any rolling 24 hours. Premium members get 10 times that, 50 a minute and 300 a day. Usage is stored per member, shared across server instances, and deleting a thread does not reset it.
    dependsOn: [oracle.request-pipeline, premium.no-standing, economy.red-line]
    flag:
      level: watch
      note: If the usage table cannot be read, the request continues with only the per-instance flood guard.
    anchors:
      - file: src/lib/ai/usage-limits.ts
        symbol: ORACLE_FREE_LIMITS
      - file: src/lib/ai/usage-limits.ts
        symbol: ORACLE_PREMIUM_LIMITS
      - file: src/lib/ai/usage-limits.ts
        symbol: decideOracleUsage
      - file: src/lib/ai/service.ts
        symbol: getOracleUsageSnapshot
    tests: [src/lib/ai/usage-limits.test.ts, src/lib/ai/handle-oracle-chat-request.test.ts]
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
    dependsOn: [oracle.jailbreak-gate]
    anchors:
      - file: src/lib/quality/oracle-preflight.ts
        symbol: ORACLE_INTENTS
      - file: src/lib/quality/oracle-preflight.ts
        symbol: contextForOracleIntent
      - file: src/lib/quality/oracle-preflight.ts
        symbol: fallbackOracleDecision
    tests: [src/lib/quality/oracle-preflight.test.ts]
  - id: oracle.model-routing
    title: Complexity band picks the model
    kind: threshold
    statement: Questions rated band 4 or 5 of 5 go to DeepSeek 4.1 Flash and simpler ones to the default, GLM 5.3 Flash. A model the member picked always wins.
    dependsOn: [oracle.jailbreak-gate]
    anchors:
      - file: src/lib/quality/oracle-preflight.ts
        symbol: ORACLE_COMPLEX_BAND
      - file: src/lib/quality/oracle-preflight.ts
        symbol: preferredOracleModelId
    tests: [src/lib/quality/oracle-preflight.test.ts]
  - id: oracle.model-fallback
    title: Ordered model fallback
    kind: flow
    statement: The models are GLM 5.3 Flash (default, also writes thread titles), DeepSeek 4.1 Flash, and Qwen 3.7 Flash. The Oracle tries the preferred model first and waits for the first real token before committing. On an empty stream, error, or timeout it moves to the next model, and it only shows the unavailable message when every model fails.
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

The Oracle is the most expensive surface, because every message is a billed model call. The pipeline refuses abuse cheaply first, caps each member's allowance, then spends a free moderation call to route the question to the cheapest model that can answer it.
