# T001: Fix Supabase Project Connectivity

- **ID**: T001
- **Phase**: 1 - Foundation
- **Priority**: P0
- **Status**: done
- **Complexity**: S
- **Depends on**: (none)
- **Blocks**: T002, T003, T004, T005, T006, T024

## Problem

The Supabase project referenced in `.env.local` (`acspgntsgvjamywujzhb.supabase.co`) does not resolve in DNS. All database and auth operations fail. The application starts but every API call that touches Supabase or Prisma returns an error. This is the root blocker for the entire project.

DNS lookup result: `NXDOMAIN` — the project is either paused, deleted, or the URL is wrong.
Prisma connection test: `FATAL: tenant/user postgres.acspgntsgvjamywujzhb not found`

## Approach

1. Open Supabase dashboard at https://supabase.com/dashboard
2. Check if the project is paused (free tier projects pause after 1 week of inactivity)
3. If paused: click "Restore project" and wait for it to come back online
4. If the project is deleted/permanently gone: create a new project
   - Region: `ap-south-1` (Mumbai, closest for Indian retailers)
   - Name: `omnibiz-dev` (for development)
5. Copy the new project credentials into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL` (pooled connection on port 6543)
   - `DIRECT_URL` (direct connection on port 5432 for migrations)
6. Delete the duplicate `.env` file (keep only `.env.local`)
7. Run `npx prisma generate` to regenerate the Prisma client
8. Test connectivity: `node -e "const {PrismaClient}=require('./node_modules/.prisma/client');const p=new PrismaClient();p.\$connect().then(()=>{console.log('OK');p.\$disconnect()}).catch(e=>{console.error(e.message);process.exit(1)})"` 

## Files to Modify

- `.env.local` — update all Supabase credentials
- `.env` — DELETE this file (duplicate of .env.local, risk of committing secrets)

## Verification

- [ ] `nslookup <new-project>.supabase.co` returns an IP address
- [ ] `npx prisma db pull` completes without error (or fails with "no tables" which is OK before migrations)
- [ ] `npm run dev` starts without Supabase connection errors in console
- [ ] Signup page at `/signup` loads without `ERR_NAME_NOT_RESOLVED` in browser console