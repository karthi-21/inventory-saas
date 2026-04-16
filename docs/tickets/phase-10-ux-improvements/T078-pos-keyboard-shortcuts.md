# T078: Add POS Keyboard Shortcuts Discoverability

**Priority**: P2  
**Status**: done  
**Size**: S  
**Depends on**: —

## Problem

The POS billing page has keyboard shortcuts (F1-F4, Ctrl+H, Ctrl+N) that are never shown on screen. A billing desk operator who needs speed will never discover them.

## Implementation

Add a "?" button or "Shortcuts" link in the POS page header that opens a popover/dialog showing all keyboard shortcuts:

| Shortcut | Action |
|----------|--------|
| F1 | Search products |
| F2 | Select customer |
| F3 | Open payment |
| F4 | Print receipt |
| Ctrl+H | Hold bill |
| Ctrl+N | New bill |
| Esc | Close dialog |

Position: Top-right of the POS page, next to the store selector.

## Files to Modify

- `src/app/(dashboard)/dashboard/billing/new/page.tsx`

## Verification

- [ ] `/dashboard/billing/new` — Screenshot shows "?" or "Shortcuts" button visible
- [ ] Click the button — popover/dialog shows all keyboard shortcuts
- [ ] Verify shortcuts match actual key bindings in the component's `useEffect` handlers
- [ ] `npx tsc --noEmit` passes