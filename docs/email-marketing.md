# Marketing email subscriptions

Marketing subscriptions are event-driven. There is no scheduled sync, background worker,
backfill, or new database table. Account verification and transactional messages continue
through the existing mail sender and do not add marketing contacts.

## Targeting in Resend

| Segment | ID | Target |
| --- | --- | --- |
| Moltology Leads | `06290d2e-55fa-4a58-a13a-131702a7e361` | Confirmed subscribers without an account |
| Moltology Users | `36d2442c-a7a6-44b0-9fa5-f8dae032d1b3` | Confirmed subscribers with an account |
| Moltology All Subscribers | `199591d4-aea9-487f-bcde-ee4c93e3551e` | Both groups in one Broadcast |

The empty default General segment was renamed to All Subscribers to stay within the
current three-segment plan. No existing contacts were imported or sent email.

Use one selected segment for each Broadcast and include Resend's unsubscribe link.
All Subscribers includes the same contacts as Leads and Users, so do not send a second
copy of the same campaign to it. Resend's global unsubscribed flag excludes opt-outs.
No Topics or per-category subscription preferences are configured.

## Events and consent

- Public guide and contact forms only request confirmation when the checkbox is checked.
  An unchecked public form never revokes existing consent.
- Pending requests use `leads.emailOptInAt` as the request timestamp while
  `emailOptIn=false`. The signed seven-day confirmation link must match that timestamp.
  Successful confirmation replaces it with the confirmation timestamp. Withdrawal clears
  it, invalidating pending links. Expired or superseded links do not subscribe contacts.
- Signup consent travels with the server signup request. When account verification is
  enabled, `profiles.emailOptInSource=signup_pending` records intent and the existing
  verification callback activates it. When verification is disabled, a separate marketing
  confirmation is sent. Browser session storage is not the consent source of truth.
- Verified members subscribe directly from settings; unverified members confirm by email.
  A failed provider call produces an error instead of reporting a successful preference
  save. Repeating the action is safe.
- New accounts convert matching subscribed leads to Users and preserve their provider
  unsubscribe status. Account creation alone never creates a marketing contact.
- Confirmed opt-in creates/locates the contact, assigns All Subscribers and its lifecycle
  segment, removes the opposite lifecycle segment, then activates marketing subscription.
- Opt-out updates an existing contact only, then clears matching lead/profile preferences.
  Simulated accounts cannot be subscribed through member settings or confirmation.
- `/api/email/webhook` verifies the raw-body Svix signature. For contact.updated opt-outs,
  it checks current Resend status before updating local preferences, so delayed events
  cannot undo a later re-subscription. Repeated deliveries are harmless; failures return
  HTTP 500 for Resend's own retry mechanism. Provider-side subscribe edits never create
  local consent. Resend continues to enforce its own delivery suppressions.

## Deployment activation

The three segments and a **disabled** webhook have been created in Resend. The webhook
is `74ae33ae-1925-4c8a-bdb0-3390d565d552`, targeting
`https://moltology.org/api/email/webhook`, subscribed only to `contact.updated`.

The segment IDs and signing secret are configured in this checkout's ignored `.env`.
A read-only API check confirmed the existing application key is valid but **sending-only**
(`restricted_api_key`). Vercel production already has `RESEND_API_KEY`; it was not changed.
Change that key from **Sending access** to **Full access** in the Resend Dashboard
so the same `RESEND_API_KEY` can also manage Contacts and Segments. The API/MCP
can only rename keys; permission changes must be made in the dashboard.
See https://resend.com/changelog/update-api-key-name. If the dashboard retains the
existing token, no API-key environment update is needed. If it issues a replacement,
update `RESEND_API_KEY` in both the local environment and Vercel production.
Do not copy that file into Git or print the secret in logs.

Before activating production:

1. Edit the existing Resend API key in the dashboard and change **Sending access**
   to **Full access**. This grants the Contacts and Segments access required by this
   integration. Keep using `RESEND_API_KEY`; no second key or variable is required.
2. Set `RESEND_LEADS_SEGMENT_ID`, `RESEND_USERS_SEGMENT_ID`,
   `RESEND_ALL_SUBSCRIBERS_SEGMENT_ID`, and `RESEND_WEBHOOK_SECRET` in the production
   server environment. Retrieve the webhook signing secret
   from Resend or the local ignored environment file through a secure secret workflow.
3. Deploy this branch through the normal release process. No migration is required.
4. Enable the prepared webhook in Resend once the route is deployed and test a signed
   contact.updated delivery. Use the owner's address for an explicit opt-in, account
   preference change, and Broadcast unsubscribe test.

Local/preview environments must not register their own webhook against these production
segments. Unit tests mock Resend; they never create contacts or send emails.

## Failure handling

There is intentionally no automatic application-side reconciliation. An unsuccessful
optional subscription does not block account creation, guide download, or contact-message
delivery; the UI reports the marketing failure separately where the request returns it.
Settings errors leave the previous UI preference visible and allow retry. If account
verification succeeds but contact activation fails, verification remains successful; the
server logs a non-sensitive warning and the member can subscribe again in settings.

If an API call succeeds but a later local write fails, the action may need to be repeated.
Webhook retries repair failed inbound opt-outs. This is the chosen small, event-driven v1.
Email-address changes and automatic transfer of consent between addresses are not added.
