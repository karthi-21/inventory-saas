# T040a: Verify POS Billing End-to-End with Real Data

- **ID**: T040a
- **Phase**: 4 - Features
- **Priority**: P2
- **Status**: done
- **Complexity**: L
- **Depends on**: T004
- **Blocks**: (none)

## Problem

The POS billing screen is the most complex page in the app. It needs thorough end-to-end verification with real data: product search, cart operations, customer selection, payment, hold/recall, and receipt generation.

## Approach

1. Navigate to `/dashboard/billing/new`
2. **Product Selection**:
   - Search for products by name
   - Filter by category
   - Add products to cart
   - Verify prices and GST calculations

3. **Cart Operations**:
   - Change quantity
   - Apply discount (per item and overall)
   - Remove item from cart
   - Verify running totals (subtotal, GST, discount, total)

4. **Customer Selection**:
   - Search for existing customer
   - Select customer for invoice
   - Verify loyalty points display
   - Test walk-in customer (no customer selected)

5. **Hold/Recall Bills**:
   - Hold a bill in progress
   - Start a new bill
   - Recall the held bill
   - Verify held bill state is preserved

6. **Payment**:
   - Test CASH payment
   - Test UPI payment
   - Test split payment (cash + UPI)
   - Test credit sale (amount due)
   - Verify loyalty points earned/redeemed

7. **Receipt**:
   - Verify receipt dialog appears after payment
   - Test print receipt (window.print)
   - Verify all receipt fields are correct

8. **Keyboard Shortcuts**:
   - F1-F4, Ctrl+H (hold), Ctrl+N (new bill)

9. Document any failures as bugs

## Files to Modify

- None — verification only. Failures create new tickets.

## Verification

- [ ] Products appear and can be added to cart
- [ ] Cart totals (subtotal, GST, discount, total) calculate correctly
- [ ] Customer search and selection works
- [ ] Hold and recall bills work
- [ ] Cash payment creates a successful invoice
- [ ] Split payment works
- [ ] Credit sale records amount due
- [ ] Receipt dialog shows correct data
- [ ] Keyboard shortcuts work