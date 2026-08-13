# BusyBeds — User Stories

**Version:** 1.0  
**Format:** Epic → Story → Acceptance Criteria

Priority: **P0** (MVP blocker) | **P1** (v1) | **P2** (post-v1)

---

## Epic 1: Authentication & Account

### US-1.1 Guest registration (P0)

**As a** traveler  
**I want to** create an account with email and password  
**So that** I can subscribe and access member benefits

**Acceptance criteria:**
- [ ] Email format validated; password min 8 chars with complexity rules
- [ ] Duplicate email returns clear error
- [ ] Verification email sent with expiring link (24h)
- [ ] Account cannot purchase membership until email verified

### US-1.2 Email verification (P0)

**As a** registered user  
**I want to** verify my email  
**So that** my account is trusted and I can subscribe

**Acceptance criteria:**
- [ ] Valid token marks `emailVerified`
- [ ] Expired/invalid token shows recovery path (resend)
- [ ] Redirect to membership selection after success

### US-1.3 Login / logout (P0)

**As a** user  
**I want to** securely log in and out  
**So that** I can access my portal safely

**Acceptance criteria:**
- [ ] HTTP-only secure session cookie
- [ ] Failed login rate limited
- [ ] Logout clears session

### US-1.4 Password reset (P1)

**As a** user  
**I want to** reset my password  
**So that** I can recover my account

**Acceptance criteria:**
- [ ] Reset email with single-use token
- [ ] Token expires in 1 hour
- [ ] Old sessions invalidated after reset

### US-1.5 RBAC enforcement (P0)

**As a** platform operator  
**I want** role-based access on all portals  
**So that** users only access authorized features

**Acceptance criteria:**
- [ ] API routes reject unauthorized roles with 403
- [ ] UI hides unavailable actions (defense in depth)
- [ ] Hotel staff scoped to their hotel only

---

## Epic 2: Guest Membership

### US-2.1 Browse membership plans (P0)

**As a** verified guest  
**I want to** compare membership tiers  
**So that** I choose the right plan

**Acceptance criteria:**
- [ ] Plans show price, interval, feature list
- [ ] Current plan highlighted if subscribed

### US-2.2 Subscribe to membership (P0)

**As a** verified guest  
**I want to** pay for a membership plan  
**So that** I unlock member rates

**Acceptance criteria:**
- [ ] Checkout via payment provider abstraction
- [ ] Webhook activates subscription on success
- [ ] Membership status visible in dashboard
- [ ] Confirmation email/SMS sent

### US-2.3 Manage subscription (P1)

**As a** member  
**I want to** view expiry, renew, upgrade, or cancel  
**So that** I control my membership

**Acceptance criteria:**
- [ ] Show current period end date
- [ ] Upgrade changes plan at next billing or prorated (provider-dependent)
- [ ] Cancel sets `cancelAtPeriodEnd`

### US-2.4 Membership gate (P0)

**As a** platform  
**I want** member rates and coupons blocked for non-members  
**So that** benefits are exclusive

**Acceptance criteria:**
- [ ] Expired/cancelled subscriptions cannot generate coupons
- [ ] Search shows rack rate only or blur member price with CTA

---

## Epic 3: Hotel Search & Discovery

### US-3.1 Search hotels (P0)

**As a** member  
**I want to** search hotels by location, category, amenities, and price  
**So that** I find suitable stays

**Acceptance criteria:**
- [ ] Filters: country, city, category, amenities, price range (member price)
- [ ] Only `APPROVED` hotels returned
- [ ] Results paginated; mobile-friendly cards

### US-3.2 View hotel detail with member savings (P0)

**As a** member  
**I want to** see rack vs. member price with savings  
**So that** I understand the value

**Acceptance criteria:**
- [ ] Display: Normal Price, Member Price, You Save ($ and %)
- [ ] Savings auto-calculated from rate engine for selected date
- [ ] Room types listed with photos and amenities
- [ ] Non-members see rack + subscribe CTA

### US-3.3 Date-aware pricing (P0)

**As a** member  
**I want** prices to reflect my selected check-in date  
**So that** seasonal/weekend rates are accurate

**Acceptance criteria:**
- [ ] Date picker updates displayed rates
- [ ] Correct season/weekend/holiday rule applied
- [ ] Shows which pricing context applies (optional tooltip)

---

## Epic 4: Hotel Onboarding (Hotel Owner)

### US-4.1 Register hotel (P0)

**As a** hotel owner  
**I want to** register my property  
**So that** I can join the BusyBeds network

**Acceptance criteria:**
- [ ] Hotel created in `DRAFT` status
- [ ] Required fields: name, country, city, description, contact
- [ ] Owner role assigned automatically

### US-4.2 Complete hotel profile (P0)

**As a** hotel owner  
**I want to** add photos, amenities, policies, and location  
**So that** guests trust and find my hotel

**Acceptance criteria:**
- [ ] Upload photos to R2 with progress indicator
- [ ] Amenities multi-select from predefined list + custom
- [ ] Map coordinates optional

### US-4.3 Add room types (P0)

**As a** hotel manager  
**I want to** define room types  
**So that** I can attach rates to each room category

**Acceptance criteria:**
- [ ] CRUD room types (name, description, occupancy, amenities)
- [ ] Deactivate without deleting if coupons exist

### US-4.4 Submit for approval (P0)

**As a** hotel owner  
**I want to** submit my hotel for BusyBeds review  
**So that** it can go live

**Acceptance criteria:**
- [ ] Validation: min 1 room type, min 1 approved rate pair, min 3 photos
- [ ] Status → `PENDING_APPROVAL`
- [ ] Admin notification triggered

### US-4.5 Manage hotel staff (P1)

**As a** hotel owner  
**I want to** invite reception and managers  
**So that** staff can verify coupons without owner access

**Acceptance criteria:**
- [ ] Invite by email with role selection
- [ ] Reception cannot access rate editing
- [ ] Owner can revoke staff access

---

## Epic 5: Rate Management

### US-5.1 Create rack and STO rates (P0)

**As a** hotel manager  
**I want to** set rack and STO rates per room type  
**So that** members see negotiated savings

**Acceptance criteria:**
- [ ] Both rates required per pricing period
- [ ] STO must be ≤ rack (warning if not)
- [ ] Currency matches hotel default

### US-5.2 Seasonal and date-based rates (P0)

**As a** hotel manager  
**I want to** set high/low season, weekend, and holiday rates  
**So that** pricing reflects my revenue strategy

**Acceptance criteria:**
- [ ] Date range picker for validity
- [ ] Context selector: default, high season, low season, weekend, holiday
- [ ] Holiday: specific date override
- [ ] No overlapping approved rules of same context (validation)

### US-5.3 Submit rates for approval (P0)

**As a** hotel manager  
**I want to** submit rate changes for BusyBeds approval  
**So that** published rates are verified

**Acceptance criteria:**
- [ ] Status → `PENDING_APPROVAL`
- [ ] Previous approved rates remain until new ones approved
- [ ] Rate history snapshot created on change

### US-5.4 Admin approve/reject rates (P0)

**As a** BusyBeds admin  
**I want to** review and approve STO agreements  
**So that** only valid rates are published

**Acceptance criteria:**
- [ ] Admin queue with hotel, room, rack, STO, discount %
- [ ] Reject requires reason sent to hotel
- [ ] Approve sets `APPROVED` and `approvedAt`

---

## Epic 6: Coupons & QR Redemption

### US-6.1 Generate coupon (P0)

**As a** member  
**I want to** generate a coupon for a room rate or benefit  
**So that** I can redeem it at the hotel

**Acceptance criteria:**
- [ ] Active membership required
- [ ] Unique code + QR generated
- [ ] Coupon shows hotel, room/benefit, member price, expiry
- [ ] Rate snapshot stored on coupon

### US-6.2 Coupon wallet (P0)

**As a** member  
**I want to** view active, used, and expired coupons  
**So that** I track my redemptions

**Acceptance criteria:**
- [ ] Tabs: Active | Used | Expired
- [ ] QR displayable full-screen for scanning

### US-6.3 Verify coupon at reception (P0)

**As a** reception staff  
**I want to** scan or enter a coupon code  
**So that** I confirm member validity quickly

**Acceptance criteria:**
- [ ] Camera QR scan on mobile browser
- [ ] Shows: member name, plan tier, room/benefit, savings, expiry
- [ ] Invalid/expired/used states clearly shown

### US-6.4 Redeem coupon (P0)

**As a** reception staff  
**I want to** mark a coupon as redeemed  
**So that** it cannot be reused

**Acceptance criteria:**
- [ ] Atomic redemption; double-redemption blocked
- [ ] Member receives confirmation notification
- [ ] Loyalty points awarded (if configured)
- [ ] Hotel collects payment directly (no BusyBeds payment flow)

---

## Epic 7: Benefits (Non-Rate)

### US-7.1 Hotel offers benefits (P1)

**As a** hotel manager  
**I want to** add benefits like free breakfast or late checkout  
**So that** members get extra value

**Acceptance criteria:**
- [ ] Benefit types from enum + custom title
- [ ] Optional tier gate (Gold+)
- [ ] Owner approval workflow for new benefits (configurable)

### US-7.2 Generate benefit coupon (P1)

**As a** member  
**I want to** claim a benefit coupon  
**So that** I use perks beyond room discounts

**Acceptance criteria:**
- [ ] Same coupon/QR flow as room rates
- [ ] Benefit details on coupon face

---

## Epic 8: Loyalty (BusyPoints)

### US-8.1 Earn points (P1)

**As a** member  
**I want to** earn BusyPoints from renewals, referrals, visits, and reviews  
**So that** I stay engaged

**Acceptance criteria:**
- [ ] Points ledger with reason and date
- [ ] Idempotent earning (no double points for same event)

### US-8.2 Refer friends (P1)

**As a** member  
**I want to** share a referral link  
**So that** I earn points when friends subscribe

**Acceptance criteria:**
- [ ] Unique referral code/link per user
- [ ] Points on qualified referral (verified + paid)

---

## Epic 9: Corporate Membership

### US-9.1 Corporate account setup (P1)

**As a** company admin  
**I want to** purchase corporate seats  
**So that** employees get memberships

**Acceptance criteria:**
- [ ] Seat limit enforced
- [ ] Invite employees by email
- [ ] Assign/revoke seats

### US-9.2 Corporate usage reports (P2)

**As a** corporate admin  
**I want to** see employee usage and redemptions  
**So that** I measure ROI

**Acceptance criteria:**
- [ ] Export CSV: employee, redemptions, active status
- [ ] Date range filter

---

## Epic 10: Admin Portal

### US-10.1 Approve hotels (P0)

**As a** BusyBeds admin  
**I want to** review and approve hotel applications  
**So that** only verified partners are listed

**Acceptance criteria:**
- [ ] Queue of `PENDING_APPROVAL` hotels
- [ ] Approve → `APPROVED`; Reject with reason → `REJECTED`

### US-10.2 Manage users and memberships (P1)

**As a** BusyBeds admin  
**I want to** search users, view subscriptions, and resolve issues  
**So that** I support customers

**Acceptance criteria:**
- [ ] Search by email/name
- [ ] Manual subscription status override (audit logged)

### US-10.3 Platform analytics (P1)

**As a** BusyBeds admin  
**I want** dashboards for revenue, growth, and redemptions  
**So that** I monitor business health

**Acceptance criteria:**
- [ ] MRR, active members by tier, new hotels, redemption volume
- [ ] Date range filters

---

## Epic 11: Notifications

### US-11.1 Transactional notifications (P1)

**As a** user  
**I want to** receive email/SMS for key events  
**So that** I stay informed

**Acceptance criteria:**
- [ ] Events: verify email, membership active, coupon created, redeemed
- [ ] Delivery logged; retry on failure

### US-11.2 Channel preferences (P2)

**As a** member  
**I want to** choose notification channels  
**So that** I control how I'm contacted

---

## Epic 12: Security & Compliance

### US-12.1 Audit trail (P1)

**As a** super admin  
**I want** all sensitive actions logged  
**So that** I can investigate incidents

**Acceptance criteria:**
- [ ] Logs: actor, action, resource, timestamp, IP
- [ ] Searchable in admin UI

### US-12.2 Rate limiting (P0)

**As a** platform  
**I want** API rate limits on auth and coupon verify  
**So that** abuse is prevented

---

## Epic 13: Hotel Analytics

### US-13.1 Hotel performance dashboard (P1)

**As a** hotel owner  
**I want to** see redemptions, popular rooms, and member visits  
**So that** I measure partnership ROI

**Acceptance criteria:**
- [ ] Charts: redemptions over time, top room types
- [ ] Compare to previous period

---

## Story Map Summary

| Phase | Epics |
|-------|-------|
| Phase 4–5 | Auth, Admin shell |
| Phase 6 | Hotel onboarding, rates |
| Phase 7 | Guest search, hotel detail |
| Phase 8 | Membership checkout |
| Phase 9 | Rate engine |
| Phase 10 | Coupons, QR, redemption |
| Phase 11 | Notifications |
| Phase 12 | Testing, loyalty, corporate, analytics polish |

**MVP (P0 stories):** ~35 stories across auth, membership gate, hotel onboarding, rates, search, coupons, admin approval, RBAC.
