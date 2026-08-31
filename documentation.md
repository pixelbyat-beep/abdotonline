# AbDotStore — Documentation

Premium Indian software e-commerce store. React (Vite) frontend + Supabase backend
(Postgres, Auth, Storage, Edge Functions). This document explains everything: every
folder, every database table, every environment variable, how the business flows
work, and — most importantly — **how to hand this project over to the client's own
Supabase account**.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS v4 + React Router v6 |
| Server state | @tanstack/react-query |
| Client state | Zustand (cart, toasts) |
| Forms | react-hook-form + zod (where used) |
| Icons | lucide-react |
| Backend | Supabase: Postgres + Row Level Security, Supabase Auth, Supabase Storage, Edge Functions (Deno) |
| Payments | Razorpay Checkout.js + Edge Functions for order creation & signature verification |
| Email | Resend, called from Edge Functions |
| Hosting (recommended) | Vercel (static build) for the frontend; Supabase Cloud for everything else |

Nothing in this project needs Node.js in production — the built frontend is static
files, and all server-side logic (payments, email, admin user creation) runs as
Supabase Edge Functions.

---

## 2. Folder Structure

```
/
├── documentation.md          this file
├── .env.example               template for local environment variables
├── .env                        your local secrets (gitignored, never commit)
├── prd.md, webimage.jpeg       original client brief (kept for reference)
│
├── src/
│   ├── main.tsx                 app bootstrap: QueryClientProvider, BrowserRouter, AuthProvider
│   ├── App.tsx                  top-level route table (storefront + lazy-loaded /admin/*)
│   ├── index.css                Tailwind import + design tokens (@theme block) + CSS reset
│   │
│   ├── lib/                     framework-agnostic helpers, no React
│   │   ├── supabaseClient.ts      the one Supabase client instance + publicImageUrl() + edgeFunctionUrl()
│   │   ├── razorpay.ts            loads Razorpay Checkout.js and opens the payment modal
│   │   ├── whatsapp.ts            builds wa.me links from the 5 PRD message templates
│   │   ├── coupon.ts              calls the validate-coupon Edge Function
│   │   ├── csv.ts                 client-side CSV export (used by admin Reports)
│   │   ├── formatters.ts          formatINR, formatDate, maskLicenseKey, slugify
│   │   ├── categoryIcons.tsx      maps a category's `icon` string to a lucide icon
│   │   ├── constants.ts           store name, nav links, etc.
│   │   └── cn.ts                  clsx + tailwind-merge helper
│   │
│   ├── types/
│   │   ├── database.types.ts      hand-written Supabase schema types (see note below)
│   │   └── domain.ts              convenience aliases (Product, Order, CartLine, SettingsMap...)
│   │
│   ├── store/                   Zustand stores (client-only state)
│   │   ├── cartStore.ts           cart items + applied coupon, persisted to localStorage
│   │   └── toastStore.ts          global toast notifications
│   │
│   ├── context/
│   │   └── AuthProvider.tsx      wraps Supabase Auth session + profile (role) + isAdmin flag
│   │
│   ├── hooks/                   one file per data concern, all built on react-query
│   │   (useProducts, useCategories, useSettings, useWishlist, useReviews, useMyOrders,
│   │    useAddresses, useOrderLookup, useAdminOrders, useAdminProducts, useAdminCategories,
│   │    useAdminCustomers, useAdminPayments, useAdminCoupons, useAdminReviews,
│   │    useAdminBlogs, useAdminSettings, useLicenseKeys, useDashboardStats)
│   │
│   ├── components/
│   │   ├── ui/                   generic building blocks: Button, Input, Select, Card, Badge,
│   │   │                         StarRating, PriceTag, DiscountBadge, Skeleton, Pagination,
│   │   │                         Modal, Toaster
│   │   ├── storefront/           Header, MobileHeader (built into Header), BottomNav, Footer,
│   │   │                         Hero, DeliveryHighlights, CategoryGrid, ProductCard,
│   │   │                         BestSellers, TrustBadges, DealsSection, StorefrontLayout,
│   │   │                         StaticPage (shared wrapper for policy pages)
│   │   └── admin/                AdminSidebar, AdminLayout (mobile drawer + desktop sidebar),
│   │                             DataTable, StatCard, OrderStatusBadge/PaymentStatusBadge,
│   │                             WhatsAppNotifyButton, ImageUploader
│   │
│   └── pages/
│       ├── Home, Listing, ProductDetail, Cart, Checkout, OrderSuccess, TrackOrder,
│       │   Auth, Account, Wishlist, Search, Contact, NotFound
│       ├── static/                About, PrivacyPolicy, Terms, ShippingPolicy, RefundPolicy
│       └── admin/                 AdminRoutes.tsx (route table + AdminGuard), Login, Dashboard,
│           orders/, license-keys/, products/, customers/, payments/, shipping/,
│           coupons/, reviews/, enquiries/, reports/, blogs/, settings/
│
└── supabase/
    ├── migrations/               numbered, additive-only SQL — see §4
    │   001_init.sql                all tables, triggers, helper functions
    │   002_rls.sql                 Row Level Security policies
    │   003_storage.sql             storage bucket + storage policies
    │   004_seed.sql                default settings, categories, demo products/keys/coupon
    │   005_fix_role_guard.sql      bugfix migration (see inline comment)
    │   006_email_setting.sql       adds the resend_from_email setting
    └── functions/                 Edge Functions (Deno) — see §6
        _shared/                    cors.ts, supabaseAdmin.ts, email.ts (shared by several functions)
        create-order/
        razorpay-webhook/
        send-license-email/
        send-order-confirmation/
        track-order/
        validate-coupon/
        admin-create-staff/
```

**Note on `database.types.ts`:** normally you'd run
`supabase gen types typescript` to auto-generate this file. Docker wasn't available
in the build environment (that command needs it), so it was hand-written to exactly
match the migrations. If you add a new table or column, update `001_init.sql` (or a
new migration) **and** this file together, or install Docker and run:
```
npx supabase gen types typescript --db-url "<connection-string>" > src/types/database.types.ts
```

---

## 3. Design Tokens

All colors/radii live as CSS variables in `src/index.css` under `@theme`, which
Tailwind v4 turns directly into utility classes (e.g. `--color-accent` → `bg-accent`,
`text-accent`, `border-accent`).

| Token | Value | Usage |
|---|---|---|
| `--color-bg-main` | `#0a0a0a` | Page background |
| `--color-bg-card` | `#141414` | Cards, modals |
| `--color-bg-header` | `#111111` | Header, footer, admin sidebar |
| `--color-accent` | `#19D9F2` | All CTAs, active states, badges |
| `--color-border` | `#2a2a2a` | Card/input borders |
| `--radius-card` / `--radius-btn` | `8px` / `4px` | |

To change the brand color, edit these tokens in one place — no CSS is duplicated
across files (unlike the original PHP PRD's per-page `<style>` convention; React
components already provide file-level isolation, so a normal shared design-token
file is the more idiomatic equivalent here).

---

## 4. Database Schema

Every table, in creation order (see `supabase/migrations/001_init.sql` for exact
columns/constraints):

| Table | Purpose |
|---|---|
| `profiles` | One row per Supabase Auth user. `role` (`customer`/`admin`/`staff`) drives admin access. Auto-created by a trigger on signup. |
| `categories` | The 7 storefront categories (Total Security, Antivirus, ...). |
| `products` | Full catalog. `discount_pct` is a generated column (computed from price/original_price). |
| `product_images` | Multiple images per product; one marked `is_primary`. |
| `orders` | One row per order. Always has `guest_name/email/phone` populated (even for logged-in users) so **every** order can be tracked by order number + email. `user_id` is set only if the customer was logged in at checkout. |
| `license_keys` | Pool of keys per product. Oldest `unused` key is auto-assigned on payment confirmation. |
| `order_items` | Line items; snapshots product name/price at time of purchase. |
| `payments` | Razorpay order/payment/signature records. |
| `cart_items` | Logged-in users' cart, for cross-device persistence (guests use `localStorage` only — see §7). |
| `wishlist` | Logged-in users' saved products. |
| `addresses` | Logged-in users' saved shipping addresses (Account page). |
| `coupons` | Discount codes. No public SELECT policy — see §5. |
| `reviews` | Product reviews; `pending` until an admin approves. A trigger recomputes `products.rating_avg/rating_count` on every insert/update/delete. |
| `enquiries` | Contact form submissions. |
| `shipments` | History/notes per courier order (current tracking number also lives directly on `orders`). |
| `blogs` | Blogs & Articles admin section. |
| `settings` | Key/value store — **all delivery charges, COD settings, store contact info, and the Razorpay public key ID live here**, never hardcoded. |

### Settings keys

| Key | Default | Meaning |
|---|---|---|
| `shipping_zone_local` | `49` | Courier charge — same city as `store_pincode` |
| `shipping_zone_regional` | `79` | Courier charge — same state, different city |
| `shipping_zone_metro` | `99` | Courier charge — metro-to-metro (see `resolveShippingZone`) |
| `shipping_zone_national` | `129` | Courier charge — rest of India |
| `shipping_zone_special` | `199` | Courier charge — J&K / North-East / islands |
| `store_pincode`, `store_state` | `400001`, `Maharashtra` | Dispatch origin used to resolve the shipping zone |
| `delivery_charge_free_above` | `999` | Courier becomes free above this subtotal |
| `delivery_email_charge` | `0` | Email delivery charge |
| `cod_extra_charge` | `30` | Extra charge if Cash on Delivery selected |
| `cod_enabled` | `1` | `1`/`0` — whether COD shows at checkout |
| `low_stock_threshold` | `10` | Admin dashboard low-stock alert trigger |
| `store_name`, `store_phone`, `store_email` | — | Shown in footer/contact page |
| `razorpay_key_id` | placeholder | The **public** Razorpay key (safe to expose) |
| `resend_from_email` | `orders@abdotstore.com` | "From" address for transactional emails |

All of these are editable from **Admin → Settings**.

---

## 5. Security Model (Row Level Security)

Every table has RLS enabled (`supabase/migrations/002_rls.sql`). The rules of thumb:

- **Products, categories, approved reviews, published blogs, settings**: public read,
  admin-only write.
- **`license_keys`, `coupons`**: **no public read policy at all.** License keys are
  only ever touched by Edge Functions (service role bypasses RLS). Coupons are
  validated through the `validate-coupon` function so the full coupon list can never
  be scraped by calling the REST API directly.
- **`orders`/`order_items`/`payments`**: writable only by admins or by Edge Functions
  (service role). A logged-in customer can only SELECT their own orders
  (`user_id = auth.uid()`); **guest order lookups never go through RLS at all** —
  they call the `track-order` Edge Function, which uses the service role and matches
  on `order_number + email`.
- **`cart_items`, `wishlist`, `addresses`**: a user can only read/write their own
  rows (`user_id = auth.uid()`).
- **`is_admin()`**: a SQL helper function (SECURITY DEFINER) used throughout the
  policies — checks `profiles.role in ('admin','staff')` for the current
  `auth.uid()`.
- A trigger (`profiles_role_guard`) prevents a logged-in user from promoting
  themselves to admin via a normal profile update; only an actual admin (or the
  service role, used internally) can change `role`.

---

## 6. Edge Functions

All deployed under `supabase/functions/`. Each is a small Deno script; shared code
lives in `_shared/`.

| Function | Called by | What it does |
|---|---|---|
| `create-order` | Checkout page | Re-prices the cart server-side (never trusts client prices), re-validates any coupon, computes delivery charge from `settings`, creates the `orders`/`order_items` rows, and — for online payment — creates a Razorpay order and returns its ID + the public key. |
| `razorpay-webhook` | (a) Checkout's own success handler, immediately after Razorpay reports success, and (b) optionally a real Razorpay webhook | Verifies the payment signature (HMAC-SHA256 — this is Razorpay's documented secure verification method, so it's just as trustworthy from the client callback as from a server webhook), marks the order paid, auto-assigns the oldest unused license key for email-delivery orders, and sends the confirmation/license-key email. |
| `send-license-email` | Admin order detail page ("Resend License Key Email") | Re-sends the license key email for an already-paid order. |
| `send-order-confirmation` | Internal (courier orders) / admin manual trigger | Sends the order-confirmation email. |
| `track-order` | Track Order page, Order Success page (polling) | Public lookup by `order_number` + `email`. Only includes the license key value in the response if the order is paid and email-delivery. |
| `validate-coupon` | Cart & Checkout | Validates a coupon code server-side (expiry, usage limit, minimum order) without ever exposing the coupon table to the client. |
| `admin-create-staff` | Admin → Settings → Admin Users | Creates a new admin/staff login via the Supabase Auth Admin API. Only callable by an existing `admin` (not `staff`). |

### Required secrets (set once per Supabase project)

```bash
supabase secrets set \
  RAZORPAY_KEY_ID=rzp_live_xxxxx \
  RAZORPAY_KEY_SECRET=xxxxx \
  RESEND_API_KEY=re_xxxxx
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by the
Supabase Edge Runtime — you never set those yourself.

An optional `RAZORPAY_WEBHOOK_SECRET` secret enables the real-webhook code path in
`razorpay-webhook` as a reliability fallback (Razorpay dashboard → Settings →
Webhooks → point at `<project-url>/functions/v1/razorpay-webhook`). This is **not**
required for the site to work — the client-triggered verification path is already
cryptographically secure on its own.

---

## 7. Key Business Flows

### Guest checkout (no forced login) — the flow the client asked for specifically

1. Customer adds items to cart (stored in `localStorage` via Zustand — works with
   zero login).
2. Checkout is a 3-step wizard: **(1) email**, **(2) name/phone + address** (address
   fields only appear if Courier is selected — the shipping charge is calculated live
   from the pincode/state via `resolveShippingZone` in `src/lib/shipping.ts`, mirrored
   server-side in `supabase/functions/_shared/shipping.ts`), **(3) payment method**.
   Never asked to create an account.
3. `create-order` Edge Function re-prices everything server-side — including
   re-resolving the shipping zone from the submitted address — and builds the order,
   plus a Razorpay order for online payment.
4. Razorpay Checkout.js opens. On success, the browser immediately calls
   `razorpay-webhook` with the payment signature to confirm it server-side.
5. Customer lands on Order Success, which polls `track-order` every 3s (up to ~45s)
   until the payment shows as confirmed, then shows the license key (email orders)
   or shipping status (courier orders).
6. **Anytime after that**, the same order can be found again at `/track-order` using
   just the order number + email — no account required, ever.

An account (Login/Register) is entirely optional and only adds convenience: saved
addresses, order history in one place, and a wishlist that follows you across
devices. Checkout logic never requires or checks for one.

### Email delivery (automatic)

Payment confirmed → oldest `unused` license key for that product is assigned
(`status='used'`, `order_id` set, `used_at` stamped) → Resend sends the key by email
→ order marked `delivered` (since there's nothing left to ship).

### Courier delivery (manual packing/shipping by admin)

Payment confirmed → order marked `processing` → admin sees it under
**Admin → Shipping → Courier Orders** → admin packs the box, visits India Post/DTDC,
gets a tracking number → enters it in **Add Tracking** → order marked `shipped` →
admin clicks **Send WhatsApp** → pre-filled tracking message opens in WhatsApp Web →
admin clicks Send → customer can also see the tracking number on `/track-order`.

### WhatsApp notify (zero API, zero cost)

`src/lib/whatsapp.ts` builds a `https://wa.me/91<phone>?text=<message>` link from one
of 5 templates (Order Confirmed, License Key Sent, Tracking Update, Out for
Delivery, Delivered) and opens it in a new tab. No WhatsApp Business API, no
recurring cost — the admin just clicks "Send" once WhatsApp Web opens.

---

## 8. Environment Variables

Copy `.env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=              # Project Settings → API in the Supabase dashboard
VITE_SUPABASE_ANON_KEY=         # the "publishable" key (safe for the browser)
VITE_RAZORPAY_KEY_ID=           # Razorpay's PUBLIC key id (not the secret)
VITE_STORE_WHATSAPP_NUMBER=     # e.g. 919876543210 (used as a fallback constant; the
                                 # actual number used per-order is the customer's own
                                 # phone, not this one — this is only for any store-wide
                                 # WhatsApp links you might add later)
```

The Razorpay **secret key** and the **Resend API key** are never in `.env` or in the
frontend at all — they only exist as Supabase Edge Function secrets (§6).

---

## 9. Running Locally

```bash
npm install
cp .env.example .env      # then fill in the values from your Supabase project
npm run dev                # http://localhost:5173 (or next free port)
npm run build               # type-checks with tsc, then builds to dist/
```

## 10. Deploying

- **Frontend**: push to GitHub, import into Vercel, set the same `VITE_*` env vars
  in Vercel's project settings, deploy. It's a static Vite build — no special
  server configuration needed beyond a SPA rewrite rule (Vercel does this
  automatically for Vite projects).
- **Backend**: already live on Supabase Cloud. Migrations and Edge Functions are
  deployed via the Supabase CLI (see below) — there's no separate "deploy" step for
  the database once migrations have been applied.

---

## 11. Transferring to the Client's Own Supabase Project

Everything was built so this is a mechanical, low-risk process — no code changes
needed, only configuration.

1. **Create the new Supabase project** in the client's account (supabase.com →
   New Project). Note its Project URL, and its Postgres connection string
   (Project → Connect → Session pooler, if connecting from a normal IPv4 network).

2. **Run the migrations, in order**, against the new project's database. The
   easiest way if you don't have the Supabase CLI linked:
   ```bash
   npm install --no-save pg
   node -e "
     const { readFileSync } = require('fs');
     const { Client } = require('pg');
     (async () => {
       const client = new Client({ connectionString: '<NEW_PROJECT_CONNECTION_STRING>', ssl: { rejectUnauthorized: false } });
       await client.connect();
       for (const f of ['001_init.sql','002_rls.sql','003_storage.sql','004_seed.sql','005_fix_role_guard.sql','006_email_setting.sql']) {
         await client.query(readFileSync('supabase/migrations/'+f, 'utf8'));
         console.log('applied', f);
       }
       await client.end();
     })();
   "
   ```
   Or paste each file's contents into the new project's SQL Editor, in the same
   numbered order. **Never skip 004_seed.sql if you want the 7 categories and
   default settings pre-populated** — you can delete the demo products afterward
   from the admin panel.

3. **Deploy the Edge Functions** to the new project:
   ```bash
   npx supabase login                 # or use SUPABASE_ACCESS_TOKEN
   npx supabase functions deploy --project-ref <NEW_PROJECT_REF>
   ```

4. **Set the Edge Function secrets** on the new project:
   ```bash
   npx supabase secrets set --project-ref <NEW_PROJECT_REF> \
     RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=... RESEND_API_KEY=...
   ```

5. **Create the client's first admin login.** Easiest via the Supabase dashboard:
   Authentication → Users → Add User (set email + password, confirm email), then in
   the SQL Editor run:
   ```sql
   update public.profiles set role = 'admin' where id = '<the new user's UUID>';
   ```

6. **Update environment variables** wherever the frontend is hosted (Vercel project
   settings) to point at the new project's `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`, then redeploy.

7. **Create the `store-assets` storage bucket's real content**: it's created empty
   by `003_storage.sql`; the admin re-uploads real product photos from
   **Admin → Products** (the demo `placehold.co` images are just placeholders).

That's the entire handover — nothing else in the codebase references the old
project.

---

## 12. What Was Deliberately Kept Simple

Per explicit direction during planning, the admin panel favors one predictable flow
over granular configurability:

- **Roles**: `admin` and `staff` both get full admin panel access (no per-page
  permission matrix). `staff` exists in the schema for future use if finer control
  is ever needed.
- **Coupons/products/blogs**: each has one Add/Edit form, no multi-step wizards.
- **Refunds**: recorded as a status change in this app (the actual money movement
  still happens in the Razorpay dashboard, as it does everywhere — this app doesn't
  claim to move money it never verified charging on the way in either).
- **Reports**: computed on read from existing tables (no separate reporting
  warehouse/cron job) — perfectly fine at this store's scale, and one less moving
  part to maintain.

## 13. Known Limitations / Next Steps for the Client

- **Razorpay and Resend are not yet configured** with real keys (only placeholders)
  — checkout and email sending will show a friendly "not configured" message until
  real keys are added via `supabase secrets set` (§6) and the Razorpay Key ID is
  saved in **Admin → Settings → Payment**.
- **Product photos are placeholders** (`placehold.co`) — replace via
  **Admin → Products → (edit product) → Upload Images**.
- **Mobile-viewport testing** was implemented with standard, consistent Tailwind
  responsive classes throughout (`md:` breakpoints, a dedicated mobile bottom nav,
  a mobile drawer for both the storefront header and the admin sidebar) and
  spot-checked functionally, but the sandbox this was built in could not resize its
  browser viewport to verify pixel-perfect mobile screenshots — please do one
  visual pass on an actual phone or with Chrome DevTools' device toolbar before
  launch.
