-- Row Level Security. Order creation/mutation of sensitive tables (orders,
-- order_items, payments, license_keys) happens ONLY through Edge Functions using
-- the service_role key, which bypasses RLS entirely — so there are deliberately
-- few/no public INSERT policies on those tables.

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.license_keys enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlist enable row level security;
alter table public.addresses enable row level security;
alter table public.coupons enable row level security;
alter table public.reviews enable row level security;
alter table public.enquiries enable row level security;
alter table public.shipments enable row level security;
alter table public.blogs enable row level security;
alter table public.settings enable row level security;

-- profiles ------------------------------------------------------------------
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());
create policy "profiles_admin_insert" on public.profiles
  for insert with check (public.is_admin());
create policy "profiles_admin_delete" on public.profiles
  for delete using (public.is_admin());

-- categories ------------------------------------------------------------------
create policy "categories_public_read" on public.categories
  for select using (status = 'active' or public.is_admin());
create policy "categories_admin_write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- products ------------------------------------------------------------------
create policy "products_public_read" on public.products
  for select using (status = 'active' or public.is_admin());
create policy "products_admin_write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- product_images ------------------------------------------------------------------
create policy "product_images_public_read" on public.product_images
  for select using (true);
create policy "product_images_admin_write" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

-- orders ------------------------------------------------------------------
-- guest order lookup never uses these policies — it goes through the
-- track-order Edge Function (service role). These only serve logged-in customers
-- viewing their own order history, and the admin panel.
create policy "orders_select_own_or_admin" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());
create policy "orders_admin_insert" on public.orders
  for insert with check (public.is_admin());

-- license_keys ------------------------------------------------------------------
-- never selectable by customers under any circumstance
create policy "license_keys_admin_all" on public.license_keys
  for all using (public.is_admin()) with check (public.is_admin());

-- order_items ------------------------------------------------------------------
create policy "order_items_select_own_or_admin" on public.order_items
  for select using (
    public.is_admin()
    or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "order_items_admin_write" on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

-- payments ------------------------------------------------------------------
create policy "payments_admin_all" on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

-- cart_items ------------------------------------------------------------------
create policy "cart_items_owner_all" on public.cart_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- wishlist ------------------------------------------------------------------
create policy "wishlist_owner_all" on public.wishlist
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- addresses ------------------------------------------------------------------
create policy "addresses_owner_all" on public.addresses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- coupons ------------------------------------------------------------------
-- no public read policy at all — codes are validated via the validate-coupon
-- Edge Function so the full coupon list can never be scraped by anon/authenticated.
create policy "coupons_admin_all" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

-- reviews ------------------------------------------------------------------
create policy "reviews_public_read_approved" on public.reviews
  for select using (status = 'approved' or public.is_admin() or user_id = auth.uid());
create policy "reviews_insert_pending_only" on public.reviews
  for insert with check (status = 'pending');
create policy "reviews_admin_moderate" on public.reviews
  for update using (public.is_admin()) with check (public.is_admin());
create policy "reviews_admin_delete" on public.reviews
  for delete using (public.is_admin());

-- enquiries ------------------------------------------------------------------
create policy "enquiries_public_insert" on public.enquiries
  for insert with check (true);
create policy "enquiries_admin_read" on public.enquiries
  for select using (public.is_admin());
create policy "enquiries_admin_update" on public.enquiries
  for update using (public.is_admin()) with check (public.is_admin());

-- shipments ------------------------------------------------------------------
create policy "shipments_select_own_or_admin" on public.shipments
  for select using (
    public.is_admin()
    or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "shipments_admin_write" on public.shipments
  for all using (public.is_admin()) with check (public.is_admin());

-- blogs ------------------------------------------------------------------
create policy "blogs_public_read_published" on public.blogs
  for select using (status = 'published' or public.is_admin());
create policy "blogs_admin_write" on public.blogs
  for all using (public.is_admin()) with check (public.is_admin());

-- settings ------------------------------------------------------------------
-- values here are non-secret (delivery charges, store contact info, razorpay
-- PUBLIC key id) so a public read is safe; only admins can change them.
create policy "settings_public_read" on public.settings
  for select using (true);
create policy "settings_admin_write" on public.settings
  for all using (public.is_admin()) with check (public.is_admin());
