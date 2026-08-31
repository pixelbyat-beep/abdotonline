read the prd # AbDotStore — Product Requirements Document (PRD)
**Premium Indian Software E-Commerce Store**
> Smart. Secure. Genuine.

**Version:** 1.1 | **Date:** August 2026 | **Prepare
.gitignore                 uploads/, logs/, *-config.php, *.log
```

### 3.2 Database Access Pattern (includes/db.php)

- Single lazily-created mysqli connection via `db(): mysqli` using static local variable
- `dbStmt()` — prepared statement + auto type-detection for bind_param
- `dbAll()` — returns all rows as array
- `dbOne()` — returns first row or null
- `dbValue()` — returns single scalar or null
- `dbExec()` — INSERT/UPDATE/DELETE, returns insert_id
- `db.php` ends with `require_once` for every model file — no per-page require juggling
- Every model file does `require_once __DIR__ . '/../includes/db.php'` at the top

### 3.3 Session/Auth Pattern (includes/session.php)

- Plain `$_SESSION`, started once with `session_status()` guard
- `currentUser()`, `startUserSession()` (calls `session_regenerate_id(true)` on login), `endUserSession()`
- `requireLogin()` → `requireRole($role)` → feature gates — dies with `http_response_code(403)` on failure
- One CSRF token per session via `csrfToken()` / `checkCsrf()` — reused across all state-changing forms

### 3.4 CSS Rule (Strict)

- `assets/css/style.css` contains ONLY `:root` theme tokens (colors, fonts, radius, shadow) + bare CSS reset (box-sizing, margin reset, base font)
- Every component's CSS lives in an inline `<style>` block inside the specific `.php` file that uses it
- If a component appears on multiple pages — **duplicate the CSS in each file** — do NOT centralize
- Page-unique JavaScript goes in inline `<script>` in that page only
- `assets/js/main.js` — ONLY nav toggle, toast notifications, modal open/close, lightbox

### 3.5 Code Style

- Functions and variables in camelCase
- Plain procedural functions only — no classes anywhere in models/ or includes/
- Doc comments only where they explain WHY — no boilerplate docblocks
- SQL migrations numbered and additive (`migration_02.sql`, `migration_03.sql`) — never edit past migrations

---

## 4. DATABASE SCHEMA

### 4.1 Tables Overview

| Table | Purpose + Key Columns |
|---|---|
| users | id, name, email, phone, password_hash, role (customer/admin/staff), created_at |
| categories | id, name, slug, description, icon, status (active/inactive) |
| products | id, category_id, name, slug, brand, description, price, original_price, discount_pct, delivery_type (email/courier/both), license_info, stock_qty, status, featured |
| product_images | id, product_id, image_path, is_primary |
| license_keys | id, product_id, key_value, status (unused/used/expired), order_id, used_at |
| orders | id, user_id, subtotal, delivery_charge, total, payment_status, delivery_type (email/courier), address, tracking_number, courier, order_status, created_at |
| order_items | id, order_id, product_id, license_key_id, qty, price |
| payments | id, order_id, razorpay_payment_id, amount, method, status, created_at |
| cart | id, user_id, session_id, product_id, qty |
| wishlist | id, user_id, product_id |
| coupons | id, code, type (percent/fixed), value, min_order, max_uses, used_count, expires_at, status |
| reviews | id, product_id, user_id, rating, comment, status (pending/approved/rejected), created_at |
| enquiries | id, name, email, phone, message, status (new/read/replied), created_at |
| shipments | id, order_id, tracking_number, courier_name, status, notes, updated_at |
| settings | id, key, value — stores all admin-configurable settings including delivery charges |
| admin_users | id, name, email, password_hash, role (admin/staff/support), created_at |

### 4.2 Settings Table — Key-Value Pairs

| Setting Key | Description + Default Value |
|---|---|
| delivery_charge_courier | Flat courier delivery charge applied at checkout — default ₹99 |
| delivery_charge_free_above | Order subtotal above which courier delivery is free — default ₹999 |
| delivery_email_charge | Email delivery charge — default ₹0 (free) |
| cod_extra_charge | Extra charge if COD selected — default ₹30 |
| store_name | AbDotStore |
| store_phone | Store contact phone number |
| store_email | Store contact email |
| razorpay_key_id | Razorpay Key ID (public key only) |
| cod_enabled | Whether COD is enabled — 0 or 1 |
| low_stock_threshold | Alert when license keys below this count — default 10 |

---

## 5. FRONTEND — CUSTOMER WEBSITE

### 5.1 Design System (Theme Tokens in style.css)

```css
:root {
  --bg-main:       #0a0a0a;   /* Deep Black — main page background */
  --bg-card:       #141414;   /* Dark Charcoal — cards, modals */
  --bg-header:     #111111;   /* Header background */
  --accent:        #19D9F2;   /* Cyan/Turquoise — all CTAs, active states, icons, borders */
  --text-primary:  #FFFFFF;   /* Main text */
  --text-secondary:#A0A0A0;   /* Subtitles, labels, secondary text */
  --border:        #2a2a2a;   /* Subtle card and input borders */
  --radius-card:   8px;
  --radius-btn:    4px;
}
```

> **DO NOT USE:** Purple, Bright Blue, Excessive Gradients, Gaming aesthetics
> **Overall Feel:** Premium + Minimal + Trustworthy + Modern + Software-focused

### 5.2 Header (Sticky Desktop)

**Left side:**
- AbDotStore logo
- Small tagline below logo: *Smart. Secure. Genuine.*

**Center:**
- Large search bar — placeholder: `Search software, antivirus, Windows...`
- Submits to `search.php?q=`

**Right side:**
- Wishlist icon (heart) → `wishlist.php`
- Cart icon with item count badge → `cart.php`
- Account icon → `account.php` or `auth.php`

**Navigation bar below header:**
- Home | Categories | Deals | New Arrivals | All Products | Support
- Active nav item in `#19D9F2` cyan

**Mobile header:**
- Hamburger menu | AbDotStore logo | Search icon | Cart icon

### 5.3 Hero Section

- Full-width dark cinematic hero
- Subtle tech/software background visuals: laptop, software interface, security shield, Windows logo, antivirus shield
- Small cyan label badge: `GENUINE SOFTWARE`
- Main heading (large bold): **Trusted Software. Delivered Your Way.**
- Subtext: *Genuine software, secure payments and fast delivery for your digital needs.*
- Button 1 (solid cyan): **Shop Software** → `listing.php`
- Button 2 (outline): **Explore Deals** → `listing.php?filter=deals`
- Clean, spacious, premium — no clutter

### 5.4 Delivery Highlights (Below Hero)

Two dark premium cards side by side:

- **Card 1:** Envelope icon | **Instant Email Delivery** | *License details delivered directly to your email.*
- **Card 2:** Package/truck icon | **Courier Shipping** | *Physical software products delivered safely to your address.*
- Subtle cyan left border highlight on each card

### 5.5 Software Categories Section

- Section title: **Explore Software Categories**
- 7 category cards in a responsive grid
- Each card: Icon + Category Name + Short Description + Arrow icon →
- Hover: subtle cyan glow/border
- Clicks to `listing.php?category={slug}`

| # | Category | Short Description |
|---|---|---|
| 1 | Total Security | Complete protection for all your devices |
| 2 | Antivirus | Protect your system from viruses and malware |
| 3 | Internet Security | Stay safe while browsing online |
| 4 | Windows | Genuine Windows licenses for your PC |
| 5 | Accounting Solutions | Software for billing and accounting needs |
| 6 | Server Security | Enterprise-grade server protection |
| 7 | Gaming | Gaming software and utilities |

### 5.6 Best Sellers Section

- Title: **Best Selling Software** | View All → link on right
- 4 product cards in a horizontal row

**Each product card must show:**
- Product image (top)
- Brand name (Kaspersky / Norton / ESET / Bitdefender)
- Product name
- License / device info (e.g. 1 Device | 1 Year)
- Star rating + review count
- Current price in ₹ (large, white)
- Original/MRP price (gray, strikethrough)
- Discount badge (e.g. 35% OFF) in cyan or green
- Delivery method tag: Email Delivery / Courier Available
- Wishlist heart icon (top-right corner of card, toggleable)
- Add to Cart button (solid cyan, full width at bottom of card)
- Cards are dark charcoal (#141414), clean, minimal

**Example products:**
- Kaspersky Total Security — 1 Device 1 Year — ₹899 (MRP ₹1,499) — 40% OFF
- Norton 360 Deluxe — 3 Devices 1 Year — ₹1,099 (MRP ₹1,799) — 39% OFF
- ESET Internet Security — 1 Device 1 Year — ₹799 (MRP ₹1,299) — 38% OFF
- Bitdefender Total Security — 5 Devices 1 Year — ₹1,199 (MRP ₹1,999) — 40% OFF

### 5.7 Why AbDotStore — Trust Section

Horizontal strip of 5 trust badges with minimal cyan icons:
- 100% Genuine Software
- Instant Email Delivery
- Secure Payment
- Fast Courier Shipping
- Customer Support

### 5.8 Special Deals Section

- Dark promotional section background
- Title: **Software Deals**
- Subtext: *Upgrade your digital experience without overspending.*
- 3-4 discounted product cards (same card design as Best Sellers)
- Main CTA button in cyan: **View All Deals** → `listing.php?filter=deals`

### 5.9 Footer

Dark footer with 5-column grid layout:

- **Column 1:** AbDotStore logo + *Smart. Secure. Genuine.* + brief store description
- **Column 2 Quick Links:** About Us, Contact, All Products, Deals, New Arrivals
- **Column 3 Customer Support:** Help Center, Track Order, Returns & Refunds, Contact Support
- **Column 4 Categories:** Total Security, Antivirus, Internet Security, Windows, Accounting Solutions, Server Security, Gaming
- **Column 5 Policies:** Privacy Policy, Terms & Conditions, Shipping Policy, Refund Policy
- **Bottom bar:** © AbDotStore. All Rights Reserved.

### 5.10 Checkout Page — Delivery Charge Logic

> This is critical. The checkout page must calculate and show delivery charge clearly.

**Step 1** — Customer fills delivery address form (name, phone, address, city, state, pincode)

**Step 2** — Customer selects delivery type:

| Delivery Type | Charge |
|---|---|
| Email Delivery | ₹0 (Free) — always |
| Courier Shipping | Value from `settings` table (key: `delivery_charge_courier`) — default ₹99 |
| Courier Shipping (if subtotal > free threshold) | ₹0 Free — threshold from `settings` key: `delivery_charge_free_above` — default ₹999 |

**Order summary must show:**
- Subtotal
- Delivery Charge (updates live when switching delivery type using plain JS — no page reload)
- Coupon Discount (if applied)
- **Total**

**On payment:**
- Razorpay receives final total including delivery charge
- Order saved with `delivery_charge` column populated in orders table

### 5.11 Mobile Responsive Design

- Mobile header: Hamburger menu + AbDotStore logo + Search icon + Cart icon
- Bottom navigation bar: Home | Search | Categories | Orders | Profile
- All product card grids: 1 column on mobile, 2 columns d By:** Ignixup Automations — Adarsh Tiwari

---

## Quick Reference

| Field | Value |
|---|---|
| Project Name | AbDotStore — Software E-Commerce Platform |
| Project Type | Full-Stack Web Application |
| Stack | Core PHP (procedural) + MySQL + Plain HTML/CSS/JavaScript |
| Hosting | Shared Hosting (Hostinger-style) |
| Accent Color | #19D9F2 (Cyan/Turquoise) |
| Theme | Premium Dark Minimal Technology |
| Tagline | Smart. Secure. Genuine. |
| Prepared By | Ignixup Automations — Adarsh Tiwari |

---

## 1. PROJECT OVERVIEW

AbDotStore is a premium Indian software e-commerce marketplace that sells genuine software products such as antivirus suites, Windows licenses, accounting tools, and server security software. Customers can purchase products and receive them either via instant email delivery (license key) or physical courier shipping (box delivery). The platform includes a full customer-facing storefront and a secure backend admin panel for complete business management.

### 1.1 Business Goals

- Sell genuine software products online to Indian customers
- Deliver license keys instantly via email after payment confirmation
- Support physical box delivery via India Post / courier partners
- Manage inventory of license keys per product
- Provide a complete admin panel for order, product, and customer management
- Build trust through a premium, minimal, professional UI

### 1.2 Delivery Methods

| Method | Details |
|---|---|
| Email Delivery | License key sent instantly to customer email after payment verification |
| Courier Shipping | Physical software box shipped via India Post / DTDC to customer address. Delivery charge applied at checkout. |

---

## 2. TECH STACK & ARCHITECTURE

> **What is Plain/Vanilla JavaScript?**
> It means normal JavaScript written directly in `<script>` tags. No React, no Vue, no jQuery, no build tool. Just pure browser JavaScript that works without any installation or compilation.

| Layer | Technology | Notes |
|---|---|---|
| Backend | Core PHP (procedural) | No framework, no Composer, no ORM |
| Database | MySQL via mysqli | Plain mysqli only — no PDO, no query builder |
| Frontend | Plain HTML + CSS + JavaScript | No React, no Vue, no jQuery, no build step — just .php files with inline `<style>` and `<script>` |
| Hosting | Shared Hosting (Hostinger) | cPanel-style, PHP + MySQL support |
| Payments | Razorpay | UPI, Card, Net Banking — webhook verified server-side |
| Email | PHPMailer via SMTP | License key delivery + order confirmation emails |
| Customer Notify | Manual WhatsApp Button | No API — admin clicks a pre-filled WhatsApp link to notify customer manually |
| Order Tracking | Manual by Admin | Admin enters tracking number — no API — customer tracks on indiapost.gov.in |
| File Storage | Local uploads/ folder | Product images stored on server |

---

## 3. FOLDER STRUCTURE & CODING CONVENTIONS

> Follow the procedural PHP pattern strictly. No classes, no Composer, no framework, no build step.

### 3.1 Complete Folder Structure

```
/                          Top-level pages (one .php file per route)
  index.php                Homepage
  listing.php              Product listing / category page
  product.php              Single product detail page
  cart.php                 Cart page
  checkout.php             Checkout — address, delivery type, delivery charge, payment
  order-success.php        Order confirmation page
  track.php                Order tracking page (customer enters tracking number manually)
  auth.php                 Login / Register page
  account.php              Customer account & orders
  wishlist.php             Wishlist page
  search.php               Search results page
  contact.php              Contact page

assets/
  css/style.css            GLOBAL: :root theme tokens + CSS reset ONLY — nothing else
  js/main.js               GLOBAL: nav toggle, toast, modal, lightbox only
  images/                  Static site images / icons

includes/
  db.php                   mysqli connection + helpers + require_once all models
  session.php              Session, auth guards, CSRF
  header.php               Site header HTML
  footer.php               Site footer HTML
  razorpay.php             Razorpay wrapper functions
  razorpay-config.php      Real credentials (gitignored)
  razorpay-config.sample.php  Placeholder with PASTE_YOUR_X_HERE + setup instructions
  email.php                PHPMailer wrapper for sending emails
  email-config.php         SMTP credentials (gitignored)
  email-config.sample.php  Placeholder

models/
  user.php                 Users CRUD
  product.php              Products CRUD
  category.php             Categories CRUD
  order.php                Orders CRUD
  order_item.php           Order items CRUD
  license_key.php          License keys CRUD (pool management)
  cart.php                 Cart functions
  wishlist.php             Wishlist functions
  coupon.php               Coupons CRUD
  review.php               Reviews CRUD
  enquiry.php              Contact enquiries CRUD
  setting.php              Settings key-value CRUD (includes delivery charge)

data/
  categories.php           Static category data (before DB table exists)
  products.php             Static product data (before DB table exists)

uploads/
  products/                Product images
  avatars/                 Customer avatars

logs/                      Error / activity logs (gitignored)

admin/
  index.php                Admin dashboard
  orders.php               All orders
  orders-email.php         Email delivery orders
  orders-courier.php       Courier orders
  orders-pending.php       Pending orders
  orders-cancelled.php     Cancelled orders
  order-detail.php         Single order detail + manual WhatsApp notify button
  license-keys.php         All license keys
  license-keys-add.php     Add keys in bulk
  license-keys-lowstock.php  Low stock alerts
  products.php             All products
  products-add.php         Add new product
  products-edit.php        Edit product
  categories.php           Manage categories
  customers.php            All customers
  payments.php             All payments
  refunds.php              Refunds
  cod.php                  COD orders
  shipping.php             Courier orders list
  tracking-add.php         Admin enters tracking number manually after post office visit
  coupons.php              Manage coupons
  reviews.php              Manage reviews (approve / reject)
  enquiries.php            Contact enquiries
  reports-sales.php        Sales report
  reports-revenue.php      Revenue report
  reports-products.php     Product report
  settings.php             Store settings
  settings-payment.php     Razorpay keys
  settings-email.php       SMTP settings
  settings-shipping.php    Delivery charge settings (set courier charge from admin panel)
  settings-users.php       Admin user management
  includes/
    admin-header.php       Admin sidebar + header
    admin-footer.php       Admin footer
    admin-session.php      Admin auth guard (requireRole)

schema.sql                 Base schema
migration_02.sql           Future additive migrations only — never edit old oneson small tablet
- Category grid: 2 columns on mobile
- All buttons full-width on mobile
- Hero text scales down, buttons stack vertically
- Checkout form: full-width single column on mobile

### 5.12 All Customer-Facing Pages

| File | Purpose |
|---|---|
| index.php | Homepage — hero, categories, best sellers, deals, trust badges, footer |
| listing.php | Product listing — filter by category, sort by price/rating, pagination |
| product.php | Single product — images gallery, description, price, add to cart, reviews, related products |
| cart.php | Cart — items list, qty update, remove item, coupon code, order summary, checkout button |
| checkout.php | Checkout — address form, delivery type selector, delivery charge display, Razorpay payment |
| order-success.php | Order confirmed — order ID, license key shown (email delivery), tracking info (courier) |
| track.php | Order tracking — customer enters order ID, sees tracking number + status + courier link |
| auth.php | Login + Register — tabbed UI, email + password |
| account.php | Customer dashboard — my orders, profile edit, saved addresses |
| wishlist.php | Saved products — remove from wishlist, add to cart |
| search.php | Search results — query from header search bar |
| contact.php | Contact form — name, email, phone, message → saved in enquiries table |

---

## 6. ADMIN PANEL

> Admin panel lives under `/admin/` folder. Every page protected by `requireRole('admin')` or `requireRole('staff')` from `includes/session.php`. Dark sidebar layout. Active item in `#19D9F2` cyan. No external CSS framework — all styling inline per page.

### 6.1 Admin Sidebar Navigation

| Sidebar Section | Sub Pages / Features |
|---|---|
| Dashboard | Total orders today, revenue today, pending count, low stock alerts, recent 10 orders, revenue graph |
| Order Management | All Orders \| Email Delivery Orders \| Courier Orders \| Pending Orders \| Cancelled Orders \| Order Detail |
| License Keys | All Keys \| Add Keys (bulk paste) \| Low Stock Alert |
| Product Management | All Products \| Add New Product \| Edit Product \| Categories \| Featured Products toggle |
| Customer Management | All Customers \| Blocked Customers |
| Payment Management | All Payments \| Pending Payments \| Refunds \| COD Orders |
| Shipping & Tracking | Courier Orders list \| Add Tracking Number (manual) \| Delivery Status |
| Coupons & Deals | All Coupons \| Add Coupon \| Active Deals |
| Reviews & Ratings | Pending Reviews (approve/reject) \| Approved Reviews |
| Enquiries | Contact Enquiries \| Mark as read/replied |
| Reports | Sales Report \| Revenue Report \| Product Report \| Export to CSV |
| Blogs & Articles | All Blogs \| Add New Blog Post |
| Settings | Store Settings \| Payment (Razorpay keys) \| Email SMTP \| Shipping Charges \| Admin Users |
| Logout | End admin session, redirect to admin login |

### 6.2 Order Management — Detailed

- Orders list table: Order ID, Customer, Product(s), Total, Delivery type, Payment status, Order status, Date, Actions
- Filter by: date range, status, delivery type (email/courier/cod)
- Order detail page: full customer info, items, payment details, delivery type, current status
- Status update: Pending → Processing → Shipped → Delivered → Cancelled
- Email delivery orders: show license key sent + **Resend License Key Email** button
- Courier orders: Add tracking number field + courier name dropdown (India Post, DTDC, Delhivery, Shadowfax, Other)
- **Manual WhatsApp notify button** on order detail page (see Section 6.5)
- Generate PDF invoice per order
- Cancel order with refund note
- COD orders: Mark as Cash Collected button

### 6.3 License Key Management — Detailed

- **All Keys page:** table — Product, Key (masked: XXXXX-XXXXX-*****), Status (Unused/Used/Expired), Customer Email, Order ID, Date Used
- **Add Keys page:** Select product → paste keys one per line in textarea → Save → bulk insert with `status=unused`
- **Low Stock Alert page:** lists products where unused key count < threshold (set in settings, default: 10)
- **Auto-assign:** when order placed + payment confirmed, system picks oldest unused key for that product
- After key sent: `status=used`, `order_id` filled, `used_at` timestamp set
- Resend key email available from order detail page

### 6.4 Product Management — Detailed

**Add/Edit product fields:**
- name, slug (auto-generated), brand, category, full description
- price (₹), original/MRP price (₹), discount % (auto-calculated or manual)
- delivery_type: Email / Courier / Both
- license_info text (e.g. `1 Device | 1 Year`)
- stock_qty (for physical box products)
- featured toggle (shows on homepage best sellers)
- status: active / inactive
- SEO: meta title + meta description

**Product images:** upload multiple, select one as primary, delete individual images

**Categories:** add/edit/delete — name, slug, icon name, description, active/inactive

**Featured products:** toggle on/off — controls Best Sellers section on homepage

### 6.5 Manual WhatsApp Notify Button (NO API — Zero Cost)

> There is NO WhatsApp API. Each order detail page has a **WhatsApp Notify** button.

**How it works:**
- Admin clicks **Send WhatsApp to Customer** button on order detail page
- Opens `https://wa.me/91[phone]?text=[URL-encoded-message]` in new browser tab
- WhatsApp Web opens with customer's number + pre-filled message
- Admin clicks Send — done

**Pre-filled message templates by order status:**

| Status | Message Template |
|---|---|
| Order Confirmed | `Hi [Name], your order #[ID] for [Product] has been confirmed. Total: ₹[Amount]. Thank you for shopping with AbDotStore!` |
| License Key Sent | `Hi [Name], your license key for [Product] has been sent to your email [email]. Please check your inbox.` |
| Tracking Update | `Hi [Name], your order #[ID] has been shipped. Tracking No: [TrackingNo] via [Courier]. Track at: indiapost.gov.in` |
| Out for Delivery | `Hi [Name], your order #[ID] is out for delivery today. Please be available at your address.` |
| Delivered | `Hi [Name], your order #[ID] has been delivered. Thank you for shopping with AbDotStore! Need help? Reply here.` |

> **Zero API key needed. Zero monthly cost. Works on shared hosting. Admin just clicks Send on WhatsApp Web.**

### 6.6 Shipping & Tracking — Manual (No API)

- Admin visits post office, books India Post Speed Post, gets receipt with tracking number (format: `EE123456789IN`)
- Admin goes to `admin/tracking-add.php` → selects order → enters tracking number + courier name + notes
- Tracking number saved to `shipments` table and `orders.tracking_number`
- Admin clicks WhatsApp Notify button → sends tracking message to customer manually
- Customer tracks at `track.php` → enters order ID → sees tracking number + link to `indiapost.gov.in`
- Admin manually updates order status to Delivered when confirmed
- **No AfterShip. No automatic polling. 100% manual. Works perfectly for small-medium volume.**

### 6.7 Settings — Delivery Charge (Admin Configurable)

> Admin sets delivery charges from `admin/settings-shipping.php`. Saved in `settings` table.

| Setting | Description |
|---|---|
| Courier Delivery Charge (₹) | Flat charge added when courier shipping selected — default ₹99 |
| Free Shipping Above (₹) | If subtotal exceeds this, courier becomes free — default ₹999 |
| Email Delivery Charge (₹) | Charge for digital/email delivery — default ₹0 |
| COD Extra Charge (₹) | Extra charge for Cash on Delivery — default ₹30 |

- `checkout.php` reads values via `getSetting('delivery_charge_courier')` from settings table
- Order summary updates live with plain JS when customer switches Email ↔ Courier
- Never hardcode delivery charges — always read from settings table

---

## 7. KEY BUSINESS FLOWS

### 7.1 Email Delivery Flow (Fully Automatic)

```
Customer places order (Email Delivery selected)
  → Razorpay payment page opens
  → Customer pays via UPI / Card / Net Banking
  → Razorpay sends webhook POST to includes/razorpay.php
  → Server verifies HMAC-SHA256 signature using secret key
     (secret key in razorpay-config.php — NEVER in frontend JS)
  → Signature valid
  → System picks oldest UNUSED license key for that product from license_keys table
  → PHPMailer sends email to customer with:
       License Key + Activation Steps + Download Link
  → license_keys row: status=used, order_id=this order, used_at=now
  → orders row: payment_status=paid, order_status=delivered
  → Admin can optionally click WhatsApp button to send confirmation
```

### 7.2 Courier Delivery Flow

```
Customer places order (Courier Shipping selected)
  → Delivery charge (₹99 or as set in admin settings) added to total
  → Razorpay payment confirmed via webhook
  → orders row: payment_status=paid, order_status=processing
  → Admin sees new order in admin/orders-courier.php
  → Admin packs the software box
  → Admin visits India Post / courier partner
  → Admin opens admin/tracking-add.php
  → Admin enters tracking number + courier name
  → Admin clicks WhatsApp Notify button on order detail
     → WhatsApp Web opens with pre-filled tracking message
     → Admin clicks Send
  → Customer receives tracking number on WhatsApp
  → Customer visits track.php → enters order ID → sees tracking number
  → Customer tracks at indiapost.gov.in
  → Admin manually updates order_status to Delivered
```

### 7.3 Razorpay Payment Verification

- Razorpay JS on `checkout.php` initiates payment — sends amount to Razorpay only
- On payment success, Razorpay sends webhook to `includes/razorpay.php` (server-side only)
- Server verifies: `hash_hmac('sha256', $orderId.'|'.$paymentId, $secret) === $razorpaySignature`
- Secret key stored ONLY in `razorpay-config.php` — never in browser or frontend JS
- Only after verified: payment recorded, license key sent or order marked for packing
- Frontend JS never makes trust decisions — all business logic server-side

---

## 8. THIRD-PARTY INTEGRATIONS

| Service | Files | Purpose |
|---|---|---|
| Razorpay | razorpay.php + razorpay-config.php | Payment gateway — UPI, Card, Net Banking — server-side webhook verification |
| PHPMailer | email.php + email-config.php | Send license key emails, order confirmations, customer notifications |
| WhatsApp (Manual) | No API file needed | Admin clicks pre-filled `wa.me` link — zero API, zero cost |
| India Post Tracking | No API file needed | Admin enters tracking number manually, customer tracks at indiapost.gov.in |

> Each API integration has a `*-config.sample.php` committed to git with `PASTE_YOUR_X_HERE` placeholders and full setup instructions in a comment block. Real `*-config.php` files are gitignored.

---

## 9. SECURITY REQUIREMENTS

- All API keys (Razorpay, SMTP) stored in `*-config.php` files — **NEVER in frontend HTML/JS**
- Razorpay payment verification done exclusively server-side via HMAC-SHA256
- CSRF token on every state-changing form (add to cart, checkout, profile update, all admin actions)
- All DB queries use prepared statements via `dbStmt()` — no raw string interpolation ever
- Passwords hashed with `password_hash()` / verified with `password_verify()`
- Every admin panel page protected by `requireRole('admin')` or `requireRole('staff')`
- Session regenerated on login via `session_regenerate_id(true)`
- File uploads validated by MIME type + size limit, stored in `uploads/` subfolder
- License keys masked in admin list view — full key visible only on individual order detail page

---

## 10. .GITIGNORE RULES

```
uploads/
logs/
*.log
*-config.php
```

> Keep all `*-config.sample.php` files committed to git.

---

## 11. BUILD PHASE PLAN

| Phase | Focus | Deliverables |
|---|---|---|
| Phase 1 | Foundation | schema.sql, db.php, session.php, all models, folder structure, .gitignore, config sample files, settings table seeded with default delivery charges |
| Phase 2 | Frontend UI | index.php full homepage (all sections), header.php, footer.php, style.css tokens, main.js |
| Phase 3 | Product Pages | listing.php, product.php, search.php, category filtering, pagination |
| Phase 4 | Cart & Auth | cart.php, checkout.php (with delivery charge logic), auth.php, account.php, wishlist.php, order-success.php |
| Phase 5 | Payments | Razorpay integration, webhook handler in includes/razorpay.php, license key auto-send via PHPMailer |
| Phase 6 | Admin Panel | Full /admin/ with all sidebar pages — orders, license keys, products, customers, payments, shipping (manual tracking) |
| Phase 7 | WhatsApp & Tracking | Manual WhatsApp notify buttons on order pages (wa.me links), track.php for customers, settings-shipping.php for delivery charges |
| Phase 8 | Polish | Reviews, coupons, reports (CSV export), blogs, mobile responsive final pass, error pages (404, 500) |

---

## 12. IMPORTANT NOTES FOR CODING AGENT

### DO NOT:
- Use any PHP framework (no Laravel, no Slim, no CodeIgniter)
- Use Composer or npm or any package manager
- Use PDO — use plain mysqli only with db.php helper functions
- Use any JavaScript library or framework (no React, no Vue, no jQuery, no Alpine) — plain browser JS only
- Add any build step (no webpack, no vite, no babel, no npm build)
- Use ORM or query builder of any kind
- Integrate AfterShip or any tracking API — tracking is 100% manual
- Integrate WhatsApp API — use manual `wa.me` button links only
- Hardcode delivery charges — always read from settings table

### DO:
- Use inline `<style>` per .php file for all component CSS
- Use inline `<script>` per .php file for page-specific JavaScript
- Duplicate CSS across files rather than centralizing — every page must be self-contained
- Use prepared statements for ALL database queries — zero exceptions
- Use the exact folder structure defined in Section 3 — do not deviate
- Read delivery charge from settings table in checkout.php
- Update order total dynamically using plain JS when delivery type is switched at checkout
- Name all new migrations incrementally (migration_02.sql, migration_03.sql...) — never edit past migrations
- Use `#19D9F2` consistently for all CTAs, active states, icons, borders, badges
- Build WhatsApp notify button as `wa.me/91[phone]?text=[encoded-message]` link — opens WhatsApp Web — NO API key needed
- Style admin panel sidebar with dark background, active item in `#19D9F2` cyan, clean table layout

---

*AbDotStore PRD v1.1 | Ignixup




the pormpt given by client is ===Create the Homepage UI for AbDotStore, a premium Indian software e-commerce store.

Use the uploaded reference image as visual inspiration for the overall design style, but create an original AbDotStore design.

VISUAL STYLE

Use a premium dark minimal technology aesthetic.

Colors:

- Main background: deep black / charcoal
- Cards: dark charcoal
- Primary accent: cyan/turquoise similar to the reference image
- Primary accent color: #19D9F2
- Text: white
- Secondary text: light gray
- Borders: subtle dark gray

Do NOT use purple.
Do NOT use bright blue as the main accent.
Do NOT use excessive gradients.
Do NOT make the website look like a gaming website.

The overall feeling should be:
Premium + Minimal + Trustworthy + Modern + Software-focused

HEADER

Create a sticky desktop header.

Left:

- AbDotStore logo
- Small tagline: "Smart. Secure. Genuine."

Center:

- Large search bar
- Placeholder: "Search software, antivirus, Windows..."

Right:

- Wishlist icon
- Cart icon
- Account icon

Navigation below:

Home
Categories
Deals
New Arrivals
All Products
Support

Use cyan for the active navigation item.

HERO SECTION

Create a large premium cinematic hero section.

Use a dark technology/software background with subtle visuals of:

- Laptop
- Software interface
- Security shield
- Windows
- Antivirus

Main heading:

Trusted Software.
Delivered Your Way.

Supporting text:

Genuine software, secure payments and fast delivery for your digital needs.

Add a small cyan label:

GENUINE SOFTWARE

Buttons:

Shop Software

Explore Deals

Keep the hero clean and spacious.

DELIVERY HIGHLIGHTS

Under the hero, create two premium cards:

Email Delivery

Icon: envelope

Instant Email Delivery

"License details delivered directly to your email."

Courier Shipping

Icon: package/truck

Courier Shipping

"Physical software products delivered safely to your address."

Use subtle cyan highlights.

SOFTWARE CATEGORIES

Title:

Explore Software Categories

Create 7 category cards:

1. Total Security
2. Antivirus
3. Internet Security
4. Windows
5. Accounting Solutions
6. Server Security
7. Gaming

Use simple professional line icons.

Each card should have:

- Icon
- Category name
- Short description
- Arrow icon

Cards should have subtle cyan hover effects.

BEST SELLERS

Title:

Best Selling Software

Add:
View All →

Create 4 premium product cards.

Example products:

- Kaspersky Total Security
- Norton 360 Deluxe
- ESET Internet Security
- Bitdefender Total Security

Each card must show:

- Product image
- Brand
- Product name
- License/device information
- Rating
- Current price in ₹
- Original price
- Discount
- Delivery method
- Wishlist icon
- Add to Cart button

Product cards should be dark, clean and minimal.

WHY ABDOTSTORE

Create a horizontal trust section:

100% Genuine Software

Instant Email Delivery

Secure Payment

Fast Courier Shipping

Customer Support

Use minimal cyan icons.

SPECIAL DEALS

Create a dark promotional section:

Software Deals

Supporting text:

"Upgrade your digital experience without overspending."

Add a few discounted product cards.

Use cyan for the main CTA.

FOOTER

Create a professional dark footer.

Columns:

AbDotStore

"Smart. Secure. Genuine."

Quick Links

About Us
Contact
All Products
Deals
New Arrivals

Customer Support

Help Center
Track Order
Returns & Refunds
Contact Support

Categories

Total Security
Antivirus
Internet Security
Windows
Accounting Solutions
Server Security
Gaming

Policies

Privacy Policy
Terms & Conditions
Shipping Policy
Refund Policy

Bottom:

© AbDotStore. All Rights Reserved.

RESPONSIVE DESIGN

Also create the mobile version of this homepage.

Mobile header:

- Menu
- AbDotStore logo
- Search
- Cart

Bottom navigation:
Home | Search | Categories | Orders | Profile

Make all buttons and cards mobile-friendly.

IMPORTANT

The final homepage must look like a premium software marketplace, not a generic template.

Maintain:
Dark background + Cyan/Turquoise accent + Minimal UI + Premium typography + Clean spacing.

Do not introduce purple or unnecessary colors.

