# T052: Remove Duplicate .env / Clean Up Config

- **ID**: T052
- **Phase**: 6 - Production
- **Priority**: P2
- **Status**: done
- **Complexity**: S
- **Depends on**: T006
- **Blocks**: (none)

## Problem

After T006, `.env` should be deleted. This ticket tracks verifying the cleanup is complete and adding extra safety measures.

## Approach

1. Verify `.env` has been deleted (from T006)
2. Verify `.env.local` is in `.gitignore`
3. Add a pre-commit hook or CI check that prevents committing secrets:
   - `grep -r "supabase.co" --include="*.ts" --include="*.tsx" --include="*.js" src/` (no hardcoded URLs)
   - Use `detect-secrets` or `git-secrets` tool
4. Clean up any other config inconsistencies:
   - Remove `razorpay_test_api_keys_*.csv` files (should be gitignored)
   - Verify no real API keys in source code
5. Update `.env.local.example` to be comprehensive (should be done by T006, verify here)

## Files to Modify

- `.gitignore` — ensure secret files are excluded
- `.github/workflows/deploy.yml` — add secret detection step (optional)

## Verification

- [ ] `.env` file does not exist
- [ ] `.env.local` is in `.gitignore`
- [ ] No hardcoded Supabase URLs in source code
- [ ] No real API keys in git history (check with `git log -p -- .env`)
- [ ] `razorpay_test_api_keys_*.csv` is gitignored