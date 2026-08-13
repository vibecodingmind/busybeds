# BusyBeds

Africa's hotel membership network — exclusive negotiated hotel rates and member benefits for travelers; visibility and occupancy for partner hotels.

**BusyBeds is not an OTA.** Hotels manage availability, reservations, and guest payments. BusyBeds provides membership, rate transparency (rack vs. STO), and coupon/QR redemption.

## Status

**Phase 1 (Planning)** — requirements, architecture, and database design complete.

## Documentation

| Document | Description |
|----------|-------------|
| [Business Logic Master Spec](docs/BUSINESS_LOGIC_MASTER_SPECIFICATION.md) | **Authoritative** business model, flows, roles, exceptions — approve before code |
| [PRD](docs/PRD.md) | Product requirements, flows, scope |
| [Architecture](docs/ARCHITECTURE.md) | System design, stack, security |
| [Database Design](docs/DATABASE_DESIGN.md) | ERD, Prisma schema draft |
| [User Stories](docs/USER_STORIES.md) | Epics and acceptance criteria |
| [Roadmap](docs/ROADMAP.md) | Phased implementation plan |
| [UI/UX](docs/UI_UX.md) | Design guidelines and wireframes |

## Tech Stack (Planned)

- **Frontend:** Next.js, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend:** Next.js API routes, Prisma, PostgreSQL
- **Auth:** Auth.js, JWT, RBAC
- **Payments:** Stripe, Flutterwave, PesaPal (abstraction layer)
- **Storage:** Cloudflare R2

## Next Step

Phase 2: Project scaffold, Prisma schema, and local development environment.
