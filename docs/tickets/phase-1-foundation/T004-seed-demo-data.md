# T004: Seed Demo Data

- **ID**: T004
- **Phase**: 1 - Foundation
- **Priority**: P0
- **Status**: done
- **Complexity**: S
- **Depends on**: T002
- **Blocks**: T005, T036, T037, T038, T039, T040a, T040b, T040c, T053

## Problem

The database will be empty after migrations. The seed file at `prisma/seed.ts` creates a demo electronics store with products, categories, customers, and a vendor — but it has never been run against a live database.

Current seed data includes:
- 1 Tenant ("Demo Electronics Store", PRO plan)
- 1 User (`demo@ezvento.karth-21.com` / `demo123`, owner)
- 1 Store ("Chennai Main Store", ELECTRONICS)
- 4 Categories (Mobiles, TVs, Accessories, Audio)
- 4 Products (iPhone 15 Pro, Samsung 43" TV, Sony headphones, Anker charger)
- 4 Inventory records
- 2 Customers, 1 Vendor
- Settings, persona, subscription

**Gaps**: No sales invoices, no purchase invoices, no stock movements, no loyalty points logs. The seed needs enhancement (tracked in T053) but the initial seed must work first.

## Approach

1. After T002 completes, run the seed:
   ```bash
   npx prisma db seed
   ```
2. If the seed script isn't configured in `package.json`, add:
   ```json
   "prisma": { "seed": "npx tsx prisma/seed.ts" }
   ```
3. Verify data was created:
   ```bash
   node -e "
   const {PrismaClient}=require('./node_modules/.prisma/client');
   const p=new PrismaClient();
   Promise.all([
     p.tenant.count(), p.user.count(), p.store.count(),
     p.product.count(), p.customer.count(), p.vendor.count()
   ]).then(r=>console.log({tenants:r[0],users:r[1],stores:r[2],products:r[3],customers:r[4],vendors:r[5]})).then(()=>p.\$disconnect());
   "
   ```
4. Verify the demo user can log in via Supabase Auth:
   - The seed creates a user in Prisma but NOT in Supabase Auth
   - You need to create the auth user manually in Supabase Dashboard > Authentication > Users
   - Or update the seed to use `supabase.auth.admin.createUser()` with the service role key

## Files to Modify

- `package.json` — add `prisma.seed` config if missing
- `prisma/seed.ts` — may need to add Supabase Auth user creation

## Verification

- [ ] `npx prisma db seed` completes without error
- [ ] All entity counts are > 0 (tenant, user, store, product, customer, vendor)
- [ ] Demo user exists in both Prisma (`User` table) AND Supabase Auth
- [ ] Demo user can log in at `/login` with `demo@ezvento.karth-21.com` / `demo123`