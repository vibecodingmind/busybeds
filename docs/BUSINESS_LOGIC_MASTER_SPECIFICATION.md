# BUSYBEDS BUSINESS LOGIC MASTER SPECIFICATION

**Version:** 1.1  
**Status:** Stakeholder decisions incorporated — **no implementation until final sign-off**  
**Last updated:** August 2026

---

## Stakeholder Decisions Log (v1.1)

| # | Topic | Decision |
|---|-------|----------|
| D1 | Coupon validity | **Varies by subscription package** — each plan defines its own coupon/entitlement validity rules |
| D2 | QR generation gate | **Only after hotel availability is confirmed** — initially BusyBeds admin staff call hotels on behalf of hotels; then QR/coupon is generated |
| D2b | Deposit window | **30 minutes** after QR issuance for member to pay **full deposit directly to hotel** — reduces no-shows |
| D3 | Rack rate authority | **BusyBeds decides** which hotels and what rack rates to display; member rates from **STO**; rack is platform-controlled reference pricing for savings display |
| D4 | No availability | **No QR generated** (cannot proceed without availability); **hotel remains visible** in search/listings |
| D5 | Minimum stay | **3 nights minimum** — enforced |
| D6 | Coupon scope | **One coupon per stay** (not per night) |
| D7 | Corporate seats | **See §31 recommendation** (approved pending stakeholder) |
| D8 | Grace period | **Clarified:** renewal payment failure grace — **See §31 recommendation** |
| D9 | Max discount before admin | **25%** — discounts above this require admin review/approval before publish |
| D10 | MVP booking states | **See §31 recommendation** — availability + deposit states required in MVP |
| D11 | Rate snapshot honor | **See §31 recommendation** |
| D12 | Benefit coupons | **See §31 recommendation** |

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

BusyBeds does **not** own inventory or replace hotel PMS in MVP. Room payments flow **Member → Hotel** (deposit and balance). BusyBeds does not collect room payments.

**Availability-confirmed model (v1.1):** A QR/coupon is issued **only after availability is confirmed** (initially by BusyBeds admin calling the hotel). The member then has a **30-minute window** to pay a **full deposit directly to the hotel**. Without confirmed availability, no QR is generated — but the hotel remains visible in listings.

A valid coupon after deposit means: *"Availability was confirmed, deposit obligation met (or window active), member entitled to agreed offer at snapshotted rates."* It is still **not** a full OTA reservation engine — hotels may be listed even when BusyBeds has no availability for selected dates.
---

## 2. Business Model

| Revenue | Who pays | What they get |
|---------|----------|---------------|
| Membership subscription | Member → BusyBeds | Access to network, member rates, benefits, loyalty |
| Room deposit (after QR) | Member → Hotel | Secures confirmed availability; 30-minute payment window |
| Hotel partnership | Hotel → BusyBeds (future: listing fee / rev share — **not defined in MVP**) | Visibility, member traffic, occupancy |

**Value exchange:**

- **Member:** Transparent savings (rack vs. member rate) + benefits
- **Hotel:** Pre-qualified guests at negotiated rates without OTA commission on the membership channel
- **BusyBeds:** Recurring membership revenue + redemption/usage data

---

## 3. Rack Rate Model

### Definition

The **reference/normal price shown to members** as "Normal Rate" for savings comparison. In BusyBeds v1.1, **BusyBeds controls published rack rates** — not the hotel alone.

### Authority (stakeholder decision D3)

| Layer | Who controls | Purpose |
|-------|--------------|---------|
| STO Rate | Hotel negotiates → BusyBeds approves | **Member Rate** basis (confidential partner rate) |
| Rack Rate (display) | **BusyBeds admin sets** per hotel/room/context | Savings communication |

Hotels provide STO through commercial onboarding. BusyBeds decides **which hotels** appear and **what rack rate** is displayed alongside each STO rate. This prevents hotels from inflating rack to fake savings and keeps messaging consistent with the **25% max auto-discount policy** (D9).

### Rack derivation rule (system default)

When BusyBeds sets rack from STO:

```text
Discount % = ((Rack − STO) / Rack) × 100

Maximum auto-publish discount: 25%
→ Minimum rack for display = STO ÷ (1 − 0.25) = STO ÷ 0.75

Example:
STO = $120 → minimum rack for 25% display = $160
BusyBeds admin may set rack higher (e.g. $200) if commercially accurate
```

If implied discount **> 25%**, rate package requires **admin approval** before publish (D9).

### Properties

| Property | Description |
|----------|-------------|
| Attached to | Room type + validity context |
| Purpose | Reference price for savings display |
| Source | **BusyBeds admin** (derived from STO + commercial policy) |
| Not | Price BusyBeds collects; not necessarily hotel's live OTA price |

### Rules

1. STO rate must be approved before any published rack/STO pair goes live.
2. Rack is always shown with member rate — never STO alone.
3. Discount > 25% blocks auto-publish; requires admin approval.
4. Published rack/STO pairs follow approval workflow; history retained for audit and snapshotted bookings.

### Example

```
Hotel: Zanzibar Beach Resort (listed by BusyBeds)
Room: Deluxe Ocean Room
STO Rate (approved): $120/night
Rack Rate (BusyBeds display): $200/night
Saving: $80/night (40%) — requires admin approval (>25%)
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

1. STO is the commercial anchor; member rate = approved STO for resolved context.
2. Unapproved STO never used for display or booking requests.
3. STO alone never shown without BusyBeds-published rack context.
4. Hotel-submitted rack (if collected during onboarding) is **reference only** — BusyBeds published rack is authoritative for member UI.
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
| Tier-specific member rates | Per subscription package rules (D1) — plans may gate hotels/offers |
| Discount > 25% | Admin approval required before rates go live (D9) |
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
- Discount % within policy: **auto-publish only if ≤ 25%** (D9); above requires explicit admin approval
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
| 6 | Member | Views room pricing | Mandatory three-part display | Request stay |
| 7 | Member | Selects dates (min **3 nights**) | Validates min stay; may show "No availability" for dates | Request availability |
| 8 | Non-member | Views hotel | Rack visible; member rate gated + subscribe CTA | Register/subscribe |

### No availability display (D4)

Hotels **always remain visible** when APPROVED — even if BusyBeds has no availability for selected dates. UI shows e.g. *"No BusyBeds availability for these dates"* — hotel may still be bookable on other platforms. **No QR/coupon is generated** without availability confirmation.

### Search price filter

Uses resolved **member rate** (STO) for the selected date context, not rack.

---

## 10. Member Entitlement & Booking Request Flow

### Definition

An **entitlement** records a member's **intent to book** a specific offer with stay parameters. The **coupon/QR is not created at this stage** — only after availability confirmation (D2).

Bound to:

```text
Member ID + Hotel ID + Offer ID + Stay dates + Nights (≥3) + Rate snapshot + Package validity rules
```

### Workflow (v1.1 — availability-first)

| Step | Actor | Action | System Response | Next Step |
|------|-------|--------|-----------------|-----------|
| 1 | Member | Selects room, check-in, check-out | Validates **min 3 nights** (D5); resolves rack + STO | Validate membership |
| 2 | System | Validates membership ACTIVE + plan rules | Pass or block | Create booking request |
| 3 | Member | Submits "Request Stay" | `BookingRequest` created; status: `PENDING_AVAILABILITY` | Admin/hotel confirm |
| 4 | BusyBeds Admin | Calls hotel (MVP ops) to confirm availability | Logs outcome in system | Branch |
| 5a | Admin | Marks availability **confirmed** | Status: `AVAILABILITY_CONFIRMED`; rates snapshotted | Generate QR |
| 5b | Admin | Marks **no availability** | Status: `NO_AVAILABILITY`; notify member; **no QR** | Member picks other dates/hotel |
| 6 | System | Generates coupon + QR | Status: `DEPOSIT_PENDING`; **30-min timer starts** (D2b) | Member pays deposit |
| 7 | Member | Pays **full deposit to hotel** (direct) | Hotel/admin marks deposit received | Deposit confirmed |
| 8 | System | Deposit confirmed within 30 min | Status: `DEPOSIT_CONFIRMED`; coupon validity per **plan rules** (D1) | Stay proceeds |
| 9 | System | 30 min elapsed, no deposit | Status: `EXPIRED`; availability released; notify member + hotel | Closed |

### Entitlement / booking request record (conceptual)

```text
bookingRequestId / entitlementId
memberId
hotelId
roomTypeId
checkInDate
checkOutDate
nights              (minimum 3)
rackSnapshot
stoSnapshot
depositAmount       (full deposit — policy per hotel/BusyBeds)
depositDeadline     (issuedAt + 30 minutes)
membershipPlanId    (drives coupon validity — D1)
status              (see lifecycle §11)
couponId            (null until AVAILABILITY_CONFIRMED → QR issued)
```

### Rules

1. **No QR without availability confirmation** (D2, D4).
2. **One coupon per stay** covering full date range (D6).
3. Rate snapshot at availability confirmation — honored for that booking (see §31 D11).
4. MVP: BusyBeds admin performs availability calls; future: hotel portal self-confirm.
5. Coupon post-deposit validity governed by **subscription package** config (D1).

---

## 11. Coupon & QR Flow

### Definition

A **coupon** is the digital authorization issued **after availability is confirmed**. The **QR code is generated at the same moment**. Until then, the member has a booking request — not a coupon.

### Generation (only after `AVAILABILITY_CONFIRMED`)

| Step | Actor | Action | System Response | Next Step |
|------|-------|--------|-----------------|-----------|
| 1 | System | Availability confirmed | Snapshots rack + STO + stay dates | Issue coupon |
| 2 | System | Generates unique code (e.g. BB-8X7K29) | Code stored | Sign QR token |
| 3 | System | Generates QR code | Signed token; no PII in QR | Start deposit window |
| 4 | System | Sets `depositDeadline` = now + **30 minutes** | Status: `DEPOSIT_PENDING` | Notify member |
| 5 | System | Sends notification | SMS/email: QR + deposit amount + deadline + hotel payment instructions | Member pays hotel |
| 6a | Hotel/Admin | Confirms deposit received | `DEPOSIT_CONFIRMED`; coupon validity per plan | Check-in flow |
| 6b | System | 30 min timeout | `EXPIRED`; coupon invalid | — |

### Coupon face (member view — after QR issued)

```text
BUSYBEDS CONFIRMED STAY
Code: BB-8X7K29
Hotel: Zanzibar Beach Resort
Room: Deluxe Ocean Room
Check-in: 10 Jun → Check-out: 13 Jun (3 nights)
Normal Rate: $200/night
Member Rate: $120/night
Deposit due: $360 (pay hotel directly)
Pay deposit within: 28:45 remaining
Status: DEPOSIT_PENDING
[QR CODE]
```

After deposit:

```text
Status: DEPOSIT_CONFIRMED / ACTIVE
Valid until: [per membership package rules]
```

### Coupon lifecycle states (v1.1)

```text
PENDING_AVAILABILITY     (member requested; awaiting confirmation)
         ↓
NO_AVAILABILITY          (terminal — no QR issued)
         OR
AVAILABILITY_CONFIRMED   (hotel confirmed; QR being issued)
         ↓
DEPOSIT_PENDING          (QR live; 30-minute deposit window)
         ↓
DEPOSIT_CONFIRMED        (deposit received; booking secured)
         ↓
VERIFIED                 (staff validates at check-in)
         ↓
REDEEMED                 (stay completed; terminal success)

Terminal alternatives:
  EXPIRED (deposit timeout or package validity elapsed)
  CANCELLED (member or admin)
  REJECTED (hotel/staff at verify)
```

Every transition → immutable timeline event (actor, timestamp, metadata).

### Coupon validity by subscription package (D1)

Each `MembershipPlan` defines coupon rules, e.g.:

| Plan | Example validity rule |
|------|----------------------|
| Bronze | Coupon valid until check-in date + 24h |
| Silver | Valid until check-out date |
| Gold | Valid until check-out + 48h grace |
| Platinum | Extended validity + reissue policy |
| Corporate | Same as assigned tier template |

Stored in plan `features` or `couponValidityPolicy` JSON — enforced at verify time.

### Rules

1. QR generated **once**, at availability confirmation — not before.
2. Deposit is **full deposit**, paid **directly to hotel** — not through BusyBeds.
3. 30-minute deposit window is mandatory (D2b).
4. Single-use at REDEEMED; one coupon per stay (D6).
5. Coupon does not mean BusyBeds processed payment — hotel confirms deposit.

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
| 7 | Coupon not already REDEEMED/REJECTED/EXPIRED | "Already used or expired" |
| 8 | Staff has `coupon:verify` permission | 403 Forbidden |
| 9 | Status is `DEPOSIT_CONFIRMED` or plan-allowed state | "Deposit not confirmed" |
| 10 | Stay meets **min 3 nights** | "Minimum stay not met" |
| 11 | Coupon validity per **membership package** rules (D1) | "Coupon expired for your plan" |

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

## 13. Hotel Availability Flow (v1.1)

| Step | Actor | Action | System Response | Next Step |
|------|-------|--------|-----------------|-----------|
| 1 | Member | Requests stay (≥3 nights) for dates | `PENDING_AVAILABILITY` booking request | Ops review |
| 2 | BusyBeds Admin | Calls hotel to confirm (MVP) | Logs call notes | Confirm or deny |
| 3a | Admin | Confirms availability | `AVAILABILITY_CONFIRMED` → QR + 30-min deposit window | Member pays deposit |
| 3b | Admin | No availability | `NO_AVAILABILITY`; **no QR**; member notified | Member tries other options |
| 4 | System | Hotel still listed | Search/detail remain visible (D4) | — |

### Rules

1. **No QR without confirmed availability** (D2, D4).
2. Hotel visibility ≠ availability — hotels appear even when dates unavailable on BusyBeds.
3. No availability does not remove hotel from platform; member may book elsewhere.
4. Future: hotel self-confirm via portal; automated inventory optional later.

### MVP operations note

BusyBeds admin staff act **on behalf of hotels** for availability confirmation until hotel portal self-service is ready.

---

## 14. Hotel Payment Flow (v1.1)

### Deposit rule (stakeholder D2b)

After QR issuance, member must pay **full deposit directly to hotel** within **30 minutes**.

```text
MEMBER → HOTEL (deposit via hotel's payment methods: card, mobile money, bank)
NOT: MEMBER → BUSYBEDS → HOTEL
```

### Workflow

| Step | Actor | Action | System Response | Next Step |
|------|-------|--------|-----------------|-----------|
| 1 | System | QR issued | Shows deposit amount + 30-min countdown | Member pays |
| 2 | Member | Pays full deposit to hotel | Hotel receives funds on their systems | Confirm |
| 3 | Hotel staff / Admin | Marks deposit received in system | `DEPOSIT_CONFIRMED` | Coupon active per plan |
| 4 | Member | Pays balance at check-in/stay | Hotel handles — outside BusyBeds | Redemption |
| 5 | System | Deposit timeout | `EXPIRED` if not confirmed in 30 min | Slot released |

### Deposit amount

**Recommendation:** Full stay at member rate × nights (e.g. 3 nights × $120 = $360 deposit) — configurable per hotel agreement.

### What BusyBeds records

- Booking request lifecycle
- QR issuance + deposit deadline
- Deposit confirmed (boolean + timestamp + confirmer ID) — **not** card details
- Verification + redemption

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

### Required chain (v1.1)

```text
Membership → Eligibility → Hotel Offer → Approved STO Rate
    → Booking Request (≥3 nights) → Availability Confirmed (admin/hotel)
    → QR + Coupon → Deposit (30 min, direct to hotel) → Verification → Redemption
         BusyBeds-published Rack Rate (savings display)
```

**No code until §31 recommendations approved or revised.**

---

## 25. Rate Validity Dimensions (Full Model)

Each pricing rule may include:

| Dimension | Required? | Notes |
|-----------|-----------|-------|
| Room type | Yes | |
| STO amount | Yes | Hotel-negotiated; basis for member rate |
| Rack amount (display) | Yes | BusyBeds-published (D3) |
| Start date | Yes | |
| End date | Yes | |
| Season label | Optional | High/low season |
| Day restrictions | Optional | Weekend flags |
| Blackout dates | Optional | Excluded dates within range |
| Min stay | **Yes — 3 nights minimum** (D5) | Enforced at booking request + verification |
| Max stay | Optional | |
| Occupancy conditions | Optional | e.g. double occupancy |
| Guest count | Optional | |
| Rate status | Yes | Draft → Approved workflow |
| Max discount | **25%** auto-publish (D9) | Above requires admin approval |

Rate resolution engine picks highest-priority matching APPROVED rule for `(roomType, date, context)`.

---

## 26. Complete End-to-End Flow (Reference — v1.1)

```text
HOTEL negotiates STO → BUSYBEDS sets rack + approves → HOTEL LIVE (always visible)
                                                              ↓
CUSTOMER buys membership (plan defines coupon rules) → ACTIVE
                                                              ↓
                    searches → views savings (even if no BB availability)
                                                              ↓
                    requests stay (min 3 nights, dates)
                                                              ↓
              PENDING_AVAILABILITY → Admin calls hotel (MVP ops)
                                                              ↓
         ┌────────────────────┴────────────────────┐
         NO_AVAILABILITY (no QR)          AVAILABILITY_CONFIRMED
         hotel still listed                         ↓
                              QR generated + 30-min deposit window
                                                    ↓
                              Member pays FULL DEPOSIT → HOTEL directly
                                                    ↓
                              DEPOSIT_CONFIRMED (coupon valid per plan)
                                                    ↓
                              Check-in: RECEPTION verifies QR → VERIFIED
                                                    ↓
                              Stay completed → REDEEMED
                                                    ↓
                              BUSYBEDS records usage + loyalty
```

---

## 27. Resolved Decisions (formerly ambiguities)

| Topic | Resolution |
|-------|------------|
| Coupon validity | Per subscription package (D1) |
| QR timing | After availability confirmation only (D2) |
| Deposit window | 30 minutes, full deposit, direct to hotel (D2b) |
| Rack rate source | BusyBeds-controlled display; STO from hotel (D3) |
| No availability | No QR; hotel stays listed (D4) |
| Min stay | 3 nights enforced (D5) |
| Multi-night | One coupon per stay (D6) |
| Max discount | 25% auto; above needs admin (D9) |
| MVP states | PENDING_AVAILABILITY → … → DEPOSIT_PENDING → DEPOSIT_CONFIRMED (§31) |

---

## 28. Approved Assumptions (v1.1)

| ID | Assumption |
|----|------------|
| S1 | Member Rate = approved STO for resolved context |
| S2 | One booking request → one coupon per stay |
| S3 | Single-use at REDEEMED |
| S4 | Email verification before membership payment |
| S5 | Rate snapshot at availability confirmation |
| S6 | VERIFIED and REDEEMED are separate staff steps |
| S7 | MVP includes availability + deposit states (not optional) |
| S8 | Room deposit/payment direct to hotel — not through BusyBeds |
| S9 | MVP availability confirmation via BusyBeds admin calling hotels |
| S10 | Full deposit required within 30 minutes of QR issuance |
| S11 | Minimum stay 3 nights |
| S12 | Discount > 25% requires admin approval |

---

## 29. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Ops bottleneck (admin calls hotels) | Slow confirmation | Queue UI; later hotel self-service |
| Deposit timeout disputes | Member/hotel friction | Clear countdown; SMS reminders at 10 min |
| Member pays deposit but admin slow to confirm | False expiry | Hotel can confirm deposit in portal; audit |
| Concept collapse (coupon = booking) | Wrong product | Separate BookingRequest vs Coupon entities |
| Inflated rack on other platforms vs BB display | Trust questions | BusyBeds-controlled rack policy |
| Coupon sharing | Fraud | Deposit binding + live membership check |
| Payment provider fragmentation (membership) | Failed subs | Multi-gateway for BusyBeds fees only |

---

## 30. Remaining Questions (minor — recommendations in §31)

1. Exact deposit formula per hotel (% vs full stay amount)?
2. Who marks deposit confirmed in MVP — hotel reception only or admin too?
3. Tier-specific hotel access per plan — confirm catalog rules?
4. Automated SMS at 10 min before deposit expiry?

---

## 31. Recommendations (Stakeholder Items 7, 8, 10, 11, 12)

### D7 — Corporate membership (recommendation)

```text
Corporate Account
  → purchases N seats on a plan tier (e.g. Corporate Gold)
  → Corporate Admin invites employees by email
  → Employee accepts → seat assigned → Subscription linked to corporate billing
  → Employee uses same booking flow as individual member
  → Coupons/deposits: employee pays hotel directly (same as retail members)
  → Corporate Admin sees aggregated usage (redemptions, active seats) — no PII on amounts paid to hotels
```

| Rule | Recommendation |
|------|----------------|
| Seat limit | Enforced at invite/assign |
| Seat release | On employee departure, admin revokes → subscription ends at period end |
| Booking | Employee identity on coupon; corporate reporting only |

**Approve or adjust?**

---

### D8 — Grace period (clarification + recommendation)

**What we meant:** When a member's **BusyBeds subscription renewal payment fails** (card declined, mobile money timeout), do they keep access temporarily?

| Policy | Recommendation |
|------|----------------|
| Grace period | **7 days** past `currentPeriodEnd` while `PAST_DUE` |
| During grace | Can **view** member rates and **existing** deposit-confirmed coupons |
| During grace | **Cannot** create new booking requests / new QR |
| After grace | `EXPIRED` — member rates hidden; verify fails for new stays |

This is separate from the **30-minute deposit window** (hotel payment).

**Approve 7-day subscription grace?**

---

### D10 — MVP booking states (recommendation)

**Include in MVP** — these are required for the confirmed business model:

| State | Meaning |
|-------|---------|
| `PENDING_AVAILABILITY` | Member requested; awaiting confirmation |
| `NO_AVAILABILITY` | Terminal; no QR |
| `AVAILABILITY_CONFIRMED` | Hotel confirmed; issuing QR |
| `DEPOSIT_PENDING` | QR live; 30-min timer |
| `DEPOSIT_CONFIRMED` | Deposit marked received |
| `VERIFIED` | Checked in at hotel |
| `REDEEMED` | Stay complete |
| `EXPIRED` / `CANCELLED` / `REJECTED` | Terminals |

Admin ops queue: filter `PENDING_AVAILABILITY` for daily hotel calls.

**Approve state machine?**

---

### D11 — Rate snapshot honor (recommendation)

Once `AVAILABILITY_CONFIRMED` and rates snapshotted:

| Rule | Recommendation |
|------|----------------|
| Binding period | Hotel **must honor** snapshotted rack/STO for that stay when `DEPOSIT_CONFIRMED` |
| Commercial | Encode in hotel partnership agreement |
| Rate changes later | Apply only to **new** booking requests |
| Disputes | Snapshot + timeline + deposit record = evidence |

If deposit expires (`EXPIRED`), snapshot void — member must re-request at current rates.

**Approve binding snapshot on deposit-confirmed bookings?**

---

### D12 — Benefit coupons (recommendation)

Benefits (breakfast, late checkout, spa) should **attach to the stay coupon**, not separate QR flows in MVP:

```text
Stay coupon (room) → includes bundled benefit flags
At VERIFIED: staff sees "Includes: Free breakfast, Late checkout"
Benefit redemption: part of same REDEEMED event OR optional per-benefit checkboxes at redeem
```

| Benefit type | Payment |
|--------------|---------|
| Included perk (breakfast) | $0 — covered by stay; no separate payment |
| Discount benefit (20% spa) | Member pays hotel at discounted price directly |
| Room upgrade | If approved at verify — price difference paid to hotel directly |

**One QR per stay** includes all plan-eligible benefits for that hotel (D6).

**Approve bundled benefit model?**

---

## Approval Gate

| Stakeholder | Status |
|-------------|--------|
| Product | v1.1 decisions incorporated |
| Commercial / Hotel partnerships | Pending §31 recommendations |
| Engineering | Ready for schema/API design after §31 sign-off |

**No code until §31 recommendations approved or revised.**
