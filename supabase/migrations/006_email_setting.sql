-- Adds the "from" address used by the send-license-email / send-order-confirmation
-- Edge Functions. The actual Resend API key is NEVER stored here — it's set only as
-- an Edge Function secret via `supabase secrets set RESEND_API_KEY=...`.
insert into public.settings (key, value) values
  ('resend_from_email', 'orders@abdotstore.com')
on conflict (key) do nothing;
