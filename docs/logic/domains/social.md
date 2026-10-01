---
id: social
title: Identity & social
order: 9
color: '#9fe8ff'
summary: Members claim one unique handle, and feeds only show real activity from the member and their friends. Empty stays honest.
rules:
  - id: social.handle-rules
    title: Handle format
    kind: limit
    statement: A handle is 3 to 20 letters, numbers, or underscores. It is unique regardless of case. Reserved words and obvious impersonation are rejected, not rewritten.
    anchors:
      - file: src/lib/member-handle.ts
        symbol: HANDLE_MIN_LENGTH
      - file: src/lib/member-handle.ts
        symbol: HANDLE_MAX_LENGTH
      - file: src/lib/member-handle.ts
        symbol: parseMemberHandle
      - file: src/db/schema.ts
        symbol: profiles.handle
    tests: [src/lib/member-handle.test.ts]
  - id: social.handle-at-character-create
    title: Handle is claimed once, at character create
    kind: flow
    statement: Signup asks only for email and password. The handle is claimed in the character-create step, and Settings is the later way to claim or change it. There is no extra popup.
    dependsOn: [social.handle-rules]
    anchors:
      - file: src/lib/member-handle.ts
        symbol: parseMemberHandle
  - id: social.public-name
    title: Public name fallback
    kind: invariant
    statement: Everywhere a member is named, show the claimed handle, or else their unique larva unit. The auth display name is never used as a public name.
    dependsOn: [social.handle-rules]
    anchors:
      - file: src/lib/member-handle.ts
        symbol: resolveMemberPublicName
    tests: [src/lib/member-handle.test.ts]
  - id: social.honest-feeds
    title: Feeds show only real activity
    kind: invariant
    statement: Activity feeds come from real rows in activity_events. There is no canned or seeded proof, and failures and guests get an empty stream.
    anchors:
      - file: src/lib/activity-events.ts
        symbol: ACTIVITY_EVENT_KINDS
      - file: src/lib/server/activity-log.ts
        symbol: listActivityFeed
    tests: [src/lib/activity-events.test.ts, src/lib/server/activity-events.test.ts]
  - id: social.circle-scope
    title: Circle means accepted friends
    kind: permission
    statement: The Circle feed shows pulses from accepted friends only. The You feed shows the member's own pulses.
    dependsOn: [social.honest-feeds]
    anchors:
      - file: src/lib/server/activity-log.ts
        symbol: listFriendIdsForUser
  - id: social.suggestions
    title: Synaptic nearby suggestions
    kind: threshold
    statement: Connections suggests up to 5 members. It excludes self, friends, pending requests, and dismissed members, and prefers the same stage, then an adjacent stage, then recent activity.
    anchors:
      - file: src/lib/connections.ts
        symbol: SYNAPTIC_NEARBY_LIMIT
      - file: src/lib/connections.ts
        symbol: compareSynapticNearby
    tests: [src/lib/connections.test.ts]
  - id: social.remote-inbox-off
    title: Remote inbox is off
    kind: gate
    statement: The HUD notification inbox does not read from the server. The client skips the fetch, and the server returns an empty list without touching the database, until a push or no-poll path exists.
    dependsOn: [data.neon-compute-budget]
    anchors:
      - file: src/lib/notifications-refresh.ts
        symbol: NOTIFICATIONS_REMOTE_INBOX_ENABLED
      - file: src/lib/notifications-refresh.ts
        symbol: NOTIFICATIONS_MIN_INTERVAL_MS
    tests: [src/lib/notifications-refresh.test.ts]
---

Social surfaces follow one rule. Show real people and real activity, or show nothing. A quiet new account sees an honest, empty stream instead of fake veterans.
