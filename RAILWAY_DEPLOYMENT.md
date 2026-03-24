# Busy Beds — Railway Deployment Guide

This guide covers migrating from **Vercel + Supabase** to **Railway** for both hosting and PostgreSQL database.

---

## Why Railway?

| Feature | Vercel + Supabase | Railway |
|---------|------------------|---------|
| Hosting | Vercel | Railway |
| Database | Supabase (separate) | Railway PostgreSQL (integrated) |
| Connection Pooling | Required (Supabase uses PgBouncer) | Not needed (direct connection) |
| Free Tier | Yes (limited) | $5/month credit |
| Complexity | Two platforms to manage | One platform for everything |

---

## Prerequisites

1. A Railway account: https://railway.app
2. Your GitHub repository: https://github.com/vibecodingmind/busybeds
3. Access to your current Supabase database (for data migration)

---

## Step 1: Create a PostgreSQL Database on Railway

1. Go to https://railway.app and sign in
2. Click **+ New Project**
3. Select **Provision PostgreSQL**
4. Railway will create a PostgreSQL database
5. Click on the PostgreSQL service to view details
6. Note the **Connection URL** (we'll use this as `DATABASE_URL`)

### Get Your Database Connection String

In the PostgreSQL service, go to **Variables** tab and copy the `DATABASE_URL`. It looks like:

```
postgresql://postgres:PASSWORD@HOST.railway.app:PORT/railway
```

---

## Step 2: Deploy Your Application on Railway

### Option A: Deploy from GitHub (Recommended)

1. In Railway, click **+ New Project** → **Deploy from GitHub repo**
2. Select `vibecodingmind/busybeds`
3. Railway will automatically detect Next.js and configure the build

### Option B: Deploy with Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize in your project
cd busybeds
railway init

# Deploy
railway up
```

---

## Step 3: Configure Environment Variables

In Railway dashboard, go to your web service → **Variables** tab and add:

### Required Variables

```bash
# Database (Railway provides this automatically if linked)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Auth — generate a strong random string
# Run locally: openssl rand -base64 32
JWT_SECRET="your-super-secret-jwt-key-here"

# App URL (update after first deploy with your Railway domain)
NEXT_PUBLIC_APP_URL="https://your-app.up.railway.app"
```

### Payment Variables (if using)

```bash
# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# PayPal
PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."
PAYPAL_MODE="live"

# Pesapal
PESAPAL_CONSUMER_KEY="..."
PESAPAL_CONSUMER_SECRET="..."
PESAPAL_MODE="live"
PESAPAL_IPN_URL="https://your-app.up.railway.app/api/payments/pesapal/callback"
```

### Email Variables (if using)

```bash
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="Busy Beds <noreply@busybeds.com>"
```

### Google OAuth (if using)

```bash
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="https://your-app.up.railway.app/api/auth/google/callback"
```

---

## Step 4: Link Database to Web Service

1. In Railway, go to your **web service**
2. Click **+ Add** → select **Database** → choose your PostgreSQL service
3. This automatically links the `DATABASE_URL` variable

---

## Step 5: Run Database Migrations

Railway will automatically run `prisma generate` during build (via `postinstall` script).

To push the schema and seed data:

### Option A: Use Railway CLI

```bash
# Connect to your Railway project
railway link

# Run migrations
railway run npx prisma db push

# Seed initial data
railway run npm run db:seed
```

### Option B: Use Railway Dashboard Shell

1. Go to your web service in Railway dashboard
2. Click **Settings** → **Deployments** → click on latest deployment
3. Click **Terminal** tab
4. Run:
```bash
npx prisma db push
npm run db:seed
```

---

## Step 6: Configure Custom Domain (Optional)

1. In Railway, go to your web service → **Settings** → **Domains**
2. Click **+ Generate Domain** for a free `.up.railway.app` subdomain
3. Or add your custom domain:
   - Click **+ Custom Domain**
   - Enter your domain (e.g., `busybeds.com`)
   - Add the required DNS records to your domain registrar
4. Update `NEXT_PUBLIC_APP_URL` to your domain

---

## Step 7: Update Payment Webhooks

### Stripe

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-domain.com/api/subscriptions/webhook`
3. Listen for events: `checkout.session.completed`, `customer.subscription.deleted`
4. Copy the **Signing Secret** → update `STRIPE_WEBHOOK_SECRET` in Railway

### PayPal

Update your PayPal app's webhook URL to: `https://your-domain.com/api/payments/paypal/webhook`

### Pesapal

Update `PESAPAL_IPN_URL` to: `https://your-domain.com/api/payments/pesapal/callback`

---

## Step 8: Migrate Data from Supabase (Optional)

If you have existing data in Supabase:

```bash
# Export from Supabase (run locally with Supabase connection)
pg_dump "your-supabase-connection-string" > supabase_backup.sql

# Import to Railway (run with Railway connection)
railway run psql $DATABASE_URL < supabase_backup.sql
```

Or use Prisma migrate:

```bash
# From your local machine with Supabase connection
npx prisma db pull

# Switch to Railway database
railway run npx prisma db push
```

---

## Step 9: Verify Deployment

1. Visit your Railway URL (e.g., `https://busybeds.up.railway.app`)
2. Test key features:
   - [ ] Home page loads
   - [ ] Register a new account
   - [ ] Login works
   - [ ] Generate a coupon
   - [ ] Admin panel accessible

---

## Environment Variables Summary

| Variable | Source | Notes |
|----------|--------|-------|
| `DATABASE_URL` | Railway PostgreSQL | Auto-set when linked |
| `JWT_SECRET` | Generate manually | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Your Railway domain | Update after deploy |
| Stripe vars | Stripe Dashboard | Optional |
| PayPal vars | PayPal Developer | Optional |
| Email vars | Your SMTP provider | Optional |

---

## Railway vs Vercel: Key Differences

### No Connection Pooling Needed

Railway provides direct PostgreSQL connections, so you don't need `DIRECT_URL`. The Prisma schema has been updated to handle both.

### Port Configuration

Railway automatically sets the `PORT` environment variable. Next.js uses this by default.

### Build Configuration

Railway uses Nixpacks which automatically detects Next.js. The `railway.toml` file provides additional configuration.

---

## Troubleshooting

### Build Fails

1. Check build logs in Railway dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version compatibility

### Database Connection Issues

1. Verify `DATABASE_URL` is set correctly
2. Check the PostgreSQL service is running
3. Ensure the database is linked to your web service

### Environment Variables Not Working

1. Variables must be set in the **web service**, not the database service
2. Redeploy after changing variables
3. `NEXT_PUBLIC_` variables require a rebuild

---

## Demo Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@busybeds.com | admin123 |
| Traveler | traveler@demo.com | demo123 |
| Hotel Owner | owner@grandriviera.com | owner123 |
| Hotel Manager | manager@grandriviera.com | manager123 |

> ⚠️ Change all demo passwords before going live.

---

## Cost Estimate (Railway)

| Resource | Est. Cost/Month |
|----------|-----------------|
| Web Service (1GB RAM) | ~$5 |
| PostgreSQL (1GB) | ~$5 |
| **Total** | ~$10/month |

Railway provides $5/month free credit, so your first month could be free or very low cost.

---

## Next Steps

1. ✅ Push the `railway.toml` file to GitHub
2. ✅ Create Railway project with PostgreSQL
3. ✅ Deploy from GitHub
4. ✅ Configure environment variables
5. ✅ Run database migrations
6. ✅ Update payment webhooks
7. ✅ Migrate data from Supabase (if needed)
8. ✅ Configure custom domain
9. ✅ Delete Vercel and Supabase projects (after verification)
