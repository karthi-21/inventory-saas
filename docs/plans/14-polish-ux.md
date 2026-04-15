# Day 14: UX Polish, Performance & Accessibility

## Goal
The app feels fast, polished, and works for everyone — including users with slow connections and accessibility needs.

---

## Why This Day Matters
An app that feels fast and polished builds trust. A retailer using it daily needs it to be responsive even on 3G. Accessibility ensures we serve all users.

---

## Tasks

### 14.1 Performance Optimization
- [ ] Run Lighthouse audit → fix all issues
- [ ] Image optimization:
  - Next.js Image component for all product images
  - Auto-generate WebP/AVIF
  - Lazy load below-fold images
  - Product image size: max 400x400 for list, 800x800 for detail
- [ ] Bundle optimization:
  - Dynamic imports for heavy components (charts, print dialogs)
  - Remove unused libraries
- [ ] API response caching:
  - React Query: products cache 5 min, customers 1 min
  - Static pages: cache for 1 hour
- [ ] Prisma query optimization:
  - Select only needed fields (avoid `select: { *: true }`)
  - Add indexes for frequently queried columns
  - Pagination for all list endpoints

### 14.2 Mobile-First Polish
- [ ] Touch targets: all buttons min 44x44px
- [ ] Swipe gestures:
  - Swipe left on cart item → delete
  - Swipe right on invoice → view details
- [ ] Bottom navigation (mobile): replace sidebar with bottom tabs
  - Home, POS, Products, Customers, More
- [ ] Responsive tables: horizontal scroll with sticky first column
- [ ] Mobile-optimized receipt: fits 58mm width

### 14.3 Loading States
- [ ] Skeleton loaders for all list views
- [ ] Button loading states (disable + spinner)
- [ ] Search: debounce 300ms before API call
- [ ] Optimistic updates for cart operations

### 14.4 Offline Handling
- [ ] POS offline mode (Day 15, stretch goal)
- [ ] For v1: clear "No internet connection" message
- [ ] Save cart state to localStorage
- [ ] Retry failed API calls when online

### 14.5 Accessibility (a11y)
- [ ] Keyboard navigation: Tab through all interactive elements
- [ ] Focus indicators: visible outline on focus
- [ ] ARIA labels on icon-only buttons
- [ ] Alt text on all images
- [ ] Color contrast: WCAG AA minimum (4.5:1 for text)
- [ ] Screen reader tested: NVDA on Windows, VoiceOver on Mac
- [ ] Skip to main content link

### 14.6 Error Handling Polish
- [ ] Toast notifications (Sonner already installed):
  - Success: green, auto-dismiss 3s
  - Error: red, requires dismiss
  - Info: blue, auto-dismiss 5s
- [ ] Form validation: inline errors below fields
- [ ] API errors: show user-friendly message, not technical error
- [ ] "Something went wrong" page with retry button

### 14.7 Empty States
- [ ] Products: "No products yet" with "Add Product" + "Import CSV" CTA
- [ ] Customers: "No customers yet" with "Add Customer" CTA
- [ ] Invoices: "No invoices yet" with "Create First Invoice" CTA
- [ ] Dashboard: skeleton with placeholder stats

### 14.8 Animations & Micro-interactions
- [ ] Page transitions: subtle fade
- [ ] Button press: scale(0.98) feedback
- [ ] Toast slide-in from top-right
- [ ] Dialog open: scale(0.95) → scale(1) + fade
- [ ] Cart item add: brief highlight
- [ ] Success states: checkmark animation

---

## Deliverable
An app that scores 90+ on Lighthouse, works well on 3G, and is accessible to users with disabilities.

---

## Dependencies
- All previous days (this is polish on completed features)
- Lighthouse CLI
- axe-core for accessibility testing
