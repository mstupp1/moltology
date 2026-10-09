# Instagram comment-to-DM delivery

## Current operating rule

Treat automated resource delivery as **disabled / unverified**. The user asked to keep it off for now and preserve this handoff for future setup. Do not provision or enable rules as part of content creation.

Before drafting or queueing any Instagram post, carousel, one-off reel, or series episode, review every delivery claim in the caption, first comment, narration, subtitles, slide artwork, and outro. Do not use “comment GUIDE and I'll DM you,” “instant DM,” “check your DMs,” or any equivalent resource-delivery promise while automation is disabled or unverified. Comment keywords may invite discussion, but must not imply that commenting delivers a resource.

Use a direct resource URL in the first comment. Mention a bio or story link only when that destination has been checked. For example:

```text
Take the Moltmaxxing Audit and find your next small shed:
https://moltology.org/quiz
```

Legacy CLI presets still contain DM promises. Review their generated text and artwork rather than trusting the defaults. For `post:create` and `reel:create`, pass approved copy with `--content-json` and inspect the final output. For carousel and series paths, inspect generated copy before queueing; if the CLI cannot preserve corrected copy, update that path before using it. A first comment, `commentKeyword`, or `commentTriggerKeyword` field does not register a delivery automation.

## Supplied investigation (historical evidence)

The user's handoff reported the following; these are not a fresh live verification:

- Zernio supports `POST /v1/comment-automations`, keyword matching (`word`, `contains`, `exact`), DM links/buttons, optional public replies, and account-wide rules.
- Instagram account `moltology_org`, ID `6a7f7f0777555aae01d99b54`, had `instagram_business_manage_messages` and `instagram_business_manage_comments` granted. Recheck permissions before activation.
- `GET /v1/comment-automations` for Moltology profile `6a7f74b1839bf39ff3b6aaaa` returned `automations: []` at the time of that investigation.
- `scripts/create-instagram-post.ts` and `scripts/create-reel.ts` generated copy and first comments without registering automation rules. Writing or scheduling a first comment does not send a DM.

## Saved keyword mappings

These are proposed resource mappings, not active rules. Check destinations before enabling them.

| Keywords | Resource URL |
| --- | --- |
| `GUIDE`, `ROUTINE` | `https://moltology.org/news/the-2026-moltmaxxing-protocol-guide` |
| `PROMPTS`, `ORACLE` | `https://moltology.org/oracle` |
| `QUIZ` | `https://moltology.org/quiz` |
| `APP`, `DEMO` | `https://moltology.org` |
| `CODEX` | `https://moltology.org/codex` |
| `CHASSIS` | `https://moltology.org/chassis` |
| `ACCESS`, `INITIATE` | `https://moltology.org` |

The series skill also lists `AUDIT`, `MOLTMAX`, and `SHED`. These aliases are unprovisioned; explicitly map and verify each before using it in a delivery CTA.

## Future activation checklist

When the user requests activation:

1. Recheck Zernio's current API contract, account permissions, existing rules, and resource URLs. Record which account, keyword, match mode, and post scope each rule covers. Do not infer readiness from permissions alone.
2. Add a provisioning CLI such as `scripts/setup-comment-automations.ts`, using `fetchZernio` from `scripts/lib/zernio-client.ts`. The client already includes `/api/v1` in its base URL, so its endpoint argument is `/comment-automations`. Include dry-run planning and duplicate detection so reruns do not create duplicate deliveries.
3. The handoff proposes account-wide rules by omitting `platformPostId`, covering past and future posts/reels. Confirm that behavior in the current contract and review older CTAs for conflicting keyword meanings before applying it. Configure `dmMessage` with the mapped URL; add `commentReply` and `actions: { likeComment: true }` only where supported. Verify any name placeholders rather than assuming `{{first_name}}` works.
4. Read back the saved rules and confirm they are enabled for the intended account, keyword, and scope. Test a real comment from another Instagram account and confirm the correct DM/link arrives, plus the public reply if configured. Rule creation success alone is insufficient.
5. Save rule IDs, verified mappings/scope, and dated test results here or in a linked operational record. Only then permit DM promises for the specific verified keywords and posts. If a rule is paused, missing, failing, or unverified, return its CTA to direct-link copy.

Instagram rule verification does not establish delivery on YouTube Shorts. Keep cross-posted YouTube copy free of Instagram DM promises.
