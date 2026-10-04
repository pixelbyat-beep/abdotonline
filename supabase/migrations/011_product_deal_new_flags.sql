-- Admin-controlled storefront flags. Ticked in Admin -> Products -> Add/Edit product and used by
-- the "Deals" and "New Arrivals" filters on the product listing page (/listing?filter=deals|new).

alter table public.products
  add column if not exists is_deal boolean not null default false,
  add column if not exists is_new_arrival boolean not null default false;

create index if not exists products_is_deal_idx on public.products(is_deal) where is_deal;
create index if not exists products_is_new_arrival_idx on public.products(is_new_arrival) where is_new_arrival;

-- Backfill so existing pages don't go empty: discounted products count as deals,
-- products added in the last 30 days count as new arrivals.
update public.products set is_deal = true where discount_pct > 0;
update public.products set is_new_arrival = true where created_at > now() - interval '30 days';
