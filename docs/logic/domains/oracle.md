---
id: oracle
title: Oracle AI
order: 8
color: '#ff5fa2'
summary: The Oracle checks rate, input, and each member's usage allowance, routes it to a model allowed by the membership tier, and names new conversations within the streamed request.
rules:
  - id: oracle.request-pipeline
    title: Oracle request pipeline
    kind: flow
    statement: Every message passes flood and local input checks. Guests get a capped free-model reply, unsaved. Members pass usage checks and atomically reserve an allowance slot before chat model calls. Oversized tier-specific prompts release the slot. Read or reservation failures return 503; denied allowance returns 429. Failed thread creation releases the reservation.
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
        label: Capped guest reply, nothing saved
        kind: outcome
      - id: usage
        label: Over minute, five-hour, or weekly allowance?
        next:
          - { to: over, label: 'yes' }
          - { to: unavailable, label: 'unreadable' }
          - { to: route, label: 'no' }
      - id: unavailable
        label: 503, no model call
        kind: outcome
        tone: warn
      - id: over
        label: 429 with Retry-After
        kind: outcome
        tone: warn
      - id: route
        label: Reserve usage and create a thread if needed
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
    title: Rolling allowances, Oracle MAX gets 10x
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
  - id: oracle.guest-allowance
    title: Guests get a few real answers a day
    kind: limit
    statement: Guests can send 5 Oracle messages per UTC day per IP (stored hashed), and all guests share 300 a day. Replies use Oracle Lite, capped at 700 tokens, with up to 6 recent turns from the visitor's chat re-checked by the input filter. Nothing is saved and no title is made. If the counter can't be written, guests get a notice and no model call.
    dependsOn: [oracle.request-pipeline, oracle.input-guardrails]
    anchors:
      - file: src/lib/ai/guest-usage.ts
        symbol: reserveGuestOracleMessage
      - file: src/lib/ai/usage-limits.ts
        symbol: ORACLE_GUEST_LIMITS
    tests: [src/lib/ai/guest-usage.test.ts, src/lib/ai/handle-oracle-chat-request.test.ts]
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
    statement: Messages must be non-empty. Free members and guests can send up to 1,500 characters per message; Oracle MAX allows 4,000. Member limits use the authoritative reservation tier, and oversized messages release their reservation before generation. Obvious prompt-injection phrases and explicit harm are refused before any model call.
    dependsOn: [oracle.request-pipeline, forum.content-safety]
    anchors:
      - file: src/lib/ai/guardrails.ts
        symbol: validateInputGuardrails
      - file: src/lib/ai/guardrails.ts
        symbol: INJECTION_PATTERNS
    tests: [src/lib/ai/guardrails.test.ts]
  - id: oracle.jailbreak-gate
    title: Remote chat screening removed
    kind: gate
    status: deprecated
    statement: Oracle chat no longer calls Laya or Jev. Local input checks remain, along with verified membership, message limits, usage reservations, and model access rules. Forum and signup screening remain separate.
    dependsOn: [oracle.input-guardrails]
    anchors:
      - file: src/lib/ai/handle-oracle-chat-request.ts
        symbol: handleOracleChatRequest
    tests: [src/lib/ai/handle-oracle-chat-request.test.ts]
  - id: oracle.intent-context
    title: Shared system prompt and local scripture lookup
    kind: flow
    statement: All member chats use the same static system prompt prefix with doctrine, equipment, progression, and scripture summaries. Local lookup adds relevant scripture passages using the current question and recent conversation, without remote intent classification.
    dependsOn: [oracle.input-guardrails]
    anchors:
      - file: src/lib/ai/codex-prompt.ts
        symbol: buildSystemPrompt
      - file: src/lib/ai/scripture-lookup.ts
        symbol: buildOracleScriptureContext
    tests: [src/lib/ai/codex-prompt.test.ts, src/lib/ai/scripture-lookup.test.ts]
  - id: oracle.model-routing
    title: Membership determines model access
    kind: permission
    statement: Guests use Oracle Lite without saved chats or titles. Free members use Oracle Lite (DeepSeek V4.1 Flash 1017). MAX defaults to Claude Haiku 5.5 and can select Lite. Titles use the selected chat model. Both providers disallow training. Membership comes from the atomic usage reservation. Requested model ids cannot grant paid access, and title-only entries cannot receive chat.
    dependsOn: [oracle.input-guardrails, economy.red-line]
    anchors:
      - file: src/lib/ai/oracle-chat.ts
        symbol: getOracleCandidateModelIds
      - file: src/lib/ai/oracle-models.ts
        symbol: getOracleTitleModelId
    tests: [src/lib/ai/oracle-chat.test.ts, src/lib/ai/handle-oracle-chat-request.test.ts]
  - id: oracle.model-fallback
    title: Ordered model fallback
    kind: flow
    statement: Lite pins DeepSeek V4.1 Flash 1017 through DeepInfra. MAX defaults to Claude Haiku 5.5 through Anthropic and may choose Lite. Both routes disallow prompt training. Empty streams, errors, and a 12-second first-token timeout return unavailable without changing models. SDK retries and reasoning are disabled.
    dependsOn: [oracle.model-routing]
    anchors:
      - file: src/lib/ai/oracle-models.ts
        symbol: ORACLE_MODELS
    tests: [src/lib/ai/oracle-chat.test.ts]
  - id: oracle.thread-titles
    title: One bounded title attempt per new conversation
    kind: flow
    statement: New threads start with a 60-character excerpt. After the first reply, one title call reuses its model, provider, system prompt, and exchange for cache eligibility. It has 32 output tokens, an eight-second timeout, and no retries. Stream completion awaits title persistence. Failures retain the excerpt; conditional updates preserve manual renames.
    dependsOn: [oracle.model-routing]
    anchors:
      - file: src/lib/ai/service.ts
        symbol: summarizeThreadTitle
      - file: src/lib/ai/service.ts
        symbol: updateAIThreadTitle
    tests: [src/lib/ai/service.test.ts, src/lib/ai/handle-oracle-chat-request.test.ts]
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

The Oracle is the most expensive surface, because every message is a billed model call. The pipeline refuses abuse cheaply first, caps each member's allowance, then selects a chat model allowed by the verified membership tier. There is no remote moderation call in chat; Laya and Jev remain in forum and signup screening.
