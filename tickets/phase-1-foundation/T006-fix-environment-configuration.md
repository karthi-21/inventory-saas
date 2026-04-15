# T006: Fix Environment Configuration

- **ID**: T006
- **Phase**: 1 - Foundation
- **Priority**: P0
- **Status**: done
- **Complexity**: S
- **Depends on**: T001
- **Blocks**: T052

## Problem

Several environment configuration issues:

1. **Duplicate `.env` and `.env.local`**: Both exist with identical content. `.env` is commonly committed to VCS and contains secrets (Supabase service role key, Razorpay secrets, DB password). Only `.env.local` should exist.

2. **`WHATSAPP_BUSINESS_TOKEN` is still a placeholder**: Value is `your_whatsapp_business_token` — any WhatsApp integration will fail.

3. **Missing `RAZORPAY_WEBHOOK_SECRET` in `.env.local.example`**: The example file doesn't document this variable, but it's used in `/api/payments/verify`.

4. **Missing feature flag documentation**: `NEXT_PUBLIC_ENABLE_EMAIL_AUTH`, `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH`, `NEXT_PUBLIC_ENABLE_PHONE_AUTH` are configured but not documented in `.env.local.example`.

5. **Supabase client mock behavior**: `src/lib/supabase/client.ts` returns a mock client when env vars are missing. The mock silently returns `{ error: null }` for auth operations, making failures invisible in production.

6. **Server Supabase client uses non-null assertions**: `src/lib/supabase/server.ts` uses `!` on env vars — will crash instead of graceful degradation if they're missing.

## Approach

1. Delete `.env` (keep only `.env.local`)
2. Update `.env.local.example` to include ALL env vars with descriptions:
   - Add `RAZORPAY_WEBHOOK_SECRET`
   - Add `NEXT_PUBLIC_ENABLE_EMAIL_AUTH`
   - Add `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH`
   - Add `NEXT_PUBLIC_ENABLE_PHONE_AUTH`
3. Set `WHATSAPP_BUSINESS_TOKEN` to empty string or remove the key (not needed for v1)
4. Fix `src/lib/supabase/client.ts`: throw an error in production if env vars are missing instead of returning a silent mock
5. Fix `src/lib/supabase/server.ts`: add proper error messages when env vars are missing
6. Add `.env` to `.gitignore` explicitly (belt and suspenders)

## Files to Modify

- `.env` — DELETE
- `.env.local.example` — add missing variables with descriptions
- `src/lib/supabase/client.ts` — replace silent mock with explicit error in production
- `src/lib/supabase/server.ts` — add error messages for missing env vars
- `.gitignore` — add `.env` explicitly

## Verification

- [ ] `.env` file no longer exists
- [ ] `.env.local.example` documents ALL environment variables
- [ ] `WHATSAPP_BUSINESS_TOKEN` is either set or removed from `.env.local`
- [ ] Supabase client throws in production when env vars missing (not silent mock)
- [ ] Server client provides useful error message when env vars missing