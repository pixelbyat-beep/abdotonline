-- AbDotStore — initial schema
-- Additive migrations only from here on: 002_rls.sql, 003_storage.sql, 004_seed.sql, then 005_*, 006_*...
-- Never edit this file after it has been run against a real project.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles — one row per auth.users row. role drives admin-panel access.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin','staff')),
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);

-- auto-create a profile row whenever someone signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, phone)
  values (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'phone');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- is_admin() is used everywhere in RLS policies (002_rls.sql)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','staff')
  );
$$;

-- prevent a non-admin from promoting themselves via a normal profile update
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger profiles_role_guard
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  status text not null default 'active' check (status in ('active','inactive')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  brand text,
  description text,
  price numeric(10,2) not null check (price >= 0),
  original_price numeric(10,2) check (original_price >= 0),
  discount_pct int generated always as (
    case
      when original_price is not null and original_price > 0 and original_price > price
        then round(((original_price - price) / original_price) * 100)::int
      else 0
    end
  ) stored,
  delivery_type text not null default 'email' check (delivery_type in ('email','courier','both')),
  license_info text,
  stock_qty int not null default 0,
  status text not null default 'active' check (status in ('active','inactive')),
  featured boolean not null default false,
  meta_title text,
  meta_description text,
  rating_avg numeric(2,1) not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now()
);

create index products_category_id_idx on public.products(category_id);
create index products_status_idx on public.products(status);
create index products_featured_idx on public.products(featured);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  is_primary boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_id_idx on public.product_images(product_id);

-- ---------------------------------------------------------------------------
-- orders (created before license_keys because license_keys.order_id points here)
-- ---------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  guest_name text,
  guest_email text,
  guest_phone text,
  subtotal numeric(10,2) not null default 0,
  delivery_charge numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  coupon_code text,
  total numeric(10,2) not null default 0,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  payment_method text not null default 'online' check (payment_method in ('online','cod')),
  delivery_type text not null check (delivery_type in ('email','courier')),
  address_line text,
  city text,
  state text,
  pincode text,
  tracking_number text,
  courier text,
  order_status text not null default 'pending' check (order_status in ('pending','processing','shipped','delivered','cancelled')),
  created_at timestamptz not null default now()
);

create index orders_user_id_idx on public.orders(user_id);
create index orders_guest_email_idx on public.orders(guest_email);
create index orders_order_number_idx on public.orders(order_number);
create index orders_order_status_idx on public.orders(order_status);

-- ---------------------------------------------------------------------------
-- license_keys — pool of keys per product; auto-assigned oldest-unused-first
-- ---------------------------------------------------------------------------
create table public.license_keys (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  key_value text not null,
  status text not null default 'unused' check (status in ('unused','used','expired')),
  order_id uuid references public.orders(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index license_keys_product_status_idx on public.license_keys(product_id, status);

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  license_key_id uuid references public.license_keys(id) on delete set null,
  qty int not null default 1 check (qty > 0),
  price numeric(10,2) not null,
  product_name_snapshot text not null,
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items(order_id);

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  amount numeric(10,2) not null,
  method text,
  status text not null default 'created' check (status in ('created','paid','failed','refunded')),
  created_at timestamptz not null default now()
);

create index payments_order_id_idx on public.payments(order_id);

-- ---------------------------------------------------------------------------
-- cart_items — logged-in users only; guests use browser localStorage
-- ---------------------------------------------------------------------------
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  qty int not null default 1 check (qty > 0),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- ---------------------------------------------------------------------------
-- wishlist
-- ---------------------------------------------------------------------------
create table public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- ---------------------------------------------------------------------------
-- addresses — saved addresses for logged-in customers
-- ---------------------------------------------------------------------------
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text default 'Home',
  name text not null,
  phone text not null,
  address_line text not null,
  city text not null,
  state text not null,
  pincode text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- coupons
-- ---------------------------------------------------------------------------
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('percent','fixed')),
  value numeric(10,2) not null,
  min_order numeric(10,2) not null default 0,
  max_uses int,
  used_count int not null default 0,
  expires_at timestamptz,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  guest_name text,
  rating int not null check (rating between 1 and 5),
  comment text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create index reviews_product_status_idx on public.reviews(product_id, status);

-- keep products.rating_avg / rating_count in sync with approved reviews
create or replace function public.refresh_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_product_id uuid;
begin
  target_product_id := coalesce(new.product_id, old.product_id);

  update public.products p
  set rating_avg = coalesce((
        select round(avg(r.rating)::numeric, 1)
        from public.reviews r
        where r.product_id = target_product_id and r.status = 'approved'
      ), 0),
      rating_count = (
        select count(*) from public.reviews r
        where r.product_id = target_product_id and r.status = 'approved'
      )
  where p.id = target_product_id;

  return null;
end;
$$;

create trigger reviews_rating_sync
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_product_rating();

-- ---------------------------------------------------------------------------
-- enquiries — contact form submissions
-- ---------------------------------------------------------------------------
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  status text not null default 'new' check (status in ('new','read','replied')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- shipments — history/notes per courier order (orders holds the current tracking_number)
-- ---------------------------------------------------------------------------
create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  tracking_number text,
  courier_name text,
  status text,
  notes text,
  updated_at timestamptz not null default now()
);

create index shipments_order_id_idx on public.shipments(order_id);

-- ---------------------------------------------------------------------------
-- blogs
-- ---------------------------------------------------------------------------
create table public.blogs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text,
  cover_image text,
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- settings — key/value store, seeded in 004_seed.sql
-- ---------------------------------------------------------------------------
create table public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text,
  created_at timestamptz not null default now()
);
