# T075: Replace Browser confirm() with Styled Dialogs

**Priority**: P1  
**Status**: done  
**Size**: M  
**Depends on**: —

## Problem

4 pages use browser native `confirm()` for destructive actions, and 2 pages have zero confirmation for destructive actions. The native dialog:
1. Doesn't match the app's design system (looks like a browser alert)
2. Provides no undo option
3. Shows no warning about what data will be lost
4. Is inconsistent with the rest of the app which uses styled `Dialog` components

## Current Locations

### Using browser `confirm()` (4 locations)
| File | Line | Current Text |
|------|------|-------------|
| `customers/page.tsx` | 411 | `confirm('Delete this customer?')` |
| `vendors/page.tsx` | 414 | `confirm('Delete this vendor?')` |
| `team/page.tsx` | 691 | `confirm('Remove this team member?')` |
| `team/page.tsx` | 763 | `confirm('Delete this role?')` |

### No confirmation at all (2 locations)
| File | Line | Action |
|------|------|--------|
| `stores/page.tsx` | 754 | Deletes location immediately on click |
| `stores/page.tsx` | 473,484 | Archives/restores store immediately |

## Implementation Pattern

Follow the existing pattern from `categories/page.tsx` which uses `useState` + `<Dialog>`:

```tsx
const [showDeleteDialog, setShowDeleteDialog] = useState(false)
const [itemToDelete, setItemToDelete] = useState<string | null>(null)

// In the table action:
<Button
  variant="ghost"
  size="icon"
  onClick={() => { setItemToDelete(customer.id); setShowDeleteDialog(true) }}
>
  <Trash2 className="h-4 w-4 text-destructive" />
</Button>

// Dialog JSX:
<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete Customer?</DialogTitle>
      <DialogDescription>
        This will permanently delete this customer and all their purchase history. This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
      <Button variant="destructive" onClick={() => { deleteCustomer.mutate(itemToDelete!); setShowDeleteDialog(false) }}>
        Delete Customer
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Dialog Text for Each Location

1. **Customers**: "Delete this customer? Their purchase history and any outstanding credit will be permanently removed. This cannot be undone."
2. **Vendors**: "Delete this vendor? Purchase records will be kept but vendor details will be removed. This cannot be undone."
3. **Team**: "Remove this team member? They will lose access to the store. This cannot be undone."
4. **Team (role)**: "Delete this role? Users with this role will lose their permissions. This cannot be undone."
5. **Stores (location)**: "Delete this location? Stock at this location will need to be moved first. This cannot be undone."
6. **Stores (archive)**: "Archive this store? All data will be preserved but the store will be hidden from views. You can restore it later."

## Files to Modify

- `src/app/(dashboard)/dashboard/customers/page.tsx`
- `src/app/(dashboard)/dashboard/vendors/page.tsx`
- `src/app/(dashboard)/dashboard/team/page.tsx`
- `src/app/(dashboard)/dashboard/stores/page.tsx`

## Verification

- [ ] `/dashboard/customers` — Click delete → styled dialog appears (not browser popup), screenshot
- [ ] `/dashboard/vendors` — Click delete → styled dialog appears, screenshot
- [ ] `/dashboard/team` — Click remove member → styled dialog, screenshot
- [ ] `/dashboard/team` — Click delete role → styled dialog, screenshot
- [ ] `/dashboard/stores` — Click delete location → confirmation dialog appears, screenshot
- [ ] `/dashboard/stores` — Click archive store → confirmation dialog appears, screenshot
- [ ] All dialogs have clear warning text and Cancel + Destructive buttons
- [ ] `npx tsc --noEmit` passes