# BusyBeds Platform Audit & Fixes Worklog

## Session: 2026-03-27

---

## Task 1: Bug Fixes Analysis

### Work Log:
- Analyzed entire codebase for bugs using automated agent
- Identified 25 bugs across Critical (5), High (5), Medium (9), Low (6)

### Critical Fixes Implemented:

#### 1. JWT Secret Security (src/lib/auth.ts)
- **Issue**: Hardcoded fallback JWT secret in production
- **Fix**: Added production check that throws error if JWT_SECRET not set
- **Code Change**: Added `getJwtSecret()` function with environment validation

#### 2. Coupon Redemption Race Condition (src/app/api/coupons/scan/route.ts)
- **Issue**: Two staff members could redeem same coupon simultaneously
- **Fix**: Changed from `update()` to `updateMany()` with status check for atomic redemption
- **Code Change**: Added conditional update with count verification

#### 3. Coupon Expiry Batch Update (src/app/api/coupons/route.ts)
- **Issue**: Individual DB updates for each expired coupon (N+1 style)
- **Fix**: Changed to batch `updateMany()` with `where: { id: { in: expiredIds } }`

#### 4. Rate Limiter Memory Leak (src/lib/rateLimit.ts)
- **Issue**: Unbounded Map growth causing memory exhaustion
- **Fix**: Added `MAX_STORE_SIZE = 10000` with LRU eviction

#### 5. Gift Card Brute Force Vulnerability (src/app/api/gift-cards/redeem/route.ts)
- **Issue**: No rate limiting on redemption endpoint
- **Fix**: Added rate limiting (5 attempts per 5 minutes per IP)

---

## Task 2: Code Review

### Security Fixes Implemented:

#### 1. Input Validation in Admin Users API (src/app/api/admin/users/route.ts)
- **Issue**: No validation for role/action parameters
- **Fix**: Added Zod schema validation for PATCH endpoint
- **Code Change**: Added `patchSchema` with enum validation for roles and actions

### Code Quality Fixes:

#### 1. Removed Duplicate Component
- **File Deleted**: `src/components/NotificationsBell.tsx`
- **Reason**: Duplicate of `NotificationBell.tsx`, not used anywhere

#### 2. Fixed Incorrectly Named File
- **File Deleted**: `src/app/api/admin/users/[id]_route.ts`
- **Reason**: Incorrect filename format (underscore instead of directory)

#### 3. Removed Dead Code (src/app/api/admin/hotels/[id]/photos/route.ts)
- **Issue**: No-op `$queryRawUnsafe('SELECT 1')` that served no purpose
- **Fix**: Removed dead SQL query

---

## Task 3: Performance Audit

### Database Indexes Added (prisma/schema.prisma):

#### Hotel Model Indexes:
```prisma
@@index([status])
@@index([city])
@@index([country])
@@index([starRating])
@@index([avgRating])
@@index([category])
@@index([adminFeatured])
@@index([status, city])
@@index([status, avgRating])
```

#### User Model Indexes:
```prisma
@@index([role])
@@index([createdAt])
@@index([emailVerified])
```

### API Performance Improvements (src/app/api/hotels/route.ts):

#### 1. Pagination Validation
- Added min/max bounds checking for page and limit parameters
- Capped limit at 100 to prevent memory issues

#### 2. Parallel Queries
- Changed sequential queries to `Promise.all()` for hotels and count
- Returns accurate total count for proper pagination

---

## Task 4: Security Hardening & Bug Fixes (Session: 2026-03-28)

### Bug Fixes:

#### 1. Profile Page Crash — `cookies()` Async Fix
- **Issue**: Next.js 14.2+ requires `cookies()` from `next/headers` to be `await`ed; synchronous usage throws a runtime error displayed as "Something went wrong"
- **Files Fixed**:
  - `src/lib/auth.ts` — `getSession()` now `await`s `cookies()`
  - `src/app/portal/analytics/page.tsx` — direct `cookies()` call now `await`ed
  - `src/app/notifications/page.tsx` — direct `cookies()` call now `await`ed

#### 2. Health Endpoint — Prisma Client Leak
- **Issue**: `/api/health/route.ts` was instantiating a brand new `PrismaClient` on every call instead of using the shared singleton, causing connection pool exhaustion
- **Fix**: Replaced `new PrismaClient()` with the shared `prisma` singleton from `@/lib/prisma`

#### 3. Portal Hotel API — Double `req.json()` Bug
- **Issue**: The PATCH handler in `/api/portal/hotel/route.ts` called `req.json()` twice — once to read `hotelId` for admin users and again to read the update payload. The second call always returned `{}` since the stream was already consumed
- **Fix**: Parse `req.json()` once at the top and reuse the parsed body for both purposes

#### 4. Portal Hotel API — Unprotected `JSON.parse`
- **Issue**: `hotel.amenities` and `hotel.vibeTags` were parsed with `JSON.parse()` directly; corrupted DB values would crash the API with an unhandled exception
- **Fix**: Wrapped each parse in a `try/catch` with `[]` fallback

#### 5. Push Notifications — Hardcoded VAPID Key Fallback
- **Issue**: `PushNotificationToggle.tsx` fell back to a hardcoded public VAPID key when `NEXT_PUBLIC_VAPID_PUBLIC_KEY` was not set — any browser using the fallback key would be registered under a shared key, undermining security
- **Fix**: Removed the hardcoded fallback; when the env var is absent, the subscribe flow exits early with a console warning

#### 6. HotelSplitView — Map Hover State Not Tracked
- **Issue**: The map component received `hoveredHotelId={null}` hardcoded, so hovering a hotel card in the list never highlighted the corresponding pin on the map
- **Fix**: Added `hoveredHotelId` state inside `HotelSplitView`, wired to `onMouseEnter`/`onMouseLeave` on each card, and passed it through to `HotelMap`

---

## Task 5: Frontend Performance

### Next.js Image Configuration (next.config.js):
- Added remote patterns for additional image hosts:
  - `res.cloudinary.com`
  - `*.googleusercontent.com`
  - `lh3.googleusercontent.com`
  - `**.s3.amazonaws.com`

---

## Summary of Changes

| Category | Files Modified | Files Deleted |
|----------|---------------|---------------|
| Security | 4 | 0 |
| Performance | 2 | 0 |
| Code Quality | 1 | 2 |
| **Total** | **7** | **2** |

### Files Modified:
1. `src/lib/auth.ts` - JWT secret security
2. `src/lib/rateLimit.ts` - Memory leak fix
3. `src/app/api/coupons/scan/route.ts` - Race condition fix
4. `src/app/api/coupons/route.ts` - Batch update optimization
5. `src/app/api/gift-cards/redeem/route.ts` - Rate limiting
6. `src/app/api/admin/users/route.ts` - Input validation
7. `src/app/api/admin/hotels/[id]/photos/route.ts` - Dead code removal
8. `src/app/api/hotels/route.ts` - API performance
9. `prisma/schema.prisma` - Database indexes
10. `next.config.js` - Image optimization

### Files Deleted:
1. `src/components/NotificationsBell.tsx` - Duplicate component
2. `src/app/api/admin/users/[id]_route.ts` - Incorrectly named file

---

## Deployment Notes

After deploying these changes:
1. Run `prisma db push` to apply new indexes
2. Ensure `JWT_SECRET` environment variable is set in production
3. Ensure `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is set if push notifications are needed
4. Monitor memory usage for rate limiter improvements

