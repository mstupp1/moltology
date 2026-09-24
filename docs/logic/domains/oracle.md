---
id: oracle
title: Oracle AI
order: 8
color: '#ff5fa2'
summary: The Oracle chat checks rate and input locally, classifies the prompt with Jev, routes it to a fast or deep model, and falls back through a model chain.
rules:
  - id: oracle.request-pipeline
    title: Oracle request pipeline
    kind: flow
    statement: Every Oracle message passes the rate limit, local input guardrails, and a Jev preflight before anything else. Guests then get a canned reply with no model stream; members get a routed, streamed answer.
    anchors:
      - file: src/lib/ai/handle-oracle-chat-request.ts
        symbol: handleOracleChatRequest
    tests: [src/lib/ai/handle-oracle-chat-request.test.ts]
    flag:
      level: watch
      note: Guests reach the Jev preflight before the guest check, so each guest message spends one Jev call. Moving the guest check earlier would save that call.
    flow:
      - id: message
        label: Message received
        kind: start
        next: [rate]
      - id: rate
        label: Over 30 a minute?
        next:
          - { to: limited, label: 'yes' }
          - { to: guard, label: 'no' }
      - id: limited
        label: 429 rate limited
        kind: outcome
        tone: warn
      - id: guard
        label: Length, injection, harm
        next:
          - { to: refused, label: 'fail' }
          - { to: preflight, label: 'pass' }
      - id: refused
        label: Refused locally
        kind: outcome
        tone: block
      - id: preflight
        label: Jev preflight
        kind: action
        next:
          - { to: jailbreak, label: 'jailbreak' }
          - { to: identity, label: 'ok or down' }
      - id: jailbreak
        label: Refused (jailbreak)
        kind: outcome
        tone: block
      - id: identity
        label: Verified JWT?
        next:
          - { to: guest, label: 'no' }
          - { to: route, label: 'yes' }
      - id: guest
        label: Canned guest reply
        kind: outcome
      - id: route
        label: Pick context and model
        kind: action
        next: [stream]
      - id: stream
        label: Stream with fallback chain
        kind: outcome
        tone: allow
  - id: oracle.rate-limit
    title: Thirty messages per minute
    kind: limit
    statement: Each member, or each IP address for guests, can send up to 30 Oracle messages per minute.
    dependsOn: [oracle.request-pipeline]
    flag:
      level: watch
      note: Uses the same in-memory limiter as the forum, so limits are per server instance.
    anchors:
      - file: src/lib/ai/guardrails.ts
        symbol: checkRateLimit
    tests: [src/lib/ai/guardrails.test.ts]
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
    statement: Jev refuses a message when it is more than 80% sure it is a jailbreak, which catches paraphrases the local patterns miss.
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
    statement: Doctrine questions load the scripture block, chassis and progression questions load a short block, and casual or unrelated questions use the base prompt. When Jev is down, the full doctrine context is used.
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
    statement: Questions rated band 4 or 5 of 5 go to the deep model and simpler ones to the fast model. A model the member picked always wins.
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
    statement: The Oracle tries the preferred model first and waits for the first real token before committing. On an empty stream, error, or timeout it moves to the next model, and it only shows the unavailable message when every model fails.
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

The Oracle is the most expensive surface, because every message is a billed model call. The pipeline refuses abuse cheaply first, then spends a small Jev call to route the question to the cheapest model that can answer it.
