# T002: Apply Database Migrations

- **ID**: T002
- **Phase**: 1 - Foundation
- **Priority**: P0
- **Status**: done
- **Complexity**: S
- **Depends on**: T001
- **Blocks**: T003, T004

## Problem

The Prisma schema at `prisma/schema.prisma` defines 25+ models but the database has no tables. The migration SQL at `prisma/migrations/init/migration.sql` (32KB) contains the full DDL but has never been applied to a live database.

## Approach

1. After T001 completes (Supabase is reachable), run:
   ```bash
   npx prisma db push
   ```
   This applies the schema directly. Alternatively, use the migration:
   ```bash
   npx prisma migrate deploy
   ```
2. Verify all tables were created:
   ```bash
   npx prisma db pull --print
   ```
   Should show all 25+ models.
3. Verify foreign keys exist:
   ```sql
   SELECT count(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';
   ```
4. Run `npx prisma generate` to ensure the client is up to date.

## Files to Modify

- No file changes — this is a database operation only

## Verification

- [ ] `npx prisma db pull --print` shows all models from schema.prisma
- [ ] All tables exist in Supabase Table Editor
- [ ] Foreign key constraints are present
- [ ] `npx prisma generate` succeeds