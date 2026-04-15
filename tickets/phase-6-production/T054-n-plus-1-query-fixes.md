# T054: N+1 Query Performance Fixes

- **ID**: T054
- **Phase**: 6 - Production
- **Priority**: P2
- **Status**: done
- **Complexity**: L
- **Depends on**: T005
- **Blocks**: (none)

## Problem

Several API routes have N+1 query patterns that will degrade performance with large datasets:

1. **`/api/inventory` GET** — For each stock record, a separate `prisma.stockMovement.findMany` call fetches recent movements (line ~65 in route.ts)
2. **`/api/customers` GET** — For each customer, a separate query calculates outstanding amount
3. **`/api/vendors` GET** — For each vendor, separate queries for total purchases and outstanding amount
4. **`/api/notifications` GET** — Three separate queries (low stock, pending payments, new customers) could be combined

## Approach

1. **Inventory**: Use `include: { stockMovements: { take: 5, orderBy: { createdAt: 'desc' } } }` in the main query instead of separate per-record queries

2. **Customers**: Use a single aggregation query:
   ```typescript
   const outstandingByCustomer = await prisma.salesInvoice.groupBy({
     by: ['customerId'],
     where: { tenantId, status: { in: ['DUE', 'PARTIAL'] } },
     _sum: { totalAmount: true },
   })
   ```
   Then map the results in-memory.

3. **Vendors**: Same pattern as customers — aggregate purchase totals in one query, then map.

4. **Notifications**: Combine into a single query using `Promise.all` (already used), but each individual query should use proper indexing.

5. Add database indexes for commonly filtered columns:
   - `InventoryStock: [storeId, productId]`
   - `SalesInvoice: [tenantId, status]`
   - `Customer: [tenantId, type]`

## Files to Modify

- `src/app/api/inventory/route.ts` — fix N+1 for stock movements
- `src/app/api/customers/route.ts` — fix N+1 for outstanding
- `src/app/api/vendors/route.ts` — fix N+1 for purchase totals
- `prisma/schema.prisma` — add `@@index` declarations

## Verification

- [ ] Inventory API makes 1-2 queries instead of N+1
- [ ] Customers API makes 2-3 queries instead of N+1
- [ ] Vendors API makes 2-3 queries instead of N+1
- [ ] Response time is consistent regardless of record count
- [ ] Database indexes are created for common filter columns