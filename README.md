# BusyBeds

Africa's hotel membership network — exclusive negotiated hotel rates (STO) and verified member benefits.

## Quick start

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open http://localhost:3000

### Seed accounts

| Role | Email | Password |
|------|-------|----------|
| Super admin | `admin@busybeds.com` | `admin123!` |
| Hotel owner | `owner@zanzibar-resort.com` | `hotel123!` |

## End-to-end flow

1. **Register** → **Subscribe** (`/plans`) → **Search hotels** (`/hotels`)
2. **Request stay** (min 3 nights) on hotel detail
3. **Admin** confirms availability (`/admin/bookings`) → QR + 3-hour deposit window
4. Member pays hotel directly → hotel confirms deposit (`/hotel/bookings`)
5. **Verify** at reception (`/hotel/verify`) → **Redeem** → BusyPoints awarded

## Portals

| Path | Role |
|------|------|
| `/` | Marketing |
| `/app` | Member dashboard, wallet, membership |
| `/admin` | Platform ops — approvals, availability queue |
| `/hotel` | Hotel profile, rooms, rates, verify, bookings |
| `/plans` | Membership checkout |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run test` | Unit tests |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed demo data |

## Business rules (v1.2)

- QR issued **only after availability confirmed**
- **3-hour** full deposit window — paid **directly to hotel**
- Minimum stay **3 nights**; **one coupon per stay**
- Rack display controlled by BusyBeds; member rate from **STO**
- Max auto discount **25%** (above requires admin approval)

## Stack

Next.js 16 · TypeScript · Tailwind · shadcn/ui · Prisma · PostgreSQL · Auth.js · Stripe (optional)

## Docs

See `docs/BUSINESS_LOGIC_MASTER_SPECIFICATION.md` for authoritative business rules.
