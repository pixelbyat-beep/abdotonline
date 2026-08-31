-- Points existing seeded products at the self-hosted product-art SVGs (public/product-art/*.svg)
-- instead of the placehold.co text placeholders inserted by 004_seed.sql, so the storefront
-- doesn't look empty. Run this once in the Supabase SQL Editor (or `supabase db push`).
-- Safe to re-run: it only updates the primary image row for each product below.

update public.product_images pi
set storage_path = v.new_path
from (values
  ('bitdefender-total-security',            '/product-art/bitdefender-total-security.svg'),
  ('eset-internet-security',                '/product-art/eset-internet-security.svg'),
  ('kaspersky-endpoint-security-business',  '/product-art/kaspersky-endpoint-security-business.svg'),
  ('kaspersky-total-security',              '/product-art/kaspersky-total-security.svg'),
  ('malwarefox-gaming-shield',              '/product-art/malwarefox-gaming-shield.svg'),
  ('windows-11-professional',               '/product-art/windows-11-professional.svg'),
  ('norton-360-deluxe',                     '/product-art/norton-360-deluxe.svg'),
  ('tally-prime-gold',                      '/product-art/tally-prime-gold.svg')
) as v(slug, new_path)
join public.products p on p.slug = v.slug
where pi.product_id = p.id and pi.is_primary = true;
