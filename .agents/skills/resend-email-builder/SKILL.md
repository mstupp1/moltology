---
name: resend-email-builder
description: Create or update Moltology transactional emails using the shared dark React Email foundation and existing Resend sender. Use for verification, password resets, receipts, and necessary account or service messages; marketing campaigns need separate consent and compliance treatment.
---

# Resend Email Builder

Read `BRAND_BIBLE.md` and `STYLE_GUIDE.md` before writing copy. Account and service email copy is functional: plain English, a specific subject, a short preview, one clear purpose and primary action. The reference implementation is `src/emails/email-verification.tsx`.

## Build on the shared foundation

- Compose `TransactionalLayout` with preview text and message content. Reuse `TransactionalButton`, the brand header, footer, and `EMAIL_THEME` from `src/emails/components/transactional.tsx`.
- Keep the centered red emblem above **Moltology / THE SYNAPTIC PATH**, matching current header/merch branding. The email exporter reads `tee-moltology-v2` from `scripts/merch/designs.ts` and scales its complete composition uniformly; preserve the emblem-to-wordmark ratio and spacing rather than sizing the parts independently. Do not substitute the older Synaptic Path/Foundation lockups. Existing artwork is under `content/brand/synaptic-path/parts/merch-v2/` alongside the canonical `parts/icon.svg`.
- Default to the dark single-column layout: backgrounds `#070b0b` / `#0f1414`, text `#e4e9e9`, muted `#8fa0a0`, cyan `#00c3ff` buttons with dark lettering. Keep body text around 16px and primary tap targets at least 44px tall. Use email-safe tables and inline pixel-based styles; no app CSS, grid, flex, scripts or browser globals.
- Use existing React Email dependencies. For version-specific APIs consult Context7 and the installed versions; do not upgrade dependencies just to build a template.
- Use PNG email artwork with explicit dimensions and descriptive alt text. `npm run email:brand` deterministically exports the approved logo to ignored `tmp/email-brand/` and updates `src/emails/components/brand-asset.json`. Its content-hashed key avoids replacing cached artwork. Upload a newly generated PNG using `npm run s3:upload -- <file> --key <manifest-key>` before referencing it in production. The uploader also creates the WebP twin for website consumers; emails use `getAbsoluteAssetUrl` to retain PNG through the site's `/media/` CDN. Verify the public URL and image type.
- Color-scheme metadata and inline colors are best effort; email clients can override them. Do not promise identical rendering in every client.

## Line wrapping and card imagery

Avoid a single short word stranded at the end of a heading or paragraph. First shorten or rephrase awkward copy; use targeted Unicode nonbreaking spaces (`\u00a0` in TypeScript strings) for short phrases such as “below the surface,” brand/noun pairs, and the final two words of a paragraph. Apply this to headings, card titles, and buttons as well as body copy. Keep HTML/plain-text wording aligned. Do not bind entire paragraphs, force viewport-specific line breaks, or rely on `text-wrap: balance` support in email clients. Nonbreaking groups must remain short enough to fit narrow mobile layouts; inspect actual wrapping when visual review is requested rather than promising identical breaks in all clients.

For welcome cards, reuse the existing website dashboard, Oracle, and forum screenshots. `npm run email:images` makes 860×430 top crops as JPEGs in ignored `tmp/email-features/` and updates `src/emails/components/feature-assets.json`. Upload the three content-hashed originals with the existing `s3:upload` CLI (which also creates WebP twins), and verify the absolute `/media/` JPEG URLs including their stable `?v=<revision>` query. Upload before opening previews that fetch those public URLs; missing-image responses can be cached by the CDN. Do not put WebP/SVG into emails or invent product screenshots. Use table-based card borders, accessible linked image labels, live text and titles below the images, and one main CTA, so the email still works with images blocked.

## Message content and sending

Keep subject, preview, and content together in the template module; give components typed props and safe dummy `PreviewProps`. Include a browser-copyable URL for link-based account actions and the appropriate unsolicited-request note. Never put real auth tokens in previews, fixtures, logs or committed artifacts.

Read expiry and other operational numbers from their actual code constants. Verification uses `EMAIL_VERIFICATION_EXPIRES_IN_SECONDS` in `src/lib/auth-config.ts`, also consumed by Better Auth. Do not change auth semantics merely to change a design.

Provide plain text with the same action, URL, expiration, safety note and contact/legal links. Keep a text renderer independent of HTML rendering so HTML failures can still fall back to text. Maintain the existing render entry points when updating a message.

Send through `sendTransactionalEmail` in `src/lib/server/mail.ts`; preserve configured From addresses, existing failure propagation and idempotency behavior. Account emails should use the existing support inbox as Reply-To. Do not subscribe recipients to marketing or apply marketing opt-outs to necessary account messages. Creating or previewing a template does not authorize a live send, provider-setting change, merge or deployment.

## Welcome email pattern

`src/emails/welcome.tsx` introduces the daily routine, Oracle, and community with one dashboard button. Keep its 110px shared logo and three image cards with unnumbered headings. The introduction thanks the member for joining, rather than reporting that the account is ready. Feature titles and images link to absolute production URLs. Plain text contains the same content and destinations.

Automatic delivery is limited to `emailVerification.afterEmailVerification` and new verified Google account creation (OAuth callback or Google ID-token signup). The creation hook does not run on ordinary sign-ins or account linking. `src/lib/server/welcome-email.ts` checks verification and the profile, skips simulated or missing profiles, and contains lookup/sender failures so they cannot fail authentication. Do not add a backfill or send from generic session/profile-sync hooks.

The existing sender makes one best-effort attempt using `welcome-user/<user-id>` and support Reply-To. HTML failure falls back to text. No delivery table, retry queue, or automatic retry is configured: a failed attempt may be missed. Resend retains idempotency keys for 24 hours and requires the same payload for replay; this is not permanent once-only delivery. Later verification events (for example, verifying a changed email) can produce another welcome after that window. See [Resend idempotency guidance](https://resend.com/docs/dashboard/emails/idempotency-keys). Never change this to guaranteed delivery language without durable tracking.

## Business and legal treatment

The current operator is a U.S. individual using the Moltology brand; no registered entity or mailing address has been established for this template. The shared footer identifies Moltology, `support@moltology.org`, and the existing `/privacy` and `/terms` pages. Do not invent an LLC suffix, registered foundation status, postal address or registration number.

For a purely transactional account-verification message, keep promotional content out and omit marketing unsubscribe controls. U.S. CAN-SPAM guidance exempts qualifying solely transactional messages from most provisions; classification depends on content and purpose, not the sender helper's name. This is not a determination of compliance for every jurisdiction. See the [FTC compliance guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business).

Marketing or mixed-purpose messages require separate consent/classification review, functioning unsubscribe controls, and applicable sender disclosures. A website or support email does not replace a required postal address. U.S. commercial emails require a valid physical postal address, which can include a registered PO box or qualifying private mailbox. Reassess requirements if the operator, recipients, jurisdiction or message purpose changes.

## Review and verification

- `npm run email:preview` writes verification HTML and plain text with a dummy URL, plus welcome HTML and plain text, into ignored `tmp/email-preview/`; it sends nothing. Existing `npm run email` provides interactive React Email previews when requested.
- Test semantic HTML/plain-text parity, primary and fallback URLs (including escaping), branding, footer links, expiry and sender payload. Preserve text fallback and send-failure tests. Check markup size stays comfortably below Gmail's clipping limit.
- Run relevant Vitest files and `npm run typecheck`. Changes to the shared sender, auth or `src/lib/` also require `npm run test:core`; tooling changes require relevant script tests. Follow repo verification tiers; do not launch browser verification or a full build by default.
- Record starting Git state and follow `docs/content-worktree-hygiene.md` for supporting brand exports: keep previews/generated media ignored, preserve unrelated work, and commit intentional durable changes. Report asset publication, checks, previews, commit, and final Git state accurately. Sending/deployment remain distinct from publishing a required reusable brand asset.
