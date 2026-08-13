# BusyBeds — Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** Planning  
**Last updated:** August 2026

---

## 1. Executive Summary

BusyBeds is Africa's hotel membership network connecting travelers with verified partner hotels through exclusive negotiated rates (STO) and member benefits. BusyBeds is **not** an OTA: it does not manage inventory, process room payments, or replace hotel booking systems. Hotels retain responsibility for availability, reservations, guest payments, and operations.

BusyBeds monetizes through **guest membership subscriptions** and delivers value through **rate transparency** (rack vs. member price), **coupon/QR redemption**, and **loyalty**.

**Target markets (initial):** East Africa (Kenya, Tanzania, Uganda, Rwanda), expandable across Africa.

---

## 2. Problem Statement

| Stakeholder | Problem | BusyBeds Solution |
|-------------|---------|-------------------|
| Travelers | Public hotel prices are high; opaque “member” deals are rare in Africa | Verified membership with visible rack vs. STO savings |
| Hotels | OTAs take high commissions; need direct guest relationships | Partner network bringing members at negotiated STO rates |
| BusyBeds | Need scalable recurring revenue | Tiered membership subscriptions |

---

## 3. Product Principles

1. **Membership-first** — Value is membership + benefits, not booking engine.
2. **Hotel sovereignty** — Hotels control inventory, payments, and operations.
3. **Transparent savings** — Always show rack, member price, savings amount, and discount %.
4. **Trust & verification** — QR/coupon verification at hotel; admin-approved hotels and rates.
5. **Africa-ready** — Mobile money, local payment gateways, SMS/WhatsApp, multi-currency.
6. **Scale by design** — Multi-tenant, RBAC, audit logs, provider abstractions.

---

## 4. Scope

### In scope (MVP → v1)

- Guest registration, email verification, membership purchase
- Hotel onboarding with admin approval
- Room types, rack/STO rate management with seasonal/date rules
- Rate approval workflow (hotel submit → admin approve)
- Hotel search and member-rate display with auto discount calculation
- Coupon generation, QR codes, hotel verification/redemption
- RBAC for all defined roles
- Admin portal (hotels, users, rates, content)
- Hotel portal (profile, rooms, rates, staff, reports)
- Guest portal (membership, search, coupon wallet)
- Payment abstraction (Stripe, Flutterwave, PesaPal)
- Notification abstraction (email, SMS, WhatsApp, push)
- BusyPoints loyalty (earn on renewals, referrals, visits, reviews)
- Corporate membership (assign seats to employees)
- Analytics dashboards (hotel + platform)

### Out of scope (explicit)

- Room inventory management / availability calendars
- Hotel PMS integration (phase 2+ consideration)
- Processing guest room payments
- OTA-style booking confirmation flows
- Channel manager connectivity

---

## 5. User Roles & Permissions (Summary)

| Role | Scope | Key capabilities |
|------|-------|------------------|
| Guest / Member | Platform | Subscribe, search, view rates, coupons, loyalty, referrals |
| Hotel Reception | Hotel | Verify coupons/QR, confirm membership, redeem benefits |
| Hotel Manager | Hotel | Profile, rooms, offers, staff, reports (no finance delete) |
| Hotel Owner | Hotel | Full hotel access, analytics, approve offers, manage managers |
| Corporate Admin | Corporate org | Employee seats, assign memberships, usage reports |
| BusyBeds Admin | Platform | Approve hotels, manage users, STO rates, content, analytics |
| Super Admin | Platform | Admins, integrations, security configuration |

Detailed permissions matrix in `ARCHITECTURE.md` § RBAC.

---

## 6. Core User Flows

### 6.1 Member registration

```
Register → Verify email → Choose plan → Pay → Membership active → Access benefits
```

**Acceptance criteria:**
- Email verification required before payment
- Membership status gates member-rate visibility and coupon generation
- Payment failure does not activate membership
- Welcome notification sent on activation

### 6.2 Hotel registration

```
Register → Submit hotel → Photos → Rooms → STO rates → Admin review → Approved → Live
```

**Acceptance criteria:**
- Hotel not searchable until approved
- Rates not public until approved
- Owner can invite managers/reception staff

### 6.3 Rate management

```
Create room type → Rack rate → STO rate → Valid dates/season → Submit → Admin approve → Published
```

**Acceptance criteria:**
- Support multiple room types per hotel
- Seasonal, weekend, holiday overrides
- Rate history retained (no silent overwrite)
- Discount auto-calculated at display time

### 6.4 Member uses benefit

```
Search → View member price → Select room/benefit → Generate coupon + QR → Visit hotel →
Reception scans → Verify membership → Redeem → Hotel collects payment directly
```

**Acceptance criteria:**
- Coupon is single-use (configurable per benefit type)
- QR encodes signed token, not raw PII
- Redemption logged with timestamp, staff user, hotel
- Expired/invalid membership blocks redemption

---

## 7. Pricing & Rate Engine Requirements

### 7.1 Rate types

| Type | Definition | Visibility |
|------|------------|------------|
| Rack Rate | Hotel public selling price | Shown as “Normal Price” |
| STO Rate | Negotiated confidential partner rate | Shown as “BusyBeds Member Price” |

### 7.2 Display formula

```
savings_amount = rack_rate - sto_rate
discount_percent = round((savings_amount / rack_rate) * 100, 1)
```

Guard: if `rack_rate <= 0`, do not show discount %.

### 7.3 Pricing dimensions

- Multiple room types per hotel
- Date validity (`valid_from`, `valid_to`)
- Season labels: high season, low season
- Weekend pricing rules
- Holiday pricing (linked to holiday calendar or explicit dates)
- Membership tier eligibility (e.g., Gold-only rates — optional v1.1)
- Currency per hotel (default + display conversion optional later)

### 7.4 Approval workflow

States: `DRAFT` → `PENDING_APPROVAL` → `APPROVED` → `ARCHIVED`  
Rejected rates return to `DRAFT` with reason.

Only `APPROVED` rates with valid dates are used for member display and coupon face value.

---

## 8. Membership Plans

| Tier | Example positioning | Typical entitlements |
|------|---------------------|----------------------|
| Bronze | Entry | Basic discounts, limited hotel set |
| Silver | Standard | More hotels, more benefits |
| Gold | Premium | Premium hotels, better STO access |
| Platinum | VIP | Top benefits, upgrades, packages |
| Corporate | B2B | Seat-based, admin dashboard, reporting |

**Subscription lifecycle:** active, past_due, cancelled, expired, trialing (optional).

**Renewal:** auto-renew where supported by payment provider; grace period configurable.

---

## 9. Benefits & Coupons

### Benefit types (non-rate)

- Free breakfast, late checkout, spa/restaurant discounts, airport transfer, room upgrade, packages

### Coupon system

- Secure unique code (e.g., `BB-XXXX-XXXX`)
- QR code with signed JWT or HMAC payload: `couponId`, `hotelId`, `expiresAt`
- States: `ACTIVE`, `USED`, `EXPIRED`, `REVOKED`
- Wallet: active / used / expired tabs

---

## 10. Loyalty — BusyPoints

| Event | Points (configurable) |
|-------|----------------------|
| Membership renewal | X |
| Referral (qualified signup) | Y |
| Hotel visit (coupon redeemed) | Z |
| Review submitted | W |

Points balance, history, and redemption rules (future: discounts on renewal) stored in loyalty module.

---

## 11. Notifications

| Channel | Use cases |
|---------|-----------|
| Email | Verification, welcome, renewal, coupon generated |
| SMS | OTP, coupon code backup, redemption confirm |
| WhatsApp | Marketing opt-in, coupon delivery |
| Push | Mobile web / future app |

Provider-agnostic interface; failures retried with dead-letter logging.

---

## 12. Analytics

### Hotel dashboard

- Member visits / redemptions
- Popular room types / benefits
- Period comparison

### Platform admin

- MRR / subscription revenue
- Active members by tier
- Hotel growth, approval pipeline
- Redemption volume by region

---

## 13. Non-Functional Requirements

| Area | Requirement |
|------|-------------|
| Performance | Search P95 < 500ms; coupon verify < 200ms |
| Availability | 99.9% target for core paths |
| Security | OWASP top 10; RBAC; audit logs; rate limiting |
| Compliance | GDPR-ready data export/delete; PCI via payment providers |
| Localization | English first; Swahili phase 2; multi-currency display |
| Mobile | Responsive-first; QR scanning works on mobile browsers |

---

## 14. Success Metrics (KPIs)

- Active paying members
- Monthly recurring revenue (MRR)
- Approved partner hotels
- Coupon generation → redemption rate
- Average savings displayed per search session
- Hotel churn / NPS

---

## 15. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Hotels publish inflated rack rates | Admin review; rack/STO ratio alerts |
| Coupon fraud / sharing | Signed QR, short TTL, membership binding |
| Payment fragmentation in Africa | Multi-gateway abstraction from day one |
| Scope creep into OTA | PRD boundaries; no inventory/booking modules |

---

## 16. Open Questions (for stakeholder sign-off)

1. Default coupon validity window (e.g., 24h vs. 7 days)?
2. Corporate billing: invoice vs. card per seat?
3. Minimum membership tier for STO visibility per hotel?
4. Initial currency set (USD + KES + TZS)?
5. WhatsApp Business API provider preference?
6. Hotel contract: exclusivity requirements?

---

## Appendix: Glossary

- **Rack Rate** — Public standard room price
- **STO Rate** — Special Tour Operator / partner negotiated rate
- **OTA** — Online Travel Agency (BusyBeds is not one)
- **Redemption** — Hotel confirms coupon/benefit used at property
