# T083: Offline-Capable POS with PWA & Service Worker

**Priority**: P0 (production blocker — Indian retail needs offline billing)
**Status**: todo
**Size**: XL
**Depends on**: —

## Problem

Indian retail shops frequently experience internet disruptions. The current POS requires a live API call for every action — product search, billing, saving invoices. If the internet drops mid-transaction, the cashier is stuck. The spec explicitly requires: "Offline billing continues without internet, syncing later."

This ticket implements a Progressive Web App (PWA) with offline-first architecture for the POS screen, so billing can continue even when disconnected.

## Current State

- All POS operations make live API calls via `fetch()`
- No service worker registered
- No PWA manifest
- No local storage fallback for product data
- No offline queue for pending invoices
- `window.navigator.onLine` is not checked anywhere
- Zustand store persists some data (storeId, heldBills) but not products or pending invoices

## Requirements

### 1. PWA Setup

- Add `public/manifest.json` with app name, icons, theme color
- Add `<link rel="manifest">` to root layout
- Add meta tags for PWA (theme-color, apple-mobile-web-app-capable, etc.)
- Register service worker in root layout
- Add PWA install prompt (optional, not blocking)

### 2. Service Worker with Workbox

Install `workbox-webpack-plugin` or use Next.js PWA approach:
- Cache static assets (JS, CSS, fonts, images) with stale-while-revalidate
- Cache API responses for GET requests (products, categories, stores) with network-first strategy
- Skip caching for POST/PUT/PATCH/DELETE requests
- Handle offline fallback: show offline page for navigation requests when network is unavailable

### 3. Local Product Cache

When online, periodically (every 5 minutes) sync products to IndexedDB:
- `src/lib/offline-db.ts` — Dexie.js (IndexedDB wrapper) for local storage
- Tables: `products`, `categories`, `customers`, `storeConfig`
- On POS page load: fetch from API → store in IndexedDB
- On search: query IndexedDB first (instant), then API (for updates)
- Show "cached" badge when using offline data

### 4. Offline Invoice Queue

When offline, invoices should be queued locally:
- `src/lib/offline-queue.ts` — Queue for pending operations
- When cashier completes a bill offline:
  1. Invoice is saved to IndexedDB with status `PENDING_SYNC`
  2. Invoice number is generated locally (prefix + timestamp)
  3. Stock is decremented in local cache
  4. Success message shown to cashier
  5. Banner displayed: "Offline — X invoices pending sync"

- When connection is restored:
  1. Service worker detects `online` event
  2. Pending invoices are synced to server in order
  3. Real invoice numbers are assigned by server
  4. Local invoice numbers are updated with real ones
  5. Stock is reconciled (server is source of truth)
  6. Banner updates: "All invoices synced ✓"

### 5. Conflict Resolution

When two cashiers work offline on same products:
- Server is source of truth for stock levels
- If stock goes negative after sync, flag invoice as `STOCK_CONFLICT`
- Show in billing list: "⚠ Stock conflict — manager review needed"
- Manager can resolve: accept (stock goes negative, needs correction) or reject (void invoice)

### 6. POS UI Changes

- Add connectivity indicator in top-right corner of POS:
  - 🟢 Online (green dot)
  - 🔴 Offline (red dot) with "X invoices pending"
- When going offline: toast notification "You're offline — billing will continue normally"
- When coming back online: toast "Back online — syncing X invoices..."
- Disable actions that require internet: UPI payment, email receipt, customer search (use local cache)
- Cash payment works fully offline

### 7. Periodic Background Sync

- When online, sync products every 5 minutes
- When online, sync customers every 10 minutes
- When online, sync store config on page load
- Use `navigator.serviceWorker.controller.postMessage()` for sync triggers

## Test Scenarios

### Scenario 1: Normal Online Billing
1. Cashier opens POS — products load from API
2. Cashier adds items, selects customer, completes bill
3. Invoice saved to server immediately
4. No offline queue activity
5. Connectivity indicator shows 🟢

**Verify**: Normal flow unchanged, no regression

### Scenario 2: Go Offline Mid-Billing
1. Cashier has 3 items in cart
2. Internet drops (simulate with DevTools offline mode)
3. Connectivity indicator turns 🔴
4. Toast: "You're offline — billing will continue normally"
5. Cashier adds 2 more items (from local cache)
6. Cashier completes bill with Cash payment
7. Invoice saved locally with status PENDING_SYNC
8. Banner: "1 invoice pending sync"
9. Receipt prints normally (via window.print)

**Verify**: Billing works seamlessly offline, invoice queued

### Scenario 3: Come Back Online — Sync
1. 3 invoices are pending sync
2. Internet reconnects
3. Service worker detects `online` event
4. Toast: "Back online — syncing 3 invoices..."
5. Invoices sync one by one to server
6. Real invoice numbers replace local ones
7. Stock is updated on server
8. Banner: "All invoices synced ✓"
9. Connectivity indicator: 🟢

**Verify**: All invoices synced, stock correct, real invoice numbers assigned

### Scenario 4: Stock Conflict After Sync
1. Two cashiers both sell the last 5 units of Product X while offline
2. Both sync when back online
3. Second sync detects stock would go negative
4. Second invoice flagged as STOCK_CONFLICT
5. Manager sees alert in billing list
6. Manager reviews: accepts (will do stock adjustment later) or rejects (voids invoice)

**Verify**: Conflict detected, no silent data loss, manager resolution workflow works

### Scenario 5: UPI Payment Requires Internet
1. Cashier is offline
2. Tries to select "UPI" payment method
3. Button is disabled with tooltip: "UPI payment requires internet connection"
4. Cashier selects "Cash" instead
5. Invoice completes offline

**Verify**: UPI disabled offline, Cash works, clear messaging

### Scenario 6: Customer Search Offline
1. Cashier is offline
2. Types in customer search box
3. Local IndexedDB customers are searched (instant results)
4. Results show "cached" badge
5. Cashier selects customer from local cache
6. Bill completed offline

**Verify**: Customer search works offline with cached data

### Scenario 7: PWA Install
1. Open OmniBIZ on Chrome (desktop or mobile)
2. Browser shows "Install OmniBIZ" prompt
3. Click "Install" — app installs as standalone
4. App opens without browser chrome (no address bar)
5. Works like a native app

**Verify**: PWA installable, opens standalone, persists between sessions

### Scenario 8: Extended Offline (30+ minutes)
1. Shop loses internet for 30+ minutes
2. 15 bills are completed offline
3. All bills are queued in IndexedDB
4. No data loss — all bills have items, amounts, timestamps
5. Internet returns — all 15 bills sync successfully
6. Stock levels are updated correctly on server

**Verify**: Extended offline works, no data loss, complete sync

## Files to Create/Modify

### New Files
- `public/manifest.json` — PWA manifest
- `public/sw.js` — Service worker (or generated by Workbox)
- `src/lib/offline-db.ts` — IndexedDB schema and operations (using Dexie.js)
- `src/lib/offline-queue.ts` — Queue for pending operations
- `src/lib/sync-manager.ts` — Sync logic for online/offline transitions
- `src/components/connectivity-indicator.tsx` — Online/offline status component

### Modified Files
- `src/app/layout.tsx` — Add PWA meta tags, register service worker
- `src/app/(dashboard)/dashboard/billing/new/page.tsx` — Add offline detection, connectivity indicator, queue-based invoice submission
- `src/stores/pos-store.ts` — Add offline state tracking
- `next.config.ts` — Add PWA plugin config
- `package.json` — Add `@ducanh2912/next-pwa` or `workbox-webpack-plugin` + `dexie`

## Acceptance Criteria

- [ ] PWA manifest is valid and app is installable
- [ ] Service worker caches static assets and API responses
- [ ] Product search works offline (from IndexedDB cache)
- [ ] Customer search works offline (from IndexedDB cache)
- [ ] Invoice can be completed offline with Cash payment
- [ ] Pending invoices are queued and synced when back online
- [ ] Connectivity indicator shows online/offline status
- [ ] UPI payment is disabled when offline
- [ ] Stock conflicts are detected and flagged for manager review
- [ ] No data loss during extended offline periods (30+ minutes)
- [ ] Sync completes successfully for all pending invoices
- [ ] Toast notifications inform user of online/offline transitions
- [ ] App works as standalone PWA (no browser chrome)

## Dependencies

```json
{
  "dexie": "^4.x",
  "@ducanh2912/next-pwa": "^5.x"
}
```
