# T040: Fix Test Infrastructure (deps, config)

- **ID**: T040
- **Phase**: 5 - Testing
- **Priority**: P1
- **Status**: done
- **Complexity**: S
- **Depends on**: T005
- **Blocks**: T041, T042, T043

## Problem

The test infrastructure is configured but broken:
- `vitest.config.ts` references `@vitejs/plugin-react` which is NOT in `package.json`
- Test files import `vitest` and `@testing-library/react` which are NOT installed
- TypeScript errors in test files: `Cannot find module 'vitest'`
- Only 3 test files exist with minimal coverage

## Approach

1. Install missing test dependencies:
   ```bash
   npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event msw
   ```
2. Fix `vitest.config.ts` if needed
3. Fix type errors in existing test files:
   - `src/test/utils/tenant-isolation.test.ts` line 27: `tenant_id` doesn't exist on auth user type
   - `src/test/components/dashboard.test.tsx` line 7: `options` implicitly has `any`
4. Run `npx vitest run` and verify it completes (tests can fail, but should run)
5. Add test scripts to `package.json`:
   ```json
   "scripts": {
     "test": "vitest run",
     "test:watch": "vitest"
   }
   ```

## Files to Modify

- `package.json` — add test deps + scripts
- `vitest.config.ts` — fix if needed
- `src/test/utils/tenant-isolation.test.ts` — fix type errors
- `src/test/components/dashboard.test.tsx` — fix type errors

## Verification

- [ ] `npm run test` completes without module resolution errors
- [ ] All test files are found and loaded by Vitest
- [ ] TypeScript errors in test files are resolved
- [ ] MSW handlers are configured correctly