-- License key emails are no longer sent automatically on payment. An admin
-- reviews the paid order, writes their own message, and clicks Send. This
-- column records when that actually happened so the customer-facing
-- track-order / order-success pages only reveal the key after it's been sent.

alter table public.orders add column if not exists license_key_sent_at timestamptz;
