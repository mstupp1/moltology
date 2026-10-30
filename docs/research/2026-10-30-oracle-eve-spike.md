# Oracle and Vercel eve spike

Date: 2026-10-30. Status: research and code inspection; no runtime integration installed or deployed.

## Recommendation

Keep the existing Oracle chat and improve its access to accurate product knowledge first. Trial eve behind a development feature flag on one resumable daily briefing. Adopt more of eve only if the trial proves that durable work is useful enough to justify the extra runtime, billing, and data lifecycle work.

eve fits our stack on paper unusually well: it has an official TanStack Start + Nitro integration. It is still in preview. Compatibility is documented, not yet demonstrated against this project's exact dependency versions, build pruning, authentication, or deployment. [TanStack integration](https://eve.dev/docs/guides/frontend/tanstack), [preview status](https://github.com/vercel/eve/blob/main/docs/README.md).

## What eve actually does

The model produces answers and chooses actions. The AI SDK supplies model calls and streaming. eve adds the runtime that manages an agent's ongoing work.

An agent is authored as a directory: instructions in Markdown, callable tools in TypeScript, optional skills for specific procedures, and configuration for the model. Channels, schedules, and specialist agents extend it. A tool is code we permit the model to call; a skill is guidance, not an authorization boundary. [Framework overview](https://vercel.com/eve).

Its distinguishing feature is durable execution: a conversation is a checkpointed workflow that can wait and resume after interruptions. This becomes valuable when the Oracle gathers information in several steps, waits for approval, or finishes work after the member leaves. It does not make an incorrect answer correct or grant knowledge of our application. [Introducing eve](https://vercel.com/blog/introducing-eve).

## What the Oracle currently does

Verified from this checkout, rather than inferred from product descriptions:

- `src/lib/ai/handle-oracle-chat-request.ts` handles `/api/chat`, verifies JWT identity, applies flood/input checks, returns canned guest replies, checks member allowances, screens the prompt, checks thread ownership, and reserves usage atomically before generation.
- Existing threads load recent saved turns from the server. Only the latest user message is accepted from the browser as new model input. History is capped at 20 messages and 16,000 characters; output at 1,024 tokens.
- `src/lib/ai/oracle-models.ts` currently lists **one** model, `zai/glm-5.3-flash`. The request loop supports candidates, but there is no effective multi-model fallback with that list.
- `src/lib/ai/codex-prompt.ts` returns a shared static prompt including scripture summaries. Its context argument is ignored. The prompt does not fetch a member's live progress, full scripture passages, or course catalog.
- `src/lib/ai/stream-oracle-chat-client.ts` consumes a plain text stream with a thread ID response header. `AIChatPanel.tsx` feeds streamed text into the existing animated entity bridge.
- No tools are passed to the current `streamText` call. The Oracle advises through text; this path is not an action-taking agent.
- `src/lib/ai/usage-limits.ts` defines free allowances of 5 messages/minute, 15/rolling five hours, and 100/rolling week; Premium multiplies these by ten.
- `src/lib/ai/chat-retention.ts` defines a 50-conversation cap and 30-day archive retention constant. Any second conversation store needs explicit lifecycle coordination.
- `package.json` uses AI SDK 7, React 19, TanStack Start, Vite 8, Nitro, Better Auth, and Drizzle/Neon. eve is absent. The inspected local Node runtime is v24.22.1.

Documentation drift: `docs/logic/domains/oracle.md` still describes browser-supplied history, three models, and intent-selected context. Current implementation differs on all three. This spike does not update business rules or the Atlas; a separate refresh should reconcile them.

## Where it fits, and where it does not

### Build and hosting

The documented `eveTanStack()` plugin from `eve/tanstack` mounts the agent alongside a React TanStack Start app with Nitro. Local development proxies eve routes; Vercel output includes an eve service. The existing app should follow the integration guide directly rather than generate another web chat app.

Important fit checks: exclude the plugin from Vitest setup (the guide says serve-mode config loading can start eve); preserve our existing media rewrite and headers; inspect generated Build Output and `scripts/prune-vercel-function.mjs`. `vite preview` and our Node start command do not automatically host eve routes, and default Node output directories can collide. [Integration and deployment topology](https://eve.dev/docs/guides/frontend/tanstack).

### Identity and permissions

Better Auth does not need replacing. eve supports a custom inbound authenticator, so our verified JWT can identify the member. However, route authentication does **not** enforce session ownership. We must check ownership for stream, continuation, cancellation, approval, and other control routes, as well as create requests. Model-provided IDs and browser page context are not authority. [Authentication guide](https://github.com/vercel/eve/blob/main/docs/guides/auth-and-route-protection.md).

### Chat and persistence

eve's `useEveAgent` consumes structured messages/events, supports approvals, and resumes sessions. Our current text-only reader cannot consume that protocol unchanged. Keep the Oracle visual design, but add an adapter for text, activity, approval, error, and cancellation states. Store a member-owned mapping between our thread ID and the eve session ID. Pick one authoritative conversation source per conversation; do not leave two stores independently owning history. [Frontend guide](https://github.com/vercel/eve/blob/main/docs/guides/frontend.md).

Deletion must cover workflow history, any memory/artifacts, and application records. Deleting a thread row alone cannot be assumed to delete eve data. Historical conversations can remain on the current implementation during a trial.

### Tools and knowledge

eve can organize tools, but we still implement the authorized data access. Start with small read-only capabilities such as `get_my_progress` and `find_scripture`, returning only the fields required. Use the authenticated member, not a `userId` tool argument, for scope. Product thresholds must come from implemented rules. Scripture passages should return real links and identifiers for citation.

The existing AI SDK can also call tools, so knowledge lookup and personalization do not require an eve migration. Prefer the smallest implementation for those improvements.

### Cost and operational control

One chat message currently reserves one allowance slot. An agent turn can make multiple model calls and tool calls. Preserve the member allowance, then add separate server-enforced ceilings for total tokens, steps, tool calls, elapsed work, and concurrency. Replayed deliveries must not reserve twice; retried writes must not execute twice. Decide explicitly whether future scheduled briefings consume allowance.

Measure model tokens plus workflow usage, function compute, and any sandbox/storage/network use. Workflow and Sandbox have separate billing dimensions; “same model” does not imply the same cost per useful answer. This spike has no measured eve cost or latency result. [Workflow pricing](https://vercel.com/docs/workflows/pricing), [Sandbox pricing](https://vercel.com/docs/sandbox/pricing).

eve includes sandbox-backed shell/file tools. These are unnecessary for basic member guidance; restrict the pilot's available capabilities and prove that it cannot reach unintended services or credentials. A sandbox isolates execution; it does not enforce our product permissions. [Sandbox guide](https://github.com/vercel/eve/blob/main/docs/sandbox/index.mdx).

## Short term: useful improvements with little ceremony

These are rough engineering estimates for an experienced developer familiar with this repository, including scoped verification. They are not delivery promises and are not additive; first-time setup may take longer.

| Priority | Feature and member experience | Suggested approach | Estimated effort |
|---|---|---|---|
| 1 | Accurate answers with sources: “Which scripture helps with distractions?” returns a relevant passage and a working link. | Add bounded lookup over canonical content to the current Oracle; start with simple text/metadata search before embeddings. | 1–2 days |
| 2 | Personal next step: “What should I do today?” uses actual progress and available tasks. | Supply a compact authorized server snapshot; verify actual source queries before implementation. | 1–3 days |
| 3 | Catch answer regressions before release. | Add a small answer evaluation set covering doctrine, real mechanics, warmth, unsupported claims, and injection attempts. Keep deterministic permission tests separate. | 1–2 days |
| 4 | Learn eve through one private daily briefing that survives reload. | Development-only eve trial with fixture data and one read-only capability, then authorized development data. | 3–5 days |

The first three can ship independently of eve. eve has an evaluation runner that exercises its HTTP agent interface, including tool assertions and fixture models, if we adopt it. Existing Vitest checks remain useful for deterministic behavior. [Evals guide](https://github.com/vercel/eve/blob/main/docs/evals/overview.mdx).

Avoid initially: a vector database project, arbitrary shell use, multiple specialist agents, external account connections, or migrating every conversation. None is necessary to answer a member's next question better.

## Medium term: a companion that helps complete work

Over several incremental releases, roughly the next 1–3 months if evidence supports investment:

- **A weekly reflection:** summarize the member's recorded activity, identify a pattern, and suggest one adjustment. Distinguish recorded facts from interpretation. Offer on demand first; scheduling adds notification preferences, timezone handling, deduplication, and delivery work.
- **A guided learning path:** retrieve published Academy material, explain why it fits, and link the member into the actual course. The Oracle can tutor without claiming a course was completed.
- **Confirmed actions:** draft a focus plan or a supported task change and show the precise proposed result before the member approves. Use existing authenticated mutation paths; the model never awards XP, standing, or clearance.
- **Continuity the member controls:** remember an explicitly saved goal or communication preference, with edit/forget controls. Conversation persistence alone is not a complete memory product.

eve becomes more valuable here because workflows can wait for approval and resume. Its human-in-the-loop facilities supply the pause/resume mechanism; we still own the action's authorization and durable deduplication. [Approval tools](https://github.com/vercel/eve/blob/main/docs/tools/human-in-the-loop.md).

## Long term: the Oracle as a persistent guide

A direction for 6–12+ months, not an implementation estimate:

A member says, “Help me build a routine I can keep.” The Oracle helps choose a small goal, prepares a plan using actual activity and learning material, checks in at an agreed time, and adapts after reflection. It can produce a progress review or a useful plan artifact. Members choose what is remembered and when it may contact them.

Later, optional calendar or messaging connections could place agreed focus blocks where the member works. Specialist agents could research learning material or analyze a long activity history, but only when measured quality gains outweigh added latency and cost. Public/community channels need a separate identity and privacy design; private chat history must not carry into a shared conversation by default.

The product value is continuity and follow-through. Success means the member completes a useful action or finds the right material, not that the agent makes more calls.

## Concrete next experiment

Build **“Help me choose today's focus”** in a private development route, leaving normal Oracle chat on its current path.

1. Pin an eve release after checking its current package requirements. Run a fixture-backed agent with one tool and a bounded answer; keep the brand prompt shared rather than maintaining two divergent personalities.
2. Prove TanStack/Nitro development and Vercel preview builds, including our pruning script, before adding personal data.
3. Add JWT verification and owner-scoped thread/session mapping. Every entry point must enforce ownership. Keep guests on the existing canned path.
4. Add the current allowance reservation behind a request idempotency key; cap agent work separately. Read-only tools only.
5. Test interruption and reload, session continuation, cancellation, foreign-session access, concurrent sends at the last allowance slot, dependency failures, and deletion. Verify default capabilities are restricted.
6. Compare a fixed set of requests against current chat: useful-answer rate, correct citations, first-token and completion latency, total tokens/cost, recovery behavior, and engineering complexity. Do not claim gains without measurements.

Go forward if the agent reliably resumes, preserves ownership and allowances, improves usefulness, and stays within a budget agreed from measurements. Otherwise keep the knowledge/personalization improvements on the current AI SDK implementation. The experiment remains valuable because it tells us whether we need an agent runtime yet.

## Scope of this spike

Completed: official documentation research, inspection of the Oracle request/client/prompt/usage/retention code and build configuration, compatibility assessment, phased options, and a bounded experiment plan.

Not performed: package installation, compilation with eve, live model evaluation, Vercel preview deployment, account/plan inspection, production writes, or changes to visible UI. Technical fit remains provisional until the experiment runs.
