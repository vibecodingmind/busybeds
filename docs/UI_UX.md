# BusyBeds — UI/UX Design Guidelines

**Version:** 1.0  
**Status:** Planning

---

## 1. Design Vision

BusyBeds should feel **premium, trustworthy, and distinctly African** — not a generic SaaS template. Visual language inspired by:

- **Trust:** Verified badges, clear savings math, professional hotel photography
- **Clarity:** Rack vs. member price always visible; no hidden fees narrative
- **Mobile-first:** QR scanning, search on phone, wallet in pocket
- **Warmth:** Earth tones + vibrant accent — hospitality, not fintech coldness

**Avoid:** OTA clutter (countdown timers, fake urgency), dark patterns, confusing booking flows.

---

## 2. Brand Direction

### Color palette (proposed)

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#0D6E63` | Teal-green — growth, Africa landscapes |
| `primary-dark` | `#084A43` | Headers, hover |
| `accent` | `#E8A838` | Gold — savings highlights, CTAs |
| `savings` | `#16A34A` | "You Save" badges |
| `rack` | `#6B7280` | Struck-through normal price |
| `surface` | `#FAFAF8` | Warm off-white background |
| `card` | `#FFFFFF` | Cards with soft shadow |

### Typography

- **Headings:** `DM Sans` or `Plus Jakarta Sans` — modern, readable
- **Body:** `Inter` — UI clarity
- **Numbers/prices:** Tabular nums enabled for aligned price columns

### Motion (Framer Motion)

- Page enter: fade + 8px y-shift, 200ms
- Card hover: subtle scale 1.02 on hotel cards
- Savings reveal: stagger children on rate display
- **No** excessive parallax or distracting animations

---

## 3. Portal Structure

### 3.1 Marketing site (`/`)

```
┌─────────────────────────────────────────────┐
│ Logo    Hotels  Plans  For Hotels  Login    │
├─────────────────────────────────────────────┤
│  HERO: Africa's Hotel Membership Network    │
│  [Search: City or Country]  [Find Hotels]   │
│  Social proof: X hotels, Y members, $ saved   │
├─────────────────────────────────────────────┤
│  How it works (3 steps)                       │
│  Featured partner hotels (carousel)           │
│  Membership tiers preview                     │
│  CTA: Join BusyBeds                           │
└─────────────────────────────────────────────┘
```

### 3.2 Guest portal (`/app`)

**Sidebar (desktop) / bottom nav (mobile):**
- Dashboard
- Search Hotels
- Coupon Wallet
- Membership
- BusyPoints
- Referrals
- Settings

**Key screen: Hotel detail**

```
┌─────────────────────────────────────────────┐
│ [Gallery]                                     │
│ Zanzibar Beach Resort ★★★★  Zanzibar, TZ      │
│ Amenities chips                               │
├─────────────────────────────────────────────┤
│ Check-in: [date picker]                       │
├─────────────────────────────────────────────┤
│ Deluxe Ocean Room                             │
│                                               │
│ Normal Price:     $200/night  (muted, strike) │
│ Member Price:     $120/night  (bold, primary) │
│ ┌─────────────────────────────────────────┐   │
│ │  YOU SAVE  $80  (40% OFF)  [gold badge] │   │
│ └─────────────────────────────────────────┘   │
│                                               │
│ [ Generate Member Coupon ]                    │
├─────────────────────────────────────────────┤
│ Benefits: Free breakfast, Late checkout...    │
└─────────────────────────────────────────────┘
```

### 3.3 Hotel portal (`/hotel`)

**Roles see different nav items:**
- Owner/Manager: Dashboard, Profile, Rooms, Rates, Benefits, Staff, Reports
- Reception: **Verify Coupon** (default landing), Recent redemptions

**Rate management UI:**
- Tab per room type
- Timeline/calendar view of rate periods (visual overlap warnings)
- Side-by-side Rack | STO inputs per period
- Context tags: High Season, Weekend, Holiday

### 3.4 Reception verify screen (critical UX)

```
┌─────────────────────────────────────────────┐
│         [  Camera QR Scanner  ]             │
│         or enter code manually              │
├─────────────────────────────────────────────┤
│  ✓ VALID MEMBER                             │
│  Jane Doe — Gold Member                     │
│  Deluxe Ocean Room                          │
│  Member rate: $120 (saves $80)              │
│  Expires: Today 6:00 PM                     │
│                                               │
│  [ Confirm Redemption ]                       │
└─────────────────────────────────────────────┘
```

Large touch targets; high contrast valid/invalid states; works in bright lobby lighting.

### 3.5 Admin portal (`/admin`)

- Approval queues as kanban or table with quick actions
- Rate review shows discount % with alert if > 60% (fraud check)
- Analytics cards at top; drill-down tables below

---

## 4. Component Library (shadcn/ui base)

| Component | Usage |
|-----------|-------|
| `Button` | Primary CTA gold accent; secondary outline |
| `Card` | Hotel cards, coupon cards |
| `Badge` | Tier badges, savings %, status |
| `DataTable` | Admin/hotel reports |
| `Dialog` | Confirm redemption, reject rate |
| `Sheet` | Mobile filters |
| `Calendar` | Date picker for rates and search |
| `Tabs` | Coupon wallet, rate contexts |
| `Toast` | Success/error feedback |
| `Skeleton` | Loading states |

**Custom domain components:**
- `RateDisplay` — rack, member, savings (single source of truth)
- `SavingsBadge` — formatted $ and %
- `CouponQR` — QR + code + expiry countdown
- `HotelCard` — image, location, best member price teaser
- `MembershipTierCard` — plan comparison
- `VerifyResult` — reception validation panel

---

## 5. UX Patterns

### Savings transparency (core pattern)

Always show three numbers together — never member price alone:

1. Normal Price (rack)
2. BusyBeds Member Price (STO)
3. You Save (amount + percent)

### Membership gate

Non-members see blurred member price with overlay:

> "Unlock member rates — Join BusyBeds from $X/month"

### Empty states

- Wallet empty: illustration + "Search hotels to generate your first coupon"
- No search results: suggest nearby cities or broaden filters

### Error states

- Payment failed: clear retry + support link
- Coupon expired: show regenerate CTA if membership still active

### Accessibility

- WCAG 2.1 AA contrast minimum
- QR alternative: manual code always available
- Keyboard navigation in admin tables
- `aria-live` for scan results

---

## 6. Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| `< 640px` | Single column; bottom nav; full-screen QR |
| `640–1024px` | 2-column grids |
| `> 1024px` | Sidebar + content; search filters left rail |

---

## 7. Wireframe Priority List

Build wireframes/prototypes in this order:

1. Reception verify flow (highest operational risk)
2. Hotel detail + rate display + coupon generate
3. Hotel rate management form
4. Admin approval queues
5. Membership checkout
6. Marketing homepage

---

## 8. Content & Tone

- **Voice:** Professional, warm, confident — "Your member price" not "DEAL!!!"
- **Currency:** Show hotel local currency; optional USD equivalent
- **Legal:** Clear disclaimer — BusyBeds does not process room payments
- **Hotel disclaimer on coupons:** "Present to reception. Hotel collects payment directly."

---

## 9. Figma / Design Handoff (Phase 3)

Deliverables for design phase:
- Design tokens export (CSS variables)
- Component specs for `RateDisplay`, `CouponQR`, `HotelCard`
- Icon set: Lucide (consistent with shadcn)
- Photography guidelines for hotel partners (min resolution, no watermarks)
