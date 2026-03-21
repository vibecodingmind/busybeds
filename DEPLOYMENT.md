# Busy Beds — Production Deployment Guide

## Overview

This guide covers deploying Busy Beds to **Vercel** (hosting) + **Neon / Supabase** (PostgreSQL database).

---

## 1. Switch from SQLite to PostgreSQL

### a. Update the Prisma provider

Open `prisma/schema.prisma` and change:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

to:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")   // required for Neon connection pooling
}
```

### b. Get a free PostgreSQL database

**Option A — Neon (recommended):**
1. Go to https://neon.tech and create a free account
2. Create a new project → copy the **Connection String** (starts with `postgresql://...`)
3. Also copy the **Direct connection string** for migrations

**Option B — Supabase:**
1. Go to https://supabase.com → new project
2. Settings → Database → copy the **Connection string** (URI format)

---

## 2. Configure environment variables

Create a `.env.production` file (or set these in Vercel's dashboard):

```bash
# Database (replace with your Neon/Supabase values)
DATABASE_URL="postgresql://user:password@pooler.neon.tech/busybeds?sslmode=require"
DIRECT_URL="postgresql://user:password@direct.neon.tech/busybeds?sslmode=require"

# Auth — generate a strong random string:
# Run: openssl rand -base64 32
JWT_SECRET="your-super-secret-jwt-key-here"

# Your Vercel deployment URL (set after first deploy)
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"

# Stripe (optional — mock payments work without these)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email via SMTP (optional — console fallback works without these)
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
SMTP_FROM="noreply@yourdomain.com"
```

---

## 3. Run database migrations

After updating the provider and setting `DATABASE_URL`:

```bash
# Generate Prisma client for PostgreSQL
npx prisma generate

# Push schema to production database
npx prisma db push

# Seed initial data (packages, demo accounts, sample hotels)
npx prisma db seed
```

---

## 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (from the project root)
vercel --prod
```

Vercel will:
- Detect Next.js automatically
- Ask you to link to a project (create new or use existing)
- Deploy and give you a URL like `https://busybeds.vercel.app`

### Add environment variables in Vercel

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add all variables from your `.env.production` file
4. Redeploy: `vercel --prod`

---

## 5. Set up Stripe webhooks (if using Stripe)

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-app.vercel.app/api/subscriptions/webhook`
3. Listen for events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
4. Copy the **Signing Secret** → add as `STRIPE_WEBHOOK_SECRET` in Vercel

---

## 6. Custom domain (optional)

1. Vercel dashboard → Domains → Add Domain
2. Enter `busybeds.com` (or your domain)
3. Update your DNS nameservers as instructed
4. Update `NEXT_PUBLIC_APP_URL` to `https://busybeds.com`

---

## 7. Post-deployment checklist

- [ ] Visit `/api/health` or the home page — confirm it loads
- [ ] Register a test account — confirm email works (or console fallback)
- [ ] Subscribe with a test card (`4242 4242 4242 4242`) — confirm Stripe works
- [ ] Generate a coupon — confirm QR code appears
- [ ] Log in as admin (`admin@busybeds.com`) — confirm admin panel loads
- [ ] Check `/sitemap.xml` and `/robots.txt` are accessible
- [ ] Run Lighthouse audit on home page — aim for 90+ performance

---

## 8. Scaling considerations

| Concern | Solution |
|---|---|
| Multi-region rate limiting | Replace in-memory `rateLimit` with [Upstash Redis](https://upstash.com) |
| File uploads (hotel photos) | Use [Cloudinary](https://cloudinary.com) or [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) |
| Email at scale | [SendGrid](https://sendgrid.com) or [Resend](https://resend.com) |
| Analytics | [Vercel Analytics](https://vercel.com/analytics) (one-line install) |
| Monitoring | [Sentry](https://sentry.io) for error tracking |

---

## Demo accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@busybeds.com | admin123 |
| Traveler | traveler@demo.com | demo123 |
| Hotel Owner | owner@grandriviera.com | owner123 |
| Hotel Manager | manager@grandriviera.com | manager123 |

> ⚠️ Change all demo passwords before going live.
