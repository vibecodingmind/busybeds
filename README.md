# BusyBeds

Africa's hotel membership network — exclusive negotiated hotel rates (STO) and verified member benefits.

## Quick start

### Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL) or a PostgreSQL connection string

### Setup

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate deploy   # or: npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Seed accounts

| Role | Email | Password |
|------|-------|----------|
| Super admin | `admin@busybeds.com` | `admin123!` |
| Hotel owner | `owner@zanzibar-resort.com` | `hotel123!` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run test` | Unit tests |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed plans + demo hotel |

## Business rules (v1.2)

- Membership unlocks STO member rates; rack display controlled by BusyBeds
- QR issued **only after availability confirmed** (admin ops in MVP)
- **3-hour** deposit window — full deposit paid **directly to hotel**
- Minimum stay: **3 nights**; one coupon per stay
- Max auto discount: **25%**

See `docs/BUSINESS_LOGIC_MASTER_SPECIFICATION.md` for full specification.

## Documentation

| Document | Description |
|----------|-------------|
| [Business Logic Master Spec](docs/BUSINESS_LOGIC_MASTER_SPECIFICATION.md) | Authoritative business model |
| [PRD](docs/PRD.md) | Product requirements |
| [Architecture](docs/ARCHITECTURE.md) | System design |
| [Database Design](docs/DATABASE_DESIGN.md) | ERD and schema notes |
| [Roadmap](docs/ROADMAP.md) | Phased implementation |

## Stack

Next.js 16 · TypeScript · Tailwind · shadcn/ui · Prisma · PostgreSQL · Auth.js
