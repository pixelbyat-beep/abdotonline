-- Replaces the single flat courier charge with zone-based rates (local / regional /
-- metro / national / special), modeled on Blue Dart-style tiered courier pricing, plus
-- the store's own origin pincode/state so the zone can be resolved against a customer's
-- shipping address. All still editable from Admin -> Settings -> Shipping.

insert into public.settings (key, value) values
  ('shipping_zone_local', '49'),
  ('shipping_zone_regional', '79'),
  ('shipping_zone_metro', '99'),
  ('shipping_zone_national', '129'),
  ('shipping_zone_special', '199'),
  ('store_pincode', '400001'),
  ('store_state', 'Maharashtra')
on conflict (key) do nothing;

delete from public.settings where key = 'delivery_charge_courier';
