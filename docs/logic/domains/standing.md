---
id: standing
title: Forum Standing
order: 11
color: '#f7e463'
summary: Standing is a member's forum reputation, from upvotes plus review adjustments. It decides who can start threads, which replies sink, and who is limited.
rules:
  - id: standing.score
    title: Standing is upvotes plus adjustments
    kind: invariant
    statement: A member's Standing is the number of upvotes other members gave their topics and replies, plus any adjustment from the Standing review. Self-votes do not count.
    dependsOn: [economy.red-line]
    anchors:
      - file: src/lib/server/forum-standing.ts
        symbol: computeMemberStanding
      - file: src/lib/server/forum-standing.ts
        symbol: countUpvotesReceived
    tests: [src/lib/server/forum-standing.test.ts]
  - id: standing.thread-gate
    title: Who can start threads
    kind: gate
    statement: Anyone can reply right away. Starting a thread needs an account at least 3 days old plus either 3 Standing or 500 XP. The XP path is closed to accounts flagged at signup. Staff are never gated.
    dependsOn: [standing.score, forum.write-pipeline, signup.risk-events]
    anchors:
      - file: src/lib/forum-standing.ts
        symbol: evaluateForumStanding
      - file: src/lib/forum-standing.ts
        symbol: STANDING_TOPIC_MIN
      - file: src/lib/forum-standing.ts
        symbol: STANDING_TOPIC_XP_PATH
    tests: [src/lib/forum-standing.test.ts]
  - id: standing.restricted
    title: Low Standing limits replies
    kind: limit
    statement: At -5 Standing or lower a member cannot start threads and can post at most 3 replies a day.
    dependsOn: [standing.score]
    anchors:
      - file: src/lib/forum-standing.ts
        symbol: STANDING_RESTRICTED_AT
      - file: src/lib/server/forum-standing.ts
        symbol: assertCanReply
    tests: [src/lib/forum-standing.test.ts, src/lib/server/forum-standing.test.ts]
  - id: standing.sunk-replies
    title: Weak replies sink
    kind: threshold
    statement: A reply is stored collapsed and sorted last when it scores under 50 or its author's Standing is negative.
    dependsOn: [standing.score, forum.hot-feed-quality]
    anchors:
      - file: src/lib/forum-standing.ts
        symbol: shouldSinkReply
    tests: [src/lib/forum-standing.test.ts]
  - id: standing.review
    title: Standing review
    kind: flow
    statement: Each simulation run reviews real members' unreviewed posts from the last 7 days, up to 25 topics and 25 replies. Posts keep their live score, and only posts the live check missed are rescreened. A post scoring 75 or more gets an upvote from a simulated member. One under 25 sinks and costs 1 Standing, and a prohibited one sinks and costs 3.
    dependsOn: [standing.score, forum.fail-open]
    anchors:
      - file: src/lib/server/forum-standing.ts
        symbol: reviewMemberPosts
      - file: src/lib/forum-standing.ts
        symbol: reviewOutcome
    tests: [src/lib/server/forum-standing.test.ts]
    flow:
      - id: post
        label: Unreviewed member post
        kind: start
        next: [scored]
      - id: scored
        label: Scored when posted?
        next:
          - { to: verdict, label: 'yes' }
          - { to: rescreen, label: 'no' }
      - id: rescreen
        label: Rescreen with 10 s budget
        kind: action
        next:
          - { to: deferred, label: 'no answer' }
          - { to: verdict, label: 'scored' }
      - id: deferred
        label: Left for the next run
        kind: outcome
      - id: verdict
        label: Score band
        next:
          - { to: upvote, label: '75 or more' }
          - { to: neutral, label: '25 to 74' }
          - { to: weak, label: 'under 25 or prohibited' }
      - id: upvote
        label: Simulated member upvotes
        kind: outcome
        tone: allow
      - id: neutral
        label: No change
        kind: outcome
      - id: weak
        label: Sink and lower Standing
        kind: outcome
        tone: block
  - id: standing.gain-cap
    title: Two Standing per review run
    kind: limit
    statement: One review run can raise an author's Standing by at most 2, counting review upvotes and adjustments together, so a burst of posts cannot farm Standing.
    dependsOn: [standing.review]
    anchors:
      - file: src/lib/forum-standing.ts
        symbol: REVIEW_MAX_GAIN_PER_CYCLE
      - file: src/lib/forum-standing.ts
        symbol: tallyStandingDeltas
    tests: [src/lib/server/forum-standing.test.ts]
  - id: standing.simulated-votes
    title: Simulated votes skip weak posts
    kind: invariant
    statement: Simulated members never upvote their own posts, collapsed posts, or posts scored under 50. Unscored posts stay eligible.
    dependsOn: [standing.sunk-replies]
    anchors:
      - file: src/lib/simulation-social.ts
        symbol: isSimulatedVoteWorthy
    tests: [src/lib/simulation-social.test.ts]
---

Standing is the forum's reputation score. It comes from other members' upvotes and gates the actions that cost the community the most: new threads and high reply volume.
