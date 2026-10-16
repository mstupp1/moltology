# Merch store launch checklist

The on-site store (`/store`) is built and stays behind the admin-only `new-store` experiment until
these steps are done. Everyone else keeps the Etsy link. Item management lives in the
[`merch-manager`](../.agents/skills/merch-manager/SKILL.md) skill.

## How an order flows

1. The member adds pieces to the cart (stored in their browser) and checks out.
2. `createMerchCheckoutSessionHandler` re-prices every line from the database, writes a `pending`
   order, and opens Stripe Checkout with shipping address collection and flat-rate shipping.
3. Stripe sends `checkout.session.completed` to `/api/stripe/webhook`. Orders with
   `metadata.orderType=merch` are marked `paid` and sent to Printful only when the session's
   `payment_status` is `paid`. A delayed payment method (such as a bank debit) completes unpaid:
   the order waits as `awaiting_payment` until `checkout.session.async_payment_succeeded`, or
   becomes `payment_failed` on `checkout.session.async_payment_failed`.
4. The order becomes `submitted_to_printful`, or `fulfillment_failed` with the reason stored on it.

## What is left

### Myles

- [ ] **Printful account.** Create a store of type "Manual order platform / API", then create a
      private API token with the `orders`, `sync_products`, `file_library` and `catalog` scopes.
      Put it in `.env` and Vercel as `PRINTFUL_API_TOKEN`. If the token covers several stores,
      also set `PRINTFUL_STORE_ID`.
- [ ] **Printful billing.** Add a card or fund the Printful wallet. Printful charges cost plus
      shipping for each order it prints.
- [ ] **Stripe webhook.** In the Stripe dashboard, open the existing `/api/stripe/webhook` endpoint
      and make sure `checkout.session.completed`, `checkout.session.async_payment_succeeded` and
      `checkout.session.async_payment_failed` are among its events (Premium already uses this
      endpoint and secret).
- [ ] **Stripe Tax** (optional). Turn it on in Stripe, then set `STRIPE_AUTOMATIC_TAX=true`.
- [ ] **Shipping price.** `MERCH_SHIPPING_CENTS` defaults to 695 ($6.95 flat). Change it in Vercel
      if Printful's real rates for the main markets are higher.
- [ ] **Policy.** Confirm the returns line on product pages ("we replace anything that arrives
      damaged or misprinted ... within 30 days"), or give the wording to use.
- [ ] **Neon.** The database is over its quota until it resets or the plan changes; the seed and
      any order need it.

### Then (Claude or whoever picks this up)

- [ ] `npm run merch -- blanks` and confirm the blanks: White Glossy Mug (#19) and Bella + Canvas
      3001 (#71). Check the mug print area against the 2700 x 1050 files in `scripts/merch/designs.ts`.
- [ ] `npm run merch -- sync`, check each product in the Printful dashboard (placement, print
      size), commit `content/merch/printful-sync.json`.
- [ ] `npm run merch -- seed` against dev, then prod. It upserts the catalog and unpublishes the
      old demo items.
- [ ] Replace the Gemini placeholder photos with Printful mockups or real photos of the samples.
- [ ] Order one sample of each blank with `PRINTFUL_DRAFT=true`, check the drafts in Printful,
      then run one real paid order end to end.
- [ ] **Retire preview mode.** Delete `src/lib/merch-preview.ts`, its test, the `MERCH_PREVIEW`
      branches in `src/lib/server/merch.ts`, `StoreShell`, `MerchCartProvider` and
      `useStoreDestination`, `merchCatalogView` if nothing else uses it, and
      `VITE_MERCH_PREVIEW` in `src/env.d.ts` and `.env.example`. (It can never run in a
      production build, so this is cleanup, not a safety fix.)
- [ ] Follow-ups that need the database: an admin orders view with a retry button, an order
      confirmation email, and a Printful webhook (`package_shipped`) that stores and emails the
      tracking link.
- [ ] Open the store: remove the `new-store` experiment gate in `StoreShell`, `useStoreDestination`
      and `requireMerchOperator`, decide whether guests can check out, and switch the store
      routes from `privatePageSeo` to public SEO.
- [ ] Refresh the Logic Atlas (`logic-atlas` skill) with the store rules.

## Working on the store before launch

`VITE_MERCH_PREVIEW=1 npm run dev` serves the catalog from `src/lib/merch-seed-data.ts` with no
database or sign-in, shows a preview banner, and turns checkout off. Production builds compile it
out; `src/lib/merch-preview.test.ts` fails if the dev-only check is removed.

Local dev note: POST server functions can fail with "HTTPError" in `vite dev` because the
`srvx` 0.8 adapter bundled with Nitro aborts each request when its body has been read. It does not
affect Vercel. Upgrading Nitro (or overriding `srvx` to 0.11) fixes it locally.
