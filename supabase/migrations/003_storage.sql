-- Storage bucket for all uploaded images (products, blogs, avatars — kept in one
-- bucket under different path prefixes to keep the client transfer simple).

insert into storage.buckets (id, name, public)
values ('store-assets', 'store-assets', true)
on conflict (id) do nothing;

-- anyone can view images (bucket is public + read policy)
create policy "store_assets_public_read" on storage.objects
  for select using (bucket_id = 'store-assets');

-- only admins/staff can upload, replace, or delete
create policy "store_assets_admin_insert" on storage.objects
  for insert with check (bucket_id = 'store-assets' and public.is_admin());
create policy "store_assets_admin_update" on storage.objects
  for update using (bucket_id = 'store-assets' and public.is_admin());
create policy "store_assets_admin_delete" on storage.objects
  for delete using (bucket_id = 'store-assets' and public.is_admin());
