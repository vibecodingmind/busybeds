# 🏨 Busy Beds — Web App

A subscription-based platform that lets travelers unlock and redeem real hotel discounts using verified QR coupons.

---

## Quick Start (5 minutes)

### Prerequisites
- [Node.js 18+](https://nodejs.org)
- npm (comes with Node.js)

### 1. Install dependencies
```bash
cd busybeds
npm install
```

### 2. Set up environment
```bash
cp .env.example .env.local
```
The defaults work out of the box for local development — no edits needed.

### 3. Set up the database
```bash
npm run db:push    # creates the SQLite database
npm run db:seed    # fills it with demo data
```

### 4. Start the app
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@busybeds.com | admin123 |
| Traveler (with active subscription) | traveler@demo.com | demo123 |
| Hotel Owner (KYC approved) | owner@grandriviera.com | owner123 |
| Hotel Manager | manager@grandriviera.com | manager123 |

---

## Pages & Features

| Page | URL | Description |
|------|-----|-------------|
| Home / Hotels | `/` | Browse all hotels, search, filter by city |
| Hotel Detail | `/hotels/[slug]` | Full hotel page with QR coupon button |
| Register | `/register` | Sign up as traveler or hotel owner |
| Login | `/login` | Sign in to any account |
| Subscribe | `/subscribe` | Choose a subscription plan |
| Dashboard | `/dashboard` | Traveler's subscription + coupon overview |
| My Coupons | `/coupons` | All coupons with QR codes |
| Hotel Portal | `/portal` | Staff coupon scanning interface |
| Admin Panel | `/admin` | Full platform management |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite (via Prisma) |
| ORM | Prisma |
| Auth | JWT (jose) + bcryptjs |
| QR Codes | qrcode |
| Validation | Zod |

---

## Upgrading to Production

### Switch to PostgreSQL
1. In `.env.local`, change `DATABASE_URL` to your Postgres URL
2. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`
3. Run `npm run db:push`

### Add Stripe Payments
1. Create a Stripe account and get your API keys
2. Add `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to `.env.local`
3. Update `/src/app/api/subscriptions/route.ts` to create a Stripe Checkout session instead of the mock subscription

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```
Set your environment variables in the Vercel dashboard.

---

## Project Structure

```
busybeds/
├── prisma/
│   ├── schema.prisma        # Full database schema
│   └── seed.ts              # Demo data seeder
├── src/
│   ├── app/
│   │   ├── page.tsx         # Hotel listing (home)
│   │   ├── hotels/[slug]/   # Hotel detail + coupon button
│   │   ├── login/           # Login page
│   │   ├── register/        # Registration page
│   │   ├── subscribe/       # Subscription selection
│   │   ├── dashboard/       # Traveler dashboard
│   │   ├── coupons/         # My coupons + QR codes
│   │   ├── portal/          # Hotel scanning portal
│   │   ├── admin/           # Admin panel
│   │   └── api/             # All API routes
│   ├── components/
│   │   └── Navbar.tsx
│   ├── lib/
│   │   ├── prisma.ts        # Database client
│   │   ├── auth.ts          # JWT helpers
│   │   └── qr.ts            # QR code generation
│   └── types/
│       └── index.ts
└── package.json
```

---

## Development Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run db:push      # Sync schema to database
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio (visual DB browser)
```

---

Built with ❤️ — Busy Beds v0.1.0
