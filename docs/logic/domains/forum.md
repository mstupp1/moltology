---
id: forum
title: Forum & moderation
order: 7
color: '#00ffc8'
summary: Member posts pass local safety checks, a rate limit, and a Jev quality gate. Flags are soft and staff review them in Covenant Watch.
rules:
  - id: forum.write-pipeline
    title: Forum write pipeline
    kind: flow
    statement: Creating or editing a topic or reply runs sign-in, the rate limit, length and safety checks, and the Jev gate, in that order, before anything is stored.
    dependsOn: [access.write-auth]
    anchors:
      - file: src/lib/server/db-services.ts
        symbol: createForumTopicHandler
      - file: src/lib/server/db-services.ts
        symbol: requirePublishableForumPost
    tests: [src/lib/server/forum.test.ts, src/lib/server/forum-quality.test.ts]
    flow:
      - id: submit
        label: Topic or reply submitted
        kind: start
        next: [auth]
      - id: auth
        label: Verified JWT?
        next:
          - { to: unauth, label: 'no' }
          - { to: rate, label: 'yes' }
      - id: unauth
        label: Sign-in required
        kind: outcome
        tone: block
      - id: rate
        label: Over 10 writes a minute?
        next:
          - { to: slow, label: 'yes' }
          - { to: local, label: 'no' }
      - id: slow
        label: Posting too quickly
        kind: outcome
        tone: warn
      - id: local
        label: Length, secrets, harm checks
        next:
          - { to: invalid, label: 'fail' }
          - { to: jev, label: 'pass' }
      - id: invalid
        label: Plain validation error
        kind: outcome
        tone: block
      - id: jev
        label: Jev prohibited score
        kind: action
        next:
          - { to: quarantine, label: '> 0.8' }
          - { to: quality, label: 'ok' }
          - { to: publish, label: 'down' }
      - id: quarantine
        label: Refused, not stored
        kind: outcome
        tone: block
      - id: quality
        label: Quality under 50?
        next:
          - { to: publish-quiet, label: 'yes' }
          - { to: publish, label: 'no' }
      - id: publish-quiet
        label: Stored, kept out of Hot
        kind: outcome
        tone: warn
      - id: publish
        label: Stored and eligible for Hot
        kind: outcome
        tone: allow
  - id: forum.rate-limit
    title: Ten writes per minute
    kind: limit
    statement: Each member can create or edit at most 10 topics or replies per 60 seconds.
    dependsOn: [forum.write-pipeline]
    flag:
      level: watch
      note: The limiter is an in-memory map per server instance, so on serverless it resets on cold starts and is not shared across instances.
    anchors:
      - file: src/lib/community-rules.ts
        symbol: FORUM_WRITE_RATE_LIMIT
      - file: src/lib/community-rules.ts
        symbol: FORUM_WRITE_RATE_WINDOW_MS
      - file: src/lib/ai/guardrails.ts
        symbol: checkRateLimit
    tests: [src/lib/community-rules.test.ts]
  - id: forum.content-limits
    title: Length limits
    kind: limit
    statement: Topic titles must be 5 to 150 characters. Topic and reply bodies must be 10 to 10,000 characters.
    dependsOn: [forum.write-pipeline]
    anchors:
      - file: src/lib/community-rules.ts
        symbol: validateForumContent
    tests: [src/lib/community-rules.test.ts]
  - id: forum.content-safety
    title: Secret and harm detectors
    kind: gate
    statement: Titles and bodies are refused when they match high-precision patterns for leaked secrets (API keys, passwords, connection strings) or explicit real-world harm. The same detectors guard Oracle input.
    dependsOn: [forum.write-pipeline]
    anchors:
      - file: src/lib/content-safety.ts
        symbol: containsSecretLeak
      - file: src/lib/content-safety.ts
        symbol: containsHarmfulContent
    tests: [src/lib/community-rules.test.ts]
  - id: forum.jev-shared
    title: Shared Jev settings
    kind: threshold
    statement: Jev acts only on a clear yes, above 0.8 confidence, with a 1,200 ms default budget and no retries. A timeout or outage returns nothing, and callers fall back to local checks.
    anchors:
      - file: src/lib/quality/jev.ts
        symbol: JEV_HIGH_CONFIDENCE
      - file: src/lib/quality/jev.ts
        symbol: JEV_EVAL_TIMEOUT_MS
      - file: src/lib/quality/jev.ts
        symbol: evaluateWithJev
  - id: forum.quarantine
    title: Prohibited posts never insert
    kind: gate
    statement: When Jev is more than 80% sure a post is spam, harassment, solicitation, or leaks secrets, it is refused with a plain message and never stored.
    dependsOn: [forum.jev-shared, forum.write-pipeline]
    anchors:
      - file: src/lib/quality/forum-gate.ts
        symbol: decideForumGate
    tests: [src/lib/quality/forum-gate.test.ts]
  - id: forum.hot-feed-quality
    title: Quality 50 for Hot
    kind: threshold
    statement: Posts that score under 50 of 100 are stored but kept out of the Hot feed. Pinned topics and search still show them, and the member's chosen board is never moved.
    dependsOn: [forum.quarantine]
    anchors:
      - file: src/lib/quality/forum-gate.ts
        symbol: FORUM_TRENDING_QUALITY_MIN
      - file: src/lib/quality/forum-gate.ts
        symbol: visibleInHotFeed
    tests: [src/lib/quality/forum-gate.test.ts]
  - id: forum.fail-open
    title: Forum gate fails open
    kind: invariant
    statement: If Jev is unavailable, the post is allowed after the local checks, and a fallback never wipes a score Jev gave earlier.
    dependsOn: [forum.jev-shared]
    anchors:
      - file: src/lib/quality/forum-gate.ts
        symbol: screenForumSubmission
      - file: src/lib/quality/forum-gate.ts
        symbol: forumTopicQualityFields
    tests: [src/lib/quality/forum-gate.test.ts]
  - id: forum.author-only-edits
    title: Authors edit their own posts
    kind: permission
    statement: Only the author can revise or withdraw a topic or reply. Withdraw is a soft delete, so threads and nested replies stay intact.
    dependsOn: [access.write-auth]
    anchors:
      - file: src/lib/server/db-services.ts
        symbol: assertForumAuthor
    tests: [src/lib/server/forum.test.ts]
  - id: forum.locked-threads
    title: Locked threads refuse replies
    kind: gate
    statement: Replies to a locked topic are rejected on the server, and the thread hides its composers.
    dependsOn: [forum.write-pipeline]
    anchors:
      - file: src/lib/community-rules.ts
        symbol: FORUM_LOCKED_ERROR
      - file: src/lib/server/db-services.ts
        symbol: createForumPostHandler
    tests: [src/lib/server/forum.test.ts]
  - id: forum.peer-flags
    title: Peer flags are soft
    kind: invariant
    statement: Members can flag another member's topic or reply, but not their own or withdrawn posts. A flag is a private row and never edits or hides the post. One open flag per reporter per target.
    dependsOn: [access.write-auth]
    anchors:
      - file: src/lib/forum-reports.ts
        symbol: canFlagForumTarget
      - file: src/lib/forum-reports.ts
        symbol: FORUM_REPORT_NOTE_MAX
    tests: [src/lib/forum-reports.test.ts, src/lib/server/forum-reports.test.ts]
  - id: forum.covenant-watch
    title: Staff review flags
    kind: permission
    statement: Only staff can list open flags or mark them reviewed at Covenant Watch. Reviewing changes the flag status only and does not touch the post.
    dependsOn: [forum.peer-flags, access.staff]
    anchors:
      - file: src/lib/server/db-services.ts
        symbol: assertCovenantSteward
      - file: src/lib/server/db-services.ts
        symbol: reviewForumReportHandler
    tests: [src/lib/server/forum-reports.test.ts]
  - id: forum.community-rules
    title: Five community rules
    kind: invariant
    statement: The published rules cover civility, no spam, no secrets, respect across stages, and safety first. Three of them are critical severity.
    anchors:
      - file: src/lib/community-rules.ts
        symbol: COMMUNITY_RULES
    tests: [src/lib/community-rules.test.ts]
---

Moderation is deliberately light. The gate refuses only clear abuse. Everything else is published, and low quality is handled by keeping it out of Hot, not by deleting it. Staff act on flags by hand.
