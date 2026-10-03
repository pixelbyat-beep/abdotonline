-- Weight-based courier charges. Each product gets a weight (kg, per unit). The zone rate
-- configured in Admin -> Settings -> Shipping now covers the first slab (base weight,
-- default 0.5 kg); every further slab (default 0.5 kg) adds the per-zone surcharge below.

alter table public.products
  add column if not exists weight_kg numeric(8,3) not null default 0.5 check (weight_kg >= 0);

insert into public.settings (key, value) values
  ('shipping_base_weight_kg', '0.5'),
  ('shipping_weight_step_kg', '0.5'),
  ('shipping_addl_local', '20'),
  ('shipping_addl_regional', '30'),
  ('shipping_addl_metro', '35'),
  ('shipping_addl_national', '50'),
  ('shipping_addl_special', '90')
on conflict (key) do nothing;
