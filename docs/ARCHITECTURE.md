# BusyBeds — System Architecture

**Version:** 1.0  
**Status:** Planning

---

## 1. Architecture Overview

BusyBeds follows a **modular monolith** on Next.js with clear domain boundaries, preparing for future service extraction (rate engine, notifications, payments) without premature microservices complexity.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Clients (Web — Mobile-first)                    │
│   Guest Portal │ Hotel Portal │ Corporate Portal │ Admin Portal         │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ HTTPS
┌───────────────────────────────────▼─────────────────────────────────────┐
│                    Next.js 15 (App Router) — TypeScript                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │   UI Layer  │  │ Server      │  │ API Routes  │  │ Middleware   │  │
│  │ shadcn/ui   │  │ Components  │  │ /api/*      │  │ Auth, RBAC   │  │
│  │ Tailwind    │  │ RSC + SSR   │  │             │  │ Rate limit   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────┘  │
│                              │                                          │
│  ┌───────────────────────────▼──────────────────────────────────────┐    │
│  │                    Domain / Service Layer                         │    │
│  │  auth │ hotels │ rates │ memberships │ coupons │ loyalty │ etc.  │    │
│  └───────────────────────────┬──────────────────────────────────────┘    │
│                              │                                          │
│  ┌───────────────────────────▼──────────────────────────────────────┐    │
│  │              Infrastructure (Repositories, Providers)             │    │
│  │  Prisma │ PaymentProvider │ NotificationProvider │ StorageProvider │    │
│  └───────────────────────────┬──────────────────────────────────────┘    │
└───────────────────────────────────┼──────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
   PostgreSQL              Cloudflare R2                 External APIs
   (Prisma)               (S3-compatible)            Stripe / Flutterwave /
                                                         PesaPal / SMS / Email
```

---

## 2. Technology Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js (latest, App Router) | Full-stack TS, RSC, API routes, strong ecosystem |
| Language | TypeScript (strict) | Type safety across stack |
| Styling | Tailwind CSS + shadcn/ui | Consistent design system, accessible components |
| Motion | Framer Motion | Polished UX for marketing and dashboards |
| ORM | Prisma | Schema migrations, type-safe queries |
| Database | PostgreSQL | Relational integrity for RBAC, rates, audit |
| Auth | Auth.js + JWT sessions | Industry standard; adapter for Prisma |
| Storage | Cloudflare R2 | Cost-effective S3-compatible asset storage |
| Hosting | Vercel / AWS (TBD) | Edge-friendly Next.js deployment |
| CI/CD | GitHub Actions | Test, lint, migrate, deploy |

---

## 3. Application Structure (Proposed)

```
busybeds/
├── app/
│   ├── (marketing)/          # Public site
│   ├── (auth)/               # login, register, verify
│   ├── (guest)/              # member dashboard, search, wallet
│   ├── (hotel)/              # hotel portal
│   ├── (corporate)/          # corporate portal
│   ├── (admin)/              # platform admin
│   └── api/                  # REST-style route handlers
├── components/
│   ├── ui/                   # shadcn
│   └── domains/              # hotel-card, rate-display, coupon-qr
├── lib/
│   ├── auth/                 # Auth.js config, RBAC helpers
│   ├── db/                   # Prisma client
│   ├── payments/             # PaymentProvider interface + adapters
│   ├── notifications/        # NotificationProvider interface
│   ├── storage/              # R2/S3 client
│   ├── rates/                # Rate resolution engine
│   ├── coupons/              # Generation, QR signing
│   └── security/             # Rate limit, CSRF, validation schemas
├── prisma/
│   └── schema.prisma
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/
```

**Clean architecture layering:**

- **Presentation:** React components, route handlers (thin)
- **Application:** Use-cases / services (`CreateCoupon`, `ApproveRate`)
- **Domain:** Entities, enums, business rules (discount calc, coupon validity)
- **Infrastructure:** Prisma repos, external providers

---

## 4. Multi-Tenancy Model

BusyBeds uses **organization-scoped tenancy**, not isolated databases.

| Organization type | Examples | Data isolation |
|-------------------|----------|----------------|
| `PLATFORM` | BusyBeds ops | Global |
| `HOTEL` | Partner property | `hotel_id` on all hotel resources |
| `CORPORATE` | Company account | `corporate_account_id` |

Users belong to the platform globally; **contextual roles** attach via `UserRoleAssignment` (user + org + role).

Query pattern: every hotel portal request resolves `hotelId` from session context and enforces in middleware/service layer.

---

## 5. Authentication & Sessions

### Auth.js configuration

- **Providers:** Credentials (email/password), optional OAuth (Google) later
- **Session strategy:** JWT in HTTP-only secure cookies (short-lived) + refresh rotation
- **Email verification:** Required before subscription activation

### Password security

- bcrypt or Argon2 hashing (min 12 rounds bcrypt)
- Password reset: time-limited signed tokens, single use

### Session payload (JWT claims)

```typescript
{
  userId: string;
  email: string;
  platformRole?: 'MEMBER' | 'BUSYBEDS_ADMIN' | 'SUPER_ADMIN';
  contexts: Array<{
    orgType: 'HOTEL' | 'CORPORATE';
    orgId: string;
    role: string;
  }>;
}
```

---

## 6. RBAC Design

### Permission model

- **Roles** are static enums per org type
- **Permissions** are granular strings: `hotel:rates:approve`, `coupon:verify`, etc.
- **RolePermission** maps roles → permissions (seeded, versioned)
- **Authorization** checked in middleware + service layer (never only UI)

### Role → permission matrix (abbreviated)

| Permission | Reception | Manager | Owner | Corp Admin | BB Admin | Super |
|------------|-----------|---------|-------|------------|----------|-------|
| coupon:verify | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| hotel:profile:edit | — | ✓ | ✓ | — | ✓ | ✓ |
| hotel:rates:create | — | ✓ | ✓ | — | ✓ | ✓ |
| hotel:rates:approve | — | — | ✓ | — | ✓ | ✓ |
| platform:rates:approve | — | — | — | — | ✓ | ✓ |
| platform:hotels:approve | — | — | — | — | ✓ | ✓ |
| corporate:seats:manage | — | — | — | ✓ | ✓ | ✓ |

Full matrix maintained in `lib/auth/permissions.ts` as source of truth.

---

## 7. Rate Engine Architecture

### Resolution algorithm (for a given `hotelId`, `roomTypeId`, `date`)

1. Fetch all `APPROVED` pricing rules where `valid_from <= date <= valid_to`
2. Filter by rule priority (holiday > weekend > season > default)
3. For each rule, resolve rack and STO amounts (paired or independent rules)
4. Return `{ rackAmount, stoAmount, currency, ruleId }` for audit
5. Compute display savings client + server (must match)

### Rule priority (highest wins)

```
HOLIDAY (explicit date) > WEEKEND > SEASON (HIGH/LOW) > DEFAULT
```

### Caching

- Redis optional phase 2: cache resolved rates per `(roomTypeId, date)` TTL 15min
- Invalidate on rate approval/archive

---

## 8. Coupon & QR Security

### Coupon creation

- `code`: cryptographically random, unique index
- `payload`: signed with server secret (HMAC-SHA256 or JWT)
- Bind to: `memberId`, `hotelId`, `roomTypeId` or `benefitId`, `rateSnapshotId`, `expiresAt`

### QR content

```
https://busybeds.com/v/{shortToken}
```
or embedded signed JWT scanned by hotel portal camera API.

### Verification flow

1. Decode + verify signature
2. Load coupon; check status, expiry, membership active
3. Optional: hotelId in token must match scanner's hotel context
4. Mark `USED` atomically (optimistic locking / unique constraint)

---

## 9. Payment Abstraction

```typescript
interface PaymentProvider {
  name: 'stripe' | 'flutterwave' | 'pesapal';
  createSubscriptionCheckout(params): Promise<CheckoutSession>;
  handleWebhook(payload, signature): Promise<WebhookResult>;
  cancelSubscription(subscriptionId): Promise<void>;
}
```

- **PaymentRouter** selects provider by currency/country/user preference
- Webhooks update `Subscription` status idempotently (`event_id` unique)
- No card data stored on BusyBeds servers

---

## 10. Notification Abstraction

```typescript
interface NotificationChannel {
  send(message: NotificationMessage): Promise<DeliveryResult>;
}

interface NotificationService {
  dispatch(event: NotificationEvent, recipient, channels[]): Promise<void>;
}
```

Events: `USER_VERIFIED`, `MEMBERSHIP_ACTIVATED`, `COUPON_CREATED`, `COUPON_REDEEMED`, `RATE_APPROVED`, etc.

Template engine: React Email or MJML for email; provider templates for SMS/WhatsApp.

---

## 11. Storage (R2)

- Hotel photos: `hotels/{hotelId}/photos/{uuid}.webp`
- User avatars: `users/{userId}/avatar.webp`
- Presigned upload URLs for browser direct upload
- Image optimization via Next.js Image + CDN

---

## 12. Security Architecture

| Threat | Control |
|--------|---------|
| SQL injection | Prisma parameterized queries |
| XSS | React escaping; CSP headers |
| CSRF | Auth.js CSRF; SameSite cookies |
| Brute force | Rate limiting (login, coupon verify) |
| IDOR | Org-scoped queries; authorization checks |
| Token theft | HTTP-only cookies; short JWT TTL |

### Audit logging

All sensitive actions write to `AuditLog`: actor, action, resource, IP, metadata JSON.

### Rate limiting

- `/api/auth/*`: 10 req/min per IP
- `/api/coupons/verify`: 30 req/min per hotel staff session

---

## 13. Observability

- Structured logging (pino)
- Error tracking (Sentry)
- Metrics: subscription events, redemption rate, API latency
- Health check: `/api/health`

---

## 14. Deployment Topology (Production)

```
                    ┌──────────────┐
                    │   CDN / R2   │
                    └──────┬───────┘
                           │
┌──────────┐    ┌──────────▼──────────┐    ┌─────────────┐
│  Users   │───▶│  Next.js (Vercel)   │───▶│ PostgreSQL  │
└──────────┘    │  + Edge Middleware  │    │ (RDS/Supa)  │
                └──────────┬──────────┘    └─────────────┘
                           │
                ┌──────────▼──────────┐
                │ Webhook endpoints   │
                │ Stripe/FLW/PesaPal  │
                └─────────────────────┘
```

Database migrations via Prisma migrate in CI before deploy.

---

## 15. Future Evolution (Post-v1)

- Mobile apps (React Native) sharing API
- PMS integrations (Opera, Cloudbeds)
- Rate engine as isolated service if compute grows
- Redis cache layer
- Read replicas for analytics
- Event bus (SQS/Kafka) for notifications and analytics
