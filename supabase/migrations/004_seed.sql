-- Seed data: settings defaults, categories, demo products/images/license keys,
-- one demo coupon. Safe to re-run (all inserts are idempotent via ON CONFLICT).
-- Replace demo products/images with real catalog data from the admin panel.

-- Settings — see documentation.md "Settings keys" table for what each one controls
insert into public.settings (key, value) values
  ('delivery_charge_courier', '99'),
  ('delivery_charge_free_above', '999'),
  ('delivery_email_charge', '0'),
  ('cod_extra_charge', '30'),
  ('cod_enabled', '1'),
  ('low_stock_threshold', '10'),
  ('store_name', 'AbDotStore'),
  ('store_phone', '+91 90000 00000'),
  ('store_email', 'support@abdotstore.com'),
  ('razorpay_key_id', 'PASTE_YOUR_RAZORPAY_KEY_ID_HERE')
on conflict (key) do nothing;

-- Categories (PRD §5.5)
insert into public.categories (name, slug, description, icon, sort_order) values
  ('Total Security', 'total-security', 'Complete protection for all your devices', 'shield-check', 1),
  ('Antivirus', 'antivirus', 'Protect your system from viruses and malware', 'shield', 2),
  ('Internet Security', 'internet-security', 'Stay safe while browsing online', 'globe-lock', 3),
  ('Windows', 'windows', 'Genuine Windows licenses for your PC', 'app-window', 4),
  ('Accounting Solutions', 'accounting-solutions', 'Software for billing and accounting needs', 'calculator', 5),
  ('Server Security', 'server-security', 'Enterprise-grade server protection', 'server', 6),
  ('Gaming', 'gaming', 'Gaming software and utilities', 'gamepad-2', 7)
on conflict (slug) do nothing;

-- Demo products (PRD §5.6 examples + a few more to populate every category)
insert into public.products
  (category_id, name, slug, brand, description, price, original_price, delivery_type, license_info, stock_qty, featured, status)
select c.id, v.name, v.slug, v.brand, v.description, v.price, v.original_price, v.delivery_type, v.license_info, v.stock_qty, v.featured, 'active'
from (values
  ('total-security', 'Kaspersky Total Security', 'kaspersky-total-security', 'Kaspersky', 'Complete protection against viruses, ransomware, and online threats for your whole family.', 899.00, 1499.00, 'email', '1 Device | 1 Year', 500, true),
  ('total-security', 'Bitdefender Total Security', 'bitdefender-total-security', 'Bitdefender', 'Multi-layer ransomware protection with performance optimization for up to 5 devices.', 1199.00, 1999.00, 'email', '5 Devices | 1 Year', 500, true),
  ('antivirus', 'Norton 360 Deluxe', 'norton-360-deluxe', 'Norton', 'Real-time threat protection, secure VPN, and cloud backup for 3 devices.', 1099.00, 1799.00, 'both', '3 Devices | 1 Year', 300, true),
  ('internet-security', 'ESET Internet Security', 'eset-internet-security', 'ESET', 'Lightweight, fast protection for safe browsing, banking, and webcam privacy.', 799.00, 1299.00, 'email', '1 Device | 1 Year', 400, true),
  ('windows', 'Windows 11 Professional', 'windows-11-professional', 'Microsoft', 'Genuine retail license key for Windows 11 Professional, digital delivery.', 8999.00, 13999.00, 'email', '1 PC | Lifetime', 200, false),
  ('accounting-solutions', 'Tally Prime Gold', 'tally-prime-gold', 'Tally', 'Multi-user accounting, billing, and GST compliance software.', 48500.00, 54000.00, 'courier', 'Multi-User | 1 Year', 50, false),
  ('server-security', 'Kaspersky Endpoint Security for Business', 'kaspersky-endpoint-security-business', 'Kaspersky', 'Centralized protection for servers and endpoints across your business network.', 2999.00, 4499.00, 'email', '5 Servers | 1 Year', 100, false),
  ('gaming', 'MalwareFox Gaming Shield', 'malwarefox-gaming-shield', 'MalwareFox', 'Lightweight anti-cheat-safe protection that runs quietly during gaming sessions.', 599.00, 999.00, 'email', '1 Device | 1 Year', 250, false)
) as v(cat_slug, name, slug, brand, description, price, original_price, delivery_type, license_info, stock_qty, featured)
join public.categories c on c.slug = v.cat_slug
on conflict (slug) do nothing;

-- Placeholder product images (swap for real uploads via the admin panel)
insert into public.product_images (product_id, storage_path, is_primary, sort_order)
select p.id, 'https://placehold.co/600x600/141414/19d9f2?text=' || replace(p.brand, ' ', '+'), true, 0
from public.products p
where not exists (select 1 from public.product_images pi where pi.product_id = p.id);

-- A few unused license keys per email-delivery product so checkout can be tested end-to-end
insert into public.license_keys (product_id, key_value, status)
select p.id, upper(substr(md5(random()::text || p.id::text || gs::text), 1, 5)) || '-' ||
             upper(substr(md5(random()::text || p.id::text || gs::text || '2'), 1, 5)) || '-' ||
             upper(substr(md5(random()::text || p.id::text || gs::text || '3'), 1, 5)),
       'unused'
from public.products p, generate_series(1, 5) gs
where p.delivery_type in ('email', 'both')
  and not exists (select 1 from public.license_keys lk where lk.product_id = p.id);

-- Demo coupon
insert into public.coupons (code, type, value, min_order, max_uses, status) values
  ('WELCOME10', 'percent', 10, 500, 1000, 'active')
on conflict (code) do nothing;
