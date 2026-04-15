# T023: Fix .next Directory Permissions

- **ID**: T023
- **Phase**: 3 - Critical Bugs
- **Priority**: P1
- **Status**: todo
- **Complexity**: S
- **Depends on**: T001
- **Blocks**: (none)

## Problem

The `.next/` build cache contains files owned by `root` (from a previous Docker or sudo build). This causes `next build` to fail with:
```
Error: EACCES: permission denied, unlink '/Users/karthikeyan/Desktop/store/.next/build/package.json'
```

The `.next/` directory cannot be deleted without sudo, and `chown` also fails without sudo on the root-owned files.

## Approach

1. Run from terminal (not from Claude, since we can't sudo):
   ```bash
   sudo rm -rf .next
   ```
2. To prevent this from happening again:
   - Add `.next/` to `.gitignore` if not already there
   - Never run `next build` or `npm run dev` with `sudo`
   - If using Docker, ensure the build output is mounted with correct user permissions

## Files to Modify

- `.gitignore` — ensure `.next` is listed (it likely already is)

## Verification

- [ ] `rm -rf .next` works without sudo
- [ ] `npx next build` completes without EACCES errors
- [ ] `.next/` files are owned by `karthikeyan` (not root)