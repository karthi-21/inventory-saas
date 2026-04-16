# T074: Replace Jargon with Plain English

**Priority**: P0  
**Status**: done  
**Size**: M  
**Depends on**: —

## Problem

Multiple technical terms in the UI are meaningless to a basic-English kirana owner. Terms like "SKU", "Reorder Level", "Outstanding", "Business Intelligence", "Credit Period", and "Two-Factor Authentication" create comprehension barriers that make the app feel like it was built for accountants, not shopkeepers.

## Replacement Map

### "SKU" → "Product Code" (10 occurrences)

| File | Current | New |
|------|---------|-----|
| `inventory/page.tsx` (2x table header) | `<TableHead>SKU</TableHead>` | `<TableHead>Code</TableHead>` |
| `inventory/page.tsx` (product form label) | `<Label htmlFor="prod-sku">SKU</Label>` | `<Label htmlFor="prod-sku">Product Code</Label>` |
| `inventory/page.tsx` (2x search placeholder) | `Search by name or SKU...` | `Search by name or code...` |
| `inventory/page.tsx` (dialog description) | `SKU: {product.sku}` | `Code: {product.sku}` |
| `inventory/page.tsx` (dialog label) | `Reorder Level` | `Min Stock` |
| `billing/new/page.tsx` (search placeholder) | `Search by name, SKU, or barcode...` | `Search by name, code, or barcode...` |
| `reports/page.tsx` (table header) | `<TableHead>SKU</TableHead>` | `<TableHead>Code</TableHead>` |
| `reports/page.tsx` (CSV export key) | `SKU: stock.sku` | `Code: stock.sku` |

### "Reorder Level" → "Min Stock" (3 occurrences)

| File | Current | New |
|------|---------|-----|
| `inventory/page.tsx` (form label) | `Reorder Level` | `Min Stock` |
| `inventory/page.tsx` (dialog description) | `Reorder Level` | `Min Stock` |
| `dashboard/page.tsx` (low stock alert) | `items below reorder level` | `items running low on stock` |

### "Outstanding" → "Amount Due" (7 occurrences)

| File | Current | New |
|------|---------|-----|
| `reports/page.tsx` (tab id) | `outstanding` (keep id, change label) | label: `Amounts Due` |
| `reports/page.tsx` (summary text) | `Total Outstanding Credit` | `Total Amount Due` |
| `reports/page.tsx` (card title) | `Customers with Outstanding Balance` | `Customers with Amount Due` |
| `reports/page.tsx` (table header) | `Outstanding` | `Amount Due` |
| `vendors/page.tsx` (summary text) | `Outstanding` | `Amount Due` |
| `vendors/page.tsx` (table header) | `Outstanding` | `Amount Due` |
| `customers/page.tsx` (summary text) | `Outstanding Credit` | `Money Owed by Customers` |

### Other Replacements

| Current | New | Files |
|---------|-----|-------|
| Business intelligence and exportable reports | View and download your business reports | `reports/page.tsx` |
| Credit Period (days) | Payment Due in X Days | `vendors/page.tsx` (3 locations) |
| Two-Factor Authentication | Extra Login Security | `settings/page.tsx` (2 locations) |
| GSTIN | GST Number (GSTIN) | 9 locations across settings, customers, vendors, stores, onboarding |
| PAN | PAN (Tax ID) | 4 locations across settings, vendors, onboarding |
| Recall | Saved Bills | `billing/new/page.tsx` (3 locations) |
| Analytics | Sales Reports | `page.tsx` landing page |
| Run your store like a pro | Run your shop easily | `page.tsx` landing page |
| Items Running Low | Keep as-is (already good) | dashboard |

## Verification

- [ ] `/dashboard/inventory` — "Product Code" column header, "Min Stock" label, "Search by name or code..." placeholder
- [ ] `/dashboard/billing/new` — "Saved Bills" button, "Search by name, code, or barcode..." placeholder
- [ ] `/dashboard/customers` — "Money Owed by Customers" summary, "GST Number (GSTIN)" label
- [ ] `/dashboard/vendors` — "Amount Due" column, "Payment Due in X Days" label, "GST Number (GSTIN)" label
- [ ] `/dashboard/reports` — "View and download your business reports" subtitle, "Amounts Due" tab label
- [ ] `/dashboard/settings` — "GST Number (GSTIN)" label, "PAN (Tax ID)" label, "Extra Login Security" heading
- [ ] Landing page — "Run your shop easily" hero, "Sales Reports" feature card
- [ ] Browser Ctrl+F on each page for "SKU", "Reorder Level", "Outstanding" — zero results
- [ ] `npx tsc --noEmit` passes