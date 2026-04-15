# T050: Fix CI/CD Pipeline (GitHub Actions)

- **ID**: T050
- **Phase**: 6 - Production
- **Priority**: P1
- **Status**: done
- **Complexity**: M
- **Depends on**: T040
- **Blocks**: T051

## Problem

The existing `.github/workflows/deploy.yml` has potential issues:
- Uses `amondnet/vercel-action@v25` — need to verify this action is still maintained
- No test step in the pipeline (tests should run before deploy)
- No environment variable setup for build
- No branch protection (deploys on every push to main)

## Approach

1. Update `.github/workflows/deploy.yml`:
   - Add test job: `npm run test` before build
   - Add typecheck job: `npx tsc --noEmit`
   - Add lint job: `npm run lint`
   - Only deploy after all checks pass
   - Only deploy on main branch pushes (not PRs)
   - Add Vercel environment variables for build

2. Verify Vercel action version and configuration
3. Add branch protection rules (via GitHub settings or workflow):
   - PRs require passing CI before merge
   - At least 1 approval required

## Files to Modify

- `.github/workflows/deploy.yml` — update pipeline

## Verification

- [ ] Pipeline runs on PR creation
- [ ] Test step runs and can fail the pipeline
- [ ] Typecheck step runs and can fail the pipeline
- [ ] Deploy only happens on main branch after CI passes
- [ ] PRs from forks/branches must pass CI