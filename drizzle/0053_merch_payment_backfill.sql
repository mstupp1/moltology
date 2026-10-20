-- Existing fulfillment states were only reached after a verified paid Checkout event.
-- Keep refunds and failed/unpaid sessions independent from this historical backfill.
UPDATE "merch_orders"
SET "paymentStatus" = 'paid'
WHERE "paymentStatus" = 'unpaid'
  AND "fulfillmentStatus" IN ('paid', 'processing', 'printful_draft', 'submitted_to_printful', 'fulfillment_failed');
