# BUSYBEDS BUSINESS LOGIC MASTER SPECIFICATION

**Version:** 1.0  
**Status:** Awaiting stakeholder approval — **no implementation until approved**  
**Last updated:** August 2026

---

## Document Purpose

This specification defines how BusyBeds works as a **hotel membership network** — not a coupon app, not an OTA. It is the authoritative business-logic reference for engineering, product, and operations.

**Core product:** Membership that unlocks access to negotiated hotel rates and benefits.  
**Verification mechanism:** Coupon + QR code proving entitlement to a specific offer.

---

## 1. Understanding of BusyBeds

BusyBeds sits between three parties:

```
Members (travelers)  ←——  BusyBeds (membership platform)  ——→  Partner Hotels
```

- **Members** pay BusyBeds a recurring subscription. Active membership unlocks the network.
- **BusyBeds** negotiates STO (Special Tour Operator) rates and benefits with hotels, approves commercial terms, and verifies member entitlements at redemption.
- **Hotels** gain members as customers, control availability, handle reservations, collect room payments directly, and honor agreed rates/benefits when a valid entitlement is verified.

BusyBeds does **not** own inventory, replace hotel PMS, process room payments in MVP, or guarantee room availability. A valid coupon means: *"This member is entitled to this agreed offer, subject to hotel availability and conditions."* It does **not** mean: *"A room is reserved."*

---

## 2. Business Model

| Revenue | Who pays | What they get |
|---------|----------|---------------|
| Membership subscription | Member → BusyBeds | Access to network, member rates, benefits, loyalty |
| Room payment (MVP) | Member → Hotel | Actual stay/service at agreed STO-based price |
| Hotel partnership | Hotel → BusyBeds (future: listing fee / rev share — **not defined in MVP**) | Visibility, member traffic, occupancy |

**Value exchange:**

- **Member:** Transparent savings (rack vs. member rate) + benefits
- **Hotel:** Pre-qualified guests at negotiated rates without OTA commission on the membership channel
- **BusyBeds:** Recurring membership revenue + redemption/usage data

---

## 3. Rack Rate Model

### Definition

The hotel's **normal public/reference selling price** for a specific room type (or benefit context) during a defined validity period.

### Properties

| Property | Description |
|----------|-------------|
| Attached to | Room type (or benefit package) |
| Purpose | Reference price for savings communication |
| Source | Hotel submits; BusyBeds admin reviews |
| Not | The price BusyBeds collects from the member for the room |

### Rules

1. Rack rate must exist alongside STO rate for the same offer context and validity window before rates can be approved.
2. Rack rate is shown to members as **"Normal Rate"** — never hidden when showing member pricing.
3. Rack rate changes follow the rate approval workflow; historical rack values are retained for audit and issued entitlements/coupons.

### Example

```
Hotel: Zanzibar Beach Resort
Room: Deluxe Ocean Room
Rack Rate: $200/night
Valid: 01 Jun – 30 Sep 2026
```

---

## 4. STO Rate Model

### Definition

**Special Tour Operator Rate** — the confidential, negotiated partner rate agreed between the hotel and BusyBeds as part of a commercial relationship.

### Properties

| Property | Description |
|----------|-------------|
| Nature | Negotiated commercial agreement, not arbitrary discount |
| Approval | Hotel submits → BusyBeds admin approves |
| Relationship | Paired with rack rate for same room/context/dates |
| Visibility | Member-facing as basis for "BusyBeds Member Rate" |

### Commercial workflow

```
Hotel negotiates with BusyBeds
    → Agrees STO terms
    → Hotel records rack + STO in portal
    → Submits for approval
    → BusyBeds admin reviews commercial terms
    → Approved rates become eligible for member entitlements
```

### Rules

1. STO ≤ Rack (system warns if STO > Rack; admin may reject).
2. Hotels should not inflate rack to manufacture fake savings (admin review + ratio alerts).
3. Unapproved STO rates are never used for member display or entitlement generation.
4. STO rate alone is never shown without rack context.

---

## 5. Member Rate Calculation

### Definition

**BusyBeds Member Rate** = the price an **eligible active member** receives for a specific offer, normally equal to the **approved STO rate** for the resolved pricing context and date.

Member Rate is a **derived presentation and entitlement value**, not a separate negotiated entity stored independently of STO (unless future tier modifiers apply).

### Savings calculation (automatic)

```text
Discount Amount (Saving) = Rack Rate − STO Rate (Member Rate)

Discount Percentage = ((Rack Rate − STO Rate) / Rack Rate) × 100
```

### Example

```text
Rack Rate     = $200
STO Rate      = $120  → Member Rate = $120
Saving        = $80
Discount      = 40%
```

### Display requirement (mandatory)

```text
Deluxe Ocean Room

Normal Rate              $200/night
BusyBeds Member Rate     $120/night
You Save                 $80/night
                         40% OFF
```

### Edge cases

| Case | Handling |
|------|----------|
| Rack = 0 or missing | Do not show discount %; block entitlement until rack exists |
| STO = Rack | Show member rate; savings = $0; still valid commercial terms |
| Tier-specific member rates | **ASSUMPTION:** Gold may access rates Bronze cannot — tier gate on offer eligibility (see § Ambiguities) |
| Currency | Member rate displayed in hotel's rate currency |

---

## 6. Membership Flow

### Preconditions

- User has registered account
- Email verified (recommended gate before payment)

### Workflow

| Step | Actor | Action | System Response | Next Step |
|------|-------|--------|-----------------|-----------|
| 1 | Visitor | Browses marketing site | Shows plans, value prop | Register or login |
| 2 | Visitor | Creates account | Account created, verification email sent | Verify email |
| 3 | Visitor | Verifies email | `emailVerified` set | Choose plan |
| 4 | Member (pending) | Selects membership tier | Shows price, features, billing interval | Proceed to payment |
| 5 | Member | Pays BusyBeds (Stripe/FLW/PesaPal) | Payment provider processes | Await webhook |
| 6 | System | Receives payment success webhook | Creates/activates `Subscription` (ACTIVE), sets period dates | Send confirmation |
| 7 | System | Sends notification | Email/SMS: membership active | Member accesses network |
| 8 | Member | Searches hotels / views rates | Member rates visible; non-members see gate | Discovery flow |

### Membership states

| Status | Can view member rates? | Can generate entitlement/coupon? |
|--------|------------------------|----------------------------------|
| ACTIVE | Yes (if tier eligible) | Yes |
| TRIALING | Yes (if configured) | Yes |
| PAST_DUE | **ASSUMPTION:** Grace period — yes for N days, then no | Per grace policy |
| CANCELLED (period end pending) | Yes until period end | Yes until period end |
| EXPIRED | No | No |

### Payment failure

| Actor | Action | System Response | Next Step |
|-------|--------|-----------------|-----------|
| Member | Payment fails at checkout | Show error; no subscription created | Retry payment |
| System | Renewal payment fails | Subscription → PAST_DUE; notify member | Retry / update payment method |

**Critical rule:** BusyBeds membership payment is **separate** from hotel room payment. Membership money flows Member → BusyBeds only.

---

## 7. Hotel Onboarding Flow

| Step | Actor | Action | System Response | Next Step |
|------|-------|--------|-----------------|-----------|
| 1 | Hotel Owner | Registers / creates hotel account | User + Hotel org in DRAFT | Complete profile |
| 2 | Hotel Owner | Submits hotel information (name, location, description, policies) | Data saved; validation errors if incomplete | Add media |
| 3 | Hotel Owner | Uploads photos | Images stored (R2); linked to hotel | Add amenities |
| 4 | Hotel Owner | Selects amenities | Amenities saved | Add room types |
| 5 | Hotel Manager/Owner | Creates room types | Room types in DRAFT | Add rates |
| 6 | Hotel Manager | Enters rack + STO rates per room type | Rate rules created in DRAFT | Set validity/conditions |
| 7 | Hotel Manager | Sets validity (dates, season, restrictions) | Pricing rules configured | Submit rates |
| 8 | Hotel Manager | Submits rates for approval | Rates → PENDING_APPROVAL | Admin review |
| 9 | Hotel Owner | Submits hotel for approval | Hotel → PENDING_APPROVAL (if complete) | Admin review |
| 10 | BusyBeds Admin | Reviews hotel + commercial terms | Admin queue UI | Approve or reject |
| 11a | BusyBeds Admin | Approves hotel | Hotel → APPROVED | Approve rates |
| 11b | BusyBeds Admin | Rejects hotel | Hotel → REJECTED; reason recorded | Owner revises |
| 12 | BusyBeds Admin | Approves rates | Rates → APPROVED; history snapshot | Hotel can go live |
| 13 | System | Hotel meets all gates | Hotel searchable if APPROVED + has approved rates | Members discover |

### Go-live gates (all required)

- [ ] Hotel status = APPROVED
- [ ] Minimum profile completeness (photos, amenities, location)
- [ ] At least one room type
- [ ] At least one approved rack + STO pair with valid dates
- [ ] Owner account active

**Hotel does not appear to members until approved.**

---

## 8. Hotel Rate Approval Flow

| Step | Actor | Action | System Response | Next Step |
|------|-------|--------|-----------------|-----------|
| 1 | Hotel Manager | Creates/edits pricing rule (rack or STO) | DRAFT rule saved | Pair with counterpart rate |
| 2 | Hotel Manager | Submits rate package | Status → PENDING_APPROVAL; `submittedAt` set | Notify admin |
| 3 | BusyBeds Admin | Opens rate review queue | Shows hotel, room, rack, STO, discount %, validity | Review |
| 4a | Admin | Approves | APPROVED; `approvedAt`, `approvedBy`; history snapshot | Rates live for resolution |
| 4b | Admin | Rejects | REJECTED; reason sent to hotel | Manager revises → DRAFT |
| 5 | Hotel Manager | Views rejection | Notification + reason in portal | Edit and resubmit |
| 6 | System | Approved rate archived later | Old rule → ARCHIVED; new rule takes precedence per date | Ongoing |

### Admin review checks

- Rack and STO both present for same context/dates
- STO ≤ Rack
- Discount % within policy thresholds (**ASSUMPTION:** flag if > 60%)
- Validity dates logical (start ≤ end)
- No conflicting APPROVED rules for same room/context overlap

---

## 9. Hotel Discovery Flow

| Step | Actor | Action | System Response | Next Step |
|------|-------|--------|-----------------|-----------|
| 1 | Member | Opens search | Search UI with filters | Enter criteria |
| 2 | Member | Filters (country, city, category, amenities, price) | Returns APPROVED hotels only | Browse results |
| 3 | Member | Selects check-in/stay date (optional) | Rate engine resolves prices for date | View hotel |
| 4 | Member | Opens hotel detail | Profile, photos, amenities, room list | View room |
| 5 | System | Resolves rates for date + room | Returns rack, member rate, savings | Display value prop |
| 6 | Member | Views room pricing | Mandatory three-part display | Unlock offer |
| 7 | Non-member | Views hotel | Rack visible; member rate gated/blurred + subscribe CTA | Register/subscribe |

### Search price filter

Uses resolved **member rate** (STO) for the selected date context, not rack.

---

## 10. Member Entitlement Flow

### Definition

An **entitlement** is the system's record that a specific member has the **right** to use a specific commercial offer, bound to:

```text
Member ID + Hotel ID + Offer ID + Rate snapshot + Usage/stay context + Validity
```

The entitlement exists **before** the coupon. The coupon is the digital authorization artifact for that entitlement.

### Workflow

| Step | Actor | Action | System Response | Next Step |
|------|-------|--------|-----------------|-----------|
| 1 | Member | Selects room offer or benefit on hotel detail | System checks eligibility | Validate |
| 2 | System | Validates membership ACTIVE | Pass or block with CTA | Validate offer |
| 3 | System | Validates tier eligibility for offer | Pass or "upgrade required" | Validate rate |
| 4 | System | Resolves rack + STO for selected date | Rate snapshot captured | Validate offer validity |
| 5 | System | Checks offer validity window + conditions | Pass or show reason | Create entitlement |
| 6 | System | Creates `Entitlement` record | Status: AVAILABLE; binds all IDs + rate snapshot + stay/usage date | Member confirms |
| 7 | Member | Confirms activation ("Get Member Rate" / "Claim Benefit") | Entitlement → ACTIVATED | Generate coupon |
| 8 | System | Generates coupon linked to entitlement | Coupon + QR created; timeline event | Member wallet |

### Entitlement record (conceptual)

```text
entitlementId
memberId
hotelId
offerId          (room type ID or benefit ID)
offerType        (ROOM_RATE | BENEFIT)
stoRateId        (approved pricing rule reference)
rackSnapshot     (amount at activation time)
stoSnapshot      (amount at activation time)
usageDate        (intended stay or benefit use date)
validFrom
validUntil
membershipId     (subscription at activation)
status           (AVAILABLE → ACTIVATED → …)
```

### Rules

1. Do not generate generic coupons detached from entitlement.
2. Rate snapshot on entitlement protects member if rates change after activation (**ASSUMPTION:** honored at hotel per commercial agreement).
3. One entitlement may map to one coupon (1:1 in MVP).

---

## 11. Coupon Flow

### Definition

A **coupon** is the unique digital authorization proving entitlement. It is **not** the product; it is the verification token.

### Generation (after entitlement ACTIVATED)

| Step | Actor | Action | System Response | Next Step |
|------|-------|--------|-----------------|-----------|
| 1 | System | Generates unique code (e.g. BB-8X7K29) | Code stored; indexed unique | Sign token |
| 2 | System | Creates signed QR reference | HMAC/JWT with couponId, hotelId, exp — no PII in QR | Persist coupon |
| 3 | System | Links coupon to entitlement | 1:1 relationship | Notify member |
| 4 | System | Sends notification | Email/SMS with code + link | Member wallet |

### Coupon face (member view)

```text
BUSYBEDS COUPON
Code: BB-8X7K29
Hotel: Zanzibar Beach Resort
Offer: Deluxe Ocean Room
Normal Rate: $200
Member Rate: $120
Valid Until: 30 September
Status: ACTIVE
[QR CODE]
```

### Coupon lifecycle states

```text
AVAILABLE      (entitlement created, not yet activated by member)
     ↓
ACTIVATED      (member confirmed; coupon issued)
     ↓
RESERVED/PENDING (optional — hotel acknowledged intent; **ASSUMPTION:** MVP may skip)
     ↓
VERIFIED       (staff validated coupon + membership at desk)
     ↓
REDEEMED       (benefit actually provided; terminal success)

Terminal alternatives:
  EXPIRED | CANCELLED | REJECTED
```

Every transition → immutable timeline event (actor, timestamp, metadata).

### Rules

1. Coupon does not imply reservation.
2. Coupon does not imply BusyBeds collected room payment.
3. Single-use at REDEEMED (**ASSUMPTION:** unless benefit type allows multi-use — not MVP).

---

## 12. QR Verification Flow

| Step | Actor | Action | System Response | Next Step |
|------|-------|--------|-----------------|-----------|
| 1 | Reception | Opens "Verify BusyBeds Member" | Scanner + manual code entry | Scan or type |
| 2 | Reception | Scans QR or enters BB-XXXXXX | Decode + lookup coupon | Validate chain |
| 3 | System | Verify signature / code exists | Load coupon + entitlement + member | Check 1–8 below |
| 4 | System | Run verification checks | Pass → VERIFIED preview; Fail → reason code | Staff action |
| 5 | Reception | Reviews member/offer/rates on screen | Display verification panel | Confirm or reject |
| 6a | Reception | Confirms verification | Coupon → VERIFIED; timeline event | Guest pays hotel |
| 6b | Reception | Rejects (fraud/invalid) | Coupon → REJECTED; reason logged | Guest resolved offline |

### Verification checks (all at scan time)

| # | Check | Fail response |
|---|-------|---------------|
| 1 | Coupon exists and signature valid | "Invalid code" |
| 2 | Membership active at verification time | "Membership expired" |
| 3 | Coupon not expired | "Coupon expired" |
| 4 | Coupon belongs to this hotel | "Wrong hotel" |
| 5 | Offer still valid | "Offer no longer available" |
| 6 | Rate valid for requested/stay date | "Rate not valid for this date" |
| 7 | Coupon not already REDEEMED/REJECTED | "Already used" |
| 8 | Staff has `coupon:verify` permission | 403 Forbidden |

### QR security

- QR contains **verification reference token**, not member PII or payment data
- Token is signed, time-bound, revocable

### Verification display (staff UI)

```text
MEMBER VERIFIED ✓
Member: John Doe
Hotel: Zanzibar Beach Resort
Offer: Deluxe Ocean Room
Normal Rate: $200
BusyBeds Rate: $120
Member Saving: $80
Status: VALID
[Complete Redemption] (after stay/service)
```

**Note:** VERIFIED ≠ REDEEMED. Verification confirms entitlement; redemption confirms benefit delivered.

---

## 13. Hotel Availability Flow

| Step | Actor | Action | System Response | Next Step |
|------|-------|--------|-----------------|-----------|
| 1 | Member | Wants Deluxe Room at member rate $120 | Has valid coupon/entitlement | Contact hotel |
| 2 | Member | Contacts hotel (phone, email, walk-in) | Outside BusyBeds booking engine in MVP | Hotel checks PMS |
| 3 | Hotel | Checks own availability | No BusyBeds inventory query in MVP | Respond |
| 4a | Hotel | Confirms availability | Proceed with verification flow | Member presents coupon |
| 4b | Hotel | No availability | "No rooms for those dates" | Member cannot stay; coupon may remain unused or expire |

### Rules

1. Valid coupon **does not override** hotel availability.
2. BusyBeds does not guarantee a room in MVP.
3. **ASSUMPTION:** Unused coupon due to no availability may be cancelled by member or expire naturally — policy TBD.

### Future (explicitly out of MVP)

- Availability inquiry API
- PMS integration
- In-platform reservation hold → RESERVED/PENDING state

---

## 14. Hotel Payment Flow

### Rule (non-negotiable for MVP)

```text
MEMBER pays HOTEL directly for the room/service at the agreed member rate.

NOT: MEMBER → BUSYBEDS → HOTEL
```

### Workflow

| Step | Actor | Action | System Response | Next Step |
|------|-------|--------|-----------------|-----------|
| 1 | Member | Presents verified coupon at check-in | Staff has confirmed VERIFIED | Hotel quotes $120 |
| 2 | Member | Pays hotel (cash, card, mobile money at hotel) | Hotel processes payment on their systems | Hotel provides room |
| 3 | Hotel | Records payment internally | No BusyBeds payment record for room in MVP | Redemption |
| 4 | System | (Optional future) Hotel confirms amount collected | Analytics only | Reporting |

### What BusyBeds records

- Entitlement created
- Coupon verified
- Coupon redeemed
- **Not** room payment amount (unless hotel voluntarily reports for analytics — future)

### Example

```text
Rack Rate:  $200
STO Rate:   $120
Member pays hotel: $120
BusyBeds membership fee: separate prior payment to BusyBeds
```

---

## 15. Redemption Flow

| Step | Actor | Action | System Response | Next Step |
|------|-------|--------|-----------------|-----------|
| 1 | Reception | Guest checked in / benefit provided | Coupon in VERIFIED (or ACTIVATED if verify+redeem combined) | Redeem |
| 2 | Reception | Clicks "Complete Redemption" | Confirm dialog with summary | Confirm |
| 3 | System | Atomic update: status → REDEEMED | Timeline event; `redeemedAt`, staffId | Notify |
| 4 | System | Awards BusyPoints (if configured) | Loyalty transaction | Analytics |
| 5 | System | Notifies member | "Benefit redeemed at [Hotel]" | Closed |

### Redemption record

```text
Member: John Doe
Hotel: Zanzibar Beach Resort
Room: Deluxe Ocean Room
Rack Rate: $200
STO Rate: $120
Saving: $80
Coupon: BB-8X7K29
Status: REDEEMED
Redeemed by: Staff ID
Timestamp: ...
```

### Rules

1. Coupon cannot be reused after REDEEMED.
2. Redemption requires prior verification (**ASSUMPTION:** or single-step verify+redeem for simple UX — configurable per hotel tier).
3. Redemption is proof of **benefit delivery**, not payment confirmation.

---

## 16. User Roles

| Role | Scope | Primary purpose |
|------|-------|-----------------|
| **Guest / Member** | Platform | Subscribe, discover, activate entitlements, hold coupons |
| **Hotel Reception** | Hotel | Verify QR/code, confirm verification, redeem |
| **Hotel Manager** | Hotel | Profile, rooms, offers, rates (submit), staff, reports |
| **Hotel Owner** | Hotel | Full hotel control, commercial submission, analytics, managers |
| **Corporate Admin** | Corporate org | Seat management, employee memberships, usage reports |
| **BusyBeds Admin** | Platform | Approve hotels/rates, members, disputes, content, analytics |
| **Super Admin** | Platform | Admins, integrations, security, system config, audit |

---

## 17. Permissions by Role

### Platform roles

| Permission | Member | BB Admin | Super Admin |
|------------|--------|----------|-------------|
| `membership:subscribe` | ✓ | — | ✓ |
| `hotel:search` | ✓ | ✓ | ✓ |
| `rate:view_member` | ✓ (active) | ✓ | ✓ |
| `entitlement:create` | ✓ (active) | — | ✓ |
| `coupon:view_own` | ✓ | — | ✓ |
| `platform:hotels:approve` | — | ✓ | ✓ |
| `platform:rates:approve` | — | ✓ | ✓ |
| `platform:members:manage` | — | ✓ | ✓ |
| `platform:disputes:manage` | — | ✓ | ✓ |
| `platform:analytics:view` | — | ✓ | ✓ |
| `platform:admins:manage` | — | — | ✓ |
| `platform:integrations:manage` | — | — | ✓ |
| `platform:security:configure` | — | — | ✓ |
| `audit:view` | — | ✓ | ✓ |

### Hotel roles

| Permission | Reception | Manager | Owner |
|------------|-----------|---------|-------|
| `coupon:verify` | ✓ | ✓ | ✓ |
| `coupon:redeem` | ✓ | ✓ | ✓ |
| `hotel:profile:view` | ✓ | ✓ | ✓ |
| `hotel:profile:edit` | — | ✓ | ✓ |
| `hotel:rooms:manage` | — | ✓ | ✓ |
| `hotel:rates:view` | — | ✓ | ✓ |
| `hotel:rates:create` | — | ✓ | ✓ |
| `hotel:rates:submit` | — | ✓ | ✓ |
| `hotel:rates:approve` | — | — | ✓ |
| `hotel:benefits:manage` | — | ✓ | ✓ |
| `hotel:staff:manage` | — | — | ✓ |
| `hotel:reports:view` | — | ✓ | ✓ |
| `hotel:analytics:view` | — | ✓ | ✓ |
| `hotel:finances:delete` | — | — | — |

Reception **cannot** change pricing, delete hotel data, or manage finances.

### Corporate roles

| Permission | Corp Admin |
|------------|------------|
| `corporate:seats:manage` | ✓ |
| `corporate:employees:invite` | ✓ |
| `corporate:usage:view` | ✓ |
| `corporate:billing:view` | ✓ |

---

## 18. Exception Cases

| Scenario | Expected behavior |
|----------|-------------------|
| Member expires mid-stay | Verification at check-in used active status at verify time; renewal does not retroactively validate old coupons |
| Rate approved after coupon issued | Coupon uses rate **snapshot** at entitlement activation |
| Hotel suspended while coupon active | Verification fails: "Hotel not active"; member support path |
| Member activates offer for wrong date | Rate validity check fails at verification if stay date outside rule |
| Double scan same coupon | Second verify: "Already used" if REDEEMED; idempotent if already VERIFIED |
| Staff scans at wrong hotel | "Coupon not valid for this hotel" |
| Network offline at hotel | **ASSUMPTION:** Offline verify not in MVP; manual code lookup requires connectivity |
| Benefit vs room rate coupon | Same lifecycle; `offerType` distinguishes display and conditions |

---

## 19. Fraud Scenarios

| Threat | Mitigation |
|--------|------------|
| Screenshot sharing of QR | Short TTL; bind to member; verify membership live at scan; single redemption |
| Fake rack / inflated savings | Admin approval; discount ratio alerts; audit history |
| Stolen coupon code | Signed tokens; hotel binding; membership re-check |
| Staff collusion (fake redemption) | Audit log; redemption analytics anomalies; manager review |
| Multiple accounts / referral abuse | Referral qualification rules; device/email heuristics (future) |
| Replay of QR token | Token expiry + status checks + nonce in signed payload |

---

## 20. Cancellation Scenarios

| What | Who | Result |
|------|-----|--------|
| Membership cancelled | Member | Access until period end; no new entitlements after expiry |
| Entitlement before coupon | Member | Entitlement → CANCELLED; no coupon issued |
| Coupon before verification | Member | Coupon → CANCELLED; timeline logged |
| Coupon after verification but before redemption | **QUESTION:** Allow cancel? | Policy TBD |
| Hotel rejects guest | Reception | Coupon → REJECTED with reason |
| Hotel partnership ended | Admin | Hotel SUSPENDED; outstanding coupons fail verification |

---

## 21. Expiry Scenarios

| Entity | Expiry trigger | Effect |
|--------|----------------|--------|
| Membership | `currentPeriodEnd` passed | No new entitlements; verify fails |
| Entitlement | `validUntil` passed | Cannot activate; → EXPIRED |
| Coupon | `expiresAt` passed | Verify fails; wallet shows EXPIRED |
| Pricing rule | `validTo` date passed | Not used for new entitlements; existing snapshots honored |
| Email verify token | 24h | Must resend |
| QR token | Short TTL embedded in token | Re-scan generates fresh read from server state |

**ASSUMPTION:** Coupon validity window (e.g. 24h vs 30 days vs season end) — **must be decided**.

---

## 22. Rate-Change Scenarios

| Scenario | Behavior |
|----------|----------|
| New rates submitted while old approved | Old rates remain until new approved; no overlap conflict |
| Rate change after entitlement | Snapshot on entitlement/coupon; hotel honors per contract |
| Admin rejects rate change | Hotel continues with previous approved rates |
| Rack changes but STO unchanged | Savings display updates for new searches; existing coupons unchanged |
| Emergency rate suspension | Admin ARCHIVED rule; new entitlements blocked; existing per policy |

---

## 23. Dispute Scenarios

| Dispute | Resolution path |
|---------|-----------------|
| Member claims hotel refused honored rate | BB Admin reviews entitlement snapshot + verification logs + hotel response |
| Hotel claims member not eligible | Verification log shows membership state at verify time |
| Wrong amount charged by hotel | Outside BusyBeds payment scope; dispute logged; commercial team |
| Coupon shown used but guest denies | Redemption audit: staff ID, timestamp, device/IP |
| Fake hotel listing | Admin approval gate; document verification (future) |

BusyBeds Admin tools: view entitlement timeline, coupon timeline, membership history, verification/redemption audit.

---

## 24. Concept Separation (Architecture Mandate)

These MUST remain separate entities/concepts in software:

| Concept | What it is | NOT |
|---------|------------|-----|
| Membership | Subscription to BusyBeds | Room booking |
| Rack Rate | Reference public price | Member price |
| STO Rate | Negotiated partner rate | Random discount |
| Member Rate | Eligible member's price (from STO) | Separate negotiation |
| Offer/Benefit | Commercial item hotel provides | Coupon |
| Entitlement | Right to use specific offer | Payment |
| Coupon | Digital authorization artifact | The product |
| QR Code | Verification transport for coupon | Reservation |
| Redemption | Benefit actually delivered | Payment received |
| Hotel Payment | Guest → Hotel money flow | BusyBeds revenue |

### Required chain

```text
Membership → Eligibility → Hotel Offer → Approved STO Rate → Member Entitlement → Coupon → Verification → Redemption
         Rack Rate (reference for savings communication, parallel to STO)
```

---

## 25. Rate Validity Dimensions (Full Model)

Each pricing rule may include:

| Dimension | Required? | Notes |
|-----------|-----------|-------|
| Room type | Yes | |
| Rack + STO amounts | Yes | Paired submission |
| Start date | Yes | |
| End date | Yes | |
| Season label | Optional | High/low season |
| Day restrictions | Optional | Weekend flags |
| Blackout dates | Optional | Excluded dates within range |
| Min stay | Optional | **QUESTION:** Enforced at verify or informational? |
| Max stay | Optional | |
| Occupancy conditions | Optional | e.g. double occupancy |
| Guest count | Optional | |
| Rate status | Yes | Draft → Approved workflow |

Rate resolution engine picks highest-priority matching APPROVED rule for `(roomType, date, context)`.

---

## 26. Complete End-to-End Flow (Reference)

```text
HOTEL negotiates → submits Rack + STO → ADMIN approves → HOTEL LIVE
                                                              ↓
CUSTOMER buys membership → ACTIVE → searches → views savings
                                                              ↓
                    activates entitlement → coupon/QR issued
                                                              ↓
                    member checks availability WITH HOTEL (outside MVP booking)
                                                              ↓
                    presents QR → RECEPTION verifies → VERIFIED
                                                              ↓
                    member pays HOTEL directly ($120, not $200)
                                                              ↓
                    hotel provides benefit → RECEPTION redeems → REDEEMED
                                                              ↓
                    BUSYBEDS records usage (analytics, loyalty, disputes)
```

---

## 27. Ambiguities (Unresolved — Do Not Invent)

| # | Topic | Options / notes |
|---|-------|-----------------|
| A1 | Coupon validity duration | 24 hours vs 7 days vs until season end vs until usage date |
| A2 | RESERVED/PENDING state in MVP | Skip vs require hotel acknowledgment step |
| A3 | Verify + redeem | Single step vs two steps (VERIFIED then REDEEMED) |
| A4 | Tier gates on STO rates | All tiers same rates vs tier-specific access |
| A5 | Rate snapshot honor period | Legal/commercial: must hotel honor snapshot if rates changed? |
| A6 | No-availability policy | Cancel coupon vs auto-expire vs member-initiated cancel |
| A7 | Min/max stay enforcement | Block verification vs display-only warning |
| A8 | Blackout handling | Separate rules vs blackout table vs manual |
| A9 | Multi-night stays | One coupon per night vs one per stay |
| A10 | Benefit coupons | Same lifecycle as room rate coupons? |
| A11 | Corporate membership | Seat transfer; who pays hotel — employee as member |
| A12 | Past_due grace | Days of continued access |
| A13 | Discount alert threshold | 60%? Admin-only flag vs auto-reject |
| A14 | Offline verification | Required for African hotel connectivity? |

---

## 28. Assumptions (Explicit — Subject to Approval)

| ID | Assumption |
|----|------------|
| S1 | Member Rate = approved STO rate for resolved context (no dynamic markup) |
| S2 | One entitlement → one coupon (1:1) in MVP |
| S3 | Single-use coupon at REDEEMED for room rates |
| S4 | Email verification required before membership payment |
| S5 | Rate snapshot stored on entitlement at activation time |
| S6 | VERIFIED and REDEEMED are separate states (two-step staff flow) |
| S7 | RESERVED/PENDING optional — likely omitted in MVP |
| S8 | No BusyBeds room payment processing in MVP |
| S9 | Hotel availability handled outside platform in MVP |
| S10 | Offline QR verification not in MVP |

---

## 29. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Concept collapse (coupon = booking) | Wrong product, OTA creep | This spec + separate entities |
| Inflated rack rates | Fake savings, member distrust | Admin review, ratio alerts |
| Hotel refuses honored rate | Member churn, disputes | Snapshot + audit + commercial contracts |
| Coupon sharing | Revenue leakage for hotels | Live membership check, single redeem |
| Rate engine complexity | Wrong prices displayed | Extensive unit tests, admin preview |
| Scope creep to full OTA | Years of delay | MVP boundaries in PRD |
| Payment provider fragmentation | Failed subscriptions in Africa | Multi-gateway abstraction early |

---

## 30. Questions Requiring Answers Before Implementation

1. What is the default coupon validity window after activation?
2. Is verify→redeem one or two staff actions?
3. Do membership tiers gate which STO rates/offers are accessible?
4. When hotel has no availability, what happens to the coupon?
5. Are min stay / blackout rules enforced at verification or advisory only?
6. One coupon per stay or per night for multi-night visits?
7. Corporate: does company subscription map 1:1 to employee member entitlements?
8. Past_due grace period length?
9. Maximum allowed discount % before admin escalation?
10. Is RESERVED/PENDING in MVP scope?
11. Hotel commercial contract: mandatory honor of rate snapshot on issued coupons?
12. Benefit-only coupons (free breakfast): same payment flow (member may pay $0 for benefit but room separately)?

---

## Approval Gate

| Stakeholder | Status |
|-------------|--------|
| Product | Pending |
| Commercial / Hotel partnerships | Pending |
| Engineering | Spec complete — awaiting business sign-off |

**No code implementation until this document is approved and open questions in §27 and §30 are resolved or accepted with explicit assumptions.**
