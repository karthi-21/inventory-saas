# T077: Simplify Billing Cancel/Return Dialog Text

**Priority**: P1  
**Status**: done  
**Size**: S  
**Depends on**: T073 (changes "Invoice" → "Bill")

## Problem

The billing cancel and return dialogs use legal-formal language that a basic English reader struggles with:

**Cancel Dialog (current):**
> "This will cancel invoice INV-001 and restore stock. This invoice has payments recorded. Please process a refund first. This action cannot be undone."

**Cancel Dialog (proposed):**
> "Cancel this bill? Stock will be put back."
> Warning: "This bill has payments. Please give refund first."
> "You cannot undo this."

**Return Dialog (current):**
> "Process Return" (dialog title)
> "Stock will be restored and credit balance adjusted"

**Return Dialog (proposed):**
> "Return Items" (dialog title)
> "Items go back to stock. Money adjusted in customer's account."

## Text Changes

### Cancel Dialog
| Element | Current | New |
|---------|---------|-----|
| Dialog title | `Cancel Invoice` | `Cancel Bill` |
| Cancel reason warning | Full legal paragraph | Simple 2-line text |
| "Keep Invoice" button | `Keep Invoice` | `Don't Cancel` |
| "Cancel Invoice" button | `Cancel Invoice` | `Cancel Bill` |
| Description with payments | `This invoice has payments recorded. Please process a refund first.` | `This bill has payments. Please give refund first.` |
| Description without payments | `This will cancel invoice {number} and restore stock.` | `Cancel this bill? Stock will be put back.` |
| Undo warning | `This action cannot be undone.` | `You cannot undo this.` |

### Return Dialog
| Element | Current | New |
|---------|---------|-----|
| Dialog title | `Process Return` | `Return Items` |
| Description | `Stock will be restored and credit balance adjusted` | `Items go back to stock. Money adjusted in customer's account.` |
| Button text | `Process Return` | `Return Items` |

## Files to Modify

- `src/app/(dashboard)/dashboard/billing/page.tsx`

## Verification

- [ ] `/dashboard/billing` — Click cancel on a bill → dialog title says "Cancel Bill"
- [ ] Cancel dialog shows plain English description
- [ ] "Don't Cancel" button instead of "Keep Invoice"
- [ ] Click return on a bill → dialog title says "Return Items"
- [ ] Return dialog shows "Items go back to stock" description
- [ ] Screenshot both dialogs for visual review
- [ ] `npx tsc --noEmit` passes