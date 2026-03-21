# DirectBnB — Production Deploy Guide

## Architecture
```
directbnb.nl          → Vercel (landing/)
app.directbnb.nl      → Vercel (frontend/)
api.directbnb.nl      → Railway (backend/)
Database              → Neon (PostgreSQL — already live)
Email                 → Resend (already live)
Payments              → Mollie (iDEAL / Wero) + Stripe (card — optional)
```

---

## 1. Backend → Railway

### Deploy
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select the `backend/` folder (or use a monorepo root and set the root directory to `backend`)
3. Railway will auto-detect NixPacks and use `railway.json`

### Environment variables to set in Railway
```
NODE_ENV=production
PORT=3001
DATABASE_URL=           # Your Neon connection string
JWT_SECRET=             # Generate: openssl rand -hex 32
JWT_REFRESH_SECRET=     # Generate: openssl rand -hex 32
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
RESEND_API_KEY=re_2ZKrmjqL_82WyUuDR66qqnvM1DsZrMQKJ
EMAIL_FROM=DirectBnB <noreply@directbnb.nl>
FRONTEND_URL=https://app.directbnb.nl
LANDING_URL=https://directbnb.nl

# ── Mollie (primary — iDEAL / Wero) ──────────────────────────────────────────
MOLLIE_API_KEY=live_...
MOLLIE_WEBHOOK_URL=https://api.directbnb.nl/api/v1/mollie/webhook

# ── Stripe (optional — card payments) ────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### Custom domain
In Railway → Settings → Networking → Add custom domain: `api.directbnb.nl`

---

## 2. Frontend Dashboard → Vercel

### Deploy
1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Set **Root Directory** to `frontend/`
3. Framework: Next.js (auto-detected)

### Environment variables in Vercel
```
NEXT_PUBLIC_API_URL=https://api.directbnb.nl/api/v1
```

### Custom domain
Vercel → Project → Settings → Domains → Add `app.directbnb.nl`

---

## 3. Landing Page → Vercel

### Deploy
1. Vercel → New Project → Import from GitHub
2. Set **Root Directory** to `landing/`
3. Framework: Next.js (auto-detected)

### Environment variables in Vercel
```
BACKEND_URL=https://api.directbnb.nl
```

### Custom domain
Vercel → Project → Settings → Domains → Add `directbnb.nl` and `www.directbnb.nl`

---

## 4. Mollie Setup (iDEAL / Wero — primary payments)

1. Create account at [mollie.com](https://my.mollie.com)
2. Activate your account (complete business verification)
3. Go to **Dashboard → Developers → API keys** → copy the **Live API key** (`live_...`)
4. Enable payment methods: Dashboard → **Activations**
   - ✅ iDEAL (Dutch bank payments)
   - ✅ Wero (European digital wallet)
   - ✅ Bank transfer (optional)
5. Add webhook in Dashboard → **Developers → Webhooks** (or set it via `MOLLIE_WEBHOOK_URL`)
   - URL: `https://api.directbnb.nl/api/v1/mollie/webhook`
6. Test with a test key (`test_...`) first — switch to `live_...` for production

### Payment flow
```
Guest fills booking form
  → POST /public/bookings          (creates PENDING booking)
  → POST /mollie/public/pay        (creates Mollie payment, returns checkoutUrl)
  → Redirect to Mollie checkout (iDEAL bank selector / Wero wallet)
  → Guest completes payment
  → Mollie POSTs to /mollie/webhook (marks depositPaid = true)
  → Mollie redirects guest to app.directbnb.nl/nl/boek/betaling?bookingId=...
  → Frontend polls /mollie/payment/by-booking/:id/status
```

---

## 5. Stripe Setup (optional — card payments)

1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from Dashboard → Developers → API keys
3. Add webhook: Dashboard → Developers → Webhooks
   - Endpoint: `https://api.directbnb.nl/api/v1/stripe/webhook`
   - Events to listen: `payment_intent.succeeded`
4. Copy the webhook signing secret → `STRIPE_WEBHOOK_SECRET`

---

## 6. DNS Records (at your domain registrar)

```
Type    Name    Value
A       @       76.76.21.21          (Vercel IP for landing)
CNAME   www     cname.vercel-dns.com
CNAME   app     cname.vercel-dns.com (dashboard)
CNAME   api     your-app.railway.app (backend)
```

---

## 7. Post-deploy checklist

- [ ] Run `npx prisma migrate deploy` on Railway (handled by railway.json start command)
- [ ] Test beta signup form on directbnb.nl
- [ ] Test email received from noreply@directbnb.nl
- [ ] Test guest portal at app.directbnb.nl/nl/boek/[your-slug]
- [ ] Test booking form submission
- [ ] Test iDEAL payment with Mollie test key (`test_...`)
- [ ] Test Wero payment with Mollie test key
- [ ] Switch `MOLLIE_API_KEY` to `live_...` for production
- [ ] Verify deposit marked as paid after successful payment
- [ ] Verify email logs in admin dashboard
- [ ] (Optional) Add Stripe keys for card payments
