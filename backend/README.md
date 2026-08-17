# CHARMENTIST backend

A small Node.js/Express API that gives the CHARMENTIST site real accounts,
a real product database, a cart/wishlist tied to your account (not your
browser), and real order + payment processing via Midtrans.

Everything lives in one SQLite file (`db/data.sqlite`) — no separate
database server to install or pay for.

## What's wired up already (frontend side)

- `assets/js/auth.js` — sign in / sign up / change password now call this
  API instead of storing plaintext passwords in the browser.
- `assets/js/store.js` — cart & wishlist sync to the account when logged
  in (local-first, so pages stay instant; background sync to match).
- `assets/js/products.js` — pulls the live catalog from `/api/products`
  on every page load (price, stock, new/removed pieces), with the bundled
  static list as an instant-render fallback if the API is unreachable.
- `checkout.html` — "Confirm Order" posts to `POST /api/orders` and opens
  the real Midtrans payment popup. Email/phone/postal code are validated
  both client-side (checkout.html) and server-side (routes/orders.js) —
  the client checks give instant feedback, the server checks are what
  actually protect the database from garbage data.
- `account.html` — order history now reads from `GET /api/orders`
  instead of localStorage, so it's the same across devices.
- `admin.html` — a small dashboard (open it directly in a browser) to
  view/update orders and manage products, protected by your `ADMIN_KEY`.
  This is the ONLY way to manage the shop now — there's no other UI for it.

## 1. Install

Requires Node.js 18+.

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in:
- `JWT_SECRET` — any long random string (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
- `ADMIN_KEY` — same idea, used to protect the admin endpoints
- `CORS_ORIGIN` — the URL(s) your site will actually be served from

Leave `MIDTRANS_*` and `SMTP_*` blank for now — the API still works
without them (orders just won't take real payment or send email yet).

## 2. Load your products into the database

Your existing `assets/js/products.js` is the source of truth for what's
in your shop. Copy it in and seed the database from it:

```bash
cp ../CHARMENTIST_Website/assets/js/products.js data/products-source.js
npm run seed
```

Re-run `npm run seed` any time you edit `products-source.js` — it
updates existing rows instead of duplicating them. Once you're managing
products through `admin.html` day-to-day, you generally won't need to
re-run this — it's really just for the initial import.

**Important:** the prices in `products.js` right now aren't in a
specific currency. Midtrans only processes **IDR (Indonesian Rupiah)**,
as whole numbers with no decimals. Before going live, make sure every
product's `price` is the real Rupiah amount (e.g. a Rp 11,400,000 piece
should be stored as `11400000`), then re-run the seed — or just correct
the prices directly in `admin.html` after seeding once.

## 3. Run it

```bash
npm start          # production
npm run dev         # auto-restarts on file changes
```

The API is now at `http://localhost:4000/api`. Test it:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/products
```

## 4. Point the frontend at it

By default the frontend scripts call `http://localhost:4000/api`. Once
you deploy this backend somewhere with a real URL, add one line near the
top of each HTML page's `<head>` (before the other `<script>` tags):

<script>window.CHARM_API_BASE = 'https://your-backend.example.com/api';</script>
```

## 5. Set up Midtrans (payment)

1. Create a free account at https://dashboard.midtrans.com (Indonesian
   business/individual — you'll need a bank account to receive payouts).
2. Grab your **Sandbox** Server Key and Client Key from
   Settings → Access Keys. Put them in `.env` as `MIDTRANS_SERVER_KEY`
   and `MIDTRANS_CLIENT_KEY`.
3. In `checkout.html`, replace `YOUR_MIDTRANS_CLIENT_KEY` in the
   `<script data-client-key="...">` tag with the same client key.
4. Test a full checkout using Midtrans's sandbox test cards/accounts
   (listed in their docs) — no real money moves in sandbox mode.
5. In the Midtrans dashboard, set your **Payment Notification URL** to
   `https://your-backend.example.com/api/payment/notification` — this is
   how the backend finds out a payment actually succeeded.
6. When ready to accept real payments: switch to Production keys in
   Midtrans, set `MIDTRANS_IS_PRODUCTION=true` in `.env`, and swap the
   Snap script tag in `checkout.html` to
   `https://app.midtrans.com/snap/snap.js`.

## 6. Set up email (order confirmations, password reset)

Any SMTP provider works. Two easy options:
- **Resend** (https://resend.com) — free tier, simple API, SMTP details
  are on their dashboard.
- **Gmail** — use an "app password" (not your normal password) as
  `SMTP_PASS`, `smtp.gmail.com` port 587 as `SMTP_HOST`/`SMTP_PORT`.

Fill in `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`
in `.env`. Until these are set, the backend just logs what it would have
sent — nothing breaks, emails just don't go out.

## 7. Managing the shop day-to-day: admin.html

Open `admin.html` directly in a browser (no build step needed) and enter
your `ADMIN_KEY`. From there you can:
- See every order, filter by status, change status (paid → processing →
  shipped → completed), and cancel/refund an order (this calls Midtrans
  to actually cancel or refund the transaction, then restocks the items).
- See every product, edit price/stock inline, deactivate one (soft-delete
  — hides it from the storefront without deleting its order history), and
  add brand new products without touching any code.

Since it's a static HTML file, you can put it anywhere — even just open
it from your own computer — as long as `window.CHARM_API_BASE` (or the
`http://localhost:4000/api` default) points at your running backend.
Keep the URL to this file private/unlisted; the `ADMIN_KEY` is the only
thing gating access to it.

## 8. Deploy

Cheapest reliable options for a small store:
- **Railway** (https://railway.app) or **Render** (https://render.com) —
  connect your GitHub repo, they detect `npm start` automatically. Add
  all your `.env` values as environment variables in their dashboard.
  Note: SQLite needs a persistent disk/volume on these platforms (both
  offer one) so `db/data.sqlite` survives restarts/deploys.
- A small VPS (DigitalOcean, etc.) with `pm2` to keep the process alive.

Whichever you choose, set `CORS_ORIGIN` to your real storefront domain
and `FRONTEND_URL` to the same, so password-reset emails link correctly.

## API reference (quick)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | – | Create account |
| POST | `/api/auth/login` | – | Sign in |
| GET | `/api/auth/exists?email=` | – | Used by the sign-in page's 2-step flow |
| GET | `/api/auth/me` | Bearer | Current user |
| PATCH | `/api/auth/me` | Bearer | Update name |
| POST | `/api/auth/change-password` | Bearer | Change password |
| POST | `/api/auth/forgot-password` | – | Sends reset email |
| POST | `/api/auth/reset-password` | – | Sets new password from emailed token |
| GET | `/api/products` | – | List products (`?collection=&type=&q=`) |
| GET | `/api/products/:id` | – | Product detail |
| GET/POST/PATCH/DELETE | `/api/cart` | Bearer | Cart tied to account |
| GET/POST | `/api/wishlist` | Bearer | Wishlist tied to account |
| POST | `/api/orders` | optional | Place an order (guest checkout allowed) |
| GET | `/api/orders` | Bearer | My order history |
| GET | `/api/orders/:orderNumber` | – | Order status lookup |
| POST | `/api/payment/notification` | Midtrans only | Payment webhook |
| POST/PATCH/DELETE | `/api/admin/products` | `x-admin-key` header | Manage catalog |
| GET/PATCH | `/api/admin/orders` | `x-admin-key` header | View/update orders |
| POST | `/api/admin/orders/:id/cancel-refund` | `x-admin-key` header | Cancel (unpaid) or refund (paid) an order via Midtrans |

## What's still manual / not built

- **HTTPS, backups, domain, deployment** — all environment/infra setup,
  not code. See "Deploy" above for the deployment part; database backup
  is just periodically copying `db/data.sqlite` somewhere safe (or using
  your hosting platform's volume snapshot feature, if it has one).
- **Shipping rate calculation** — `shippingFee` in routes/orders.js is
  hardcoded to 0. Wire in a real courier API (JNE/J&T/SiCepat all have
  rate-check APIs) or a flat rate once you decide your shipping policy.
- **Staff/multi-admin accounts** — right now "admin" is a single shared
  key. Fine solo; if you bring on staff, replace `requireAdmin` in
  routes/admin.js with a proper `role` column + login instead.
