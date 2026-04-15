# T031: Implement Settings Change Password & 2FA

- **ID**: T031
- **Phase**: 4 - Features
- **Priority**: P2
- **Status**: done
- **Complexity**: M
- **Depends on**: T005
- **Blocks**: (none)

## Problem

The settings page has three non-functional buttons:
1. "Change Password" (line ~461) — no `onClick` handler
2. "Enable" 2FA (line ~468) — no `onClick` handler
3. "Manage" Team Members (line ~440) — no `onClick` handler

These are stub buttons that do nothing when clicked.

## Approach

1. **Change Password**: Use Supabase Auth's `updateUser({ password })` method
   - Show a dialog with current password + new password + confirm
   - Call `supabase.auth.updateUser({ password: newPassword })`
   - Show success/error toast

2. **2FA**: Supabase Auth supports MFA via TOTP
   - This is a larger feature — for v1, show a "Coming soon" message or link to Supabase docs
   - If implementing: use `supabase.auth.mfa.enroll()` and `supabase.auth.mfa.challenge()`

3. **Team Members**: Link to the User/Role management page (T032)
   - For now: link to `/dashboard/team` (which doesn't exist yet)
   - Or show "Coming soon" toast

## Files to Modify

- `src/app/(dashboard)/settings/page.tsx` — add handlers for the three buttons

## Verification

- [ ] "Change Password" opens a dialog with form
- [ ] Password change succeeds via Supabase Auth
- [ ] 2FA button shows appropriate messaging
- [ ] "Manage Team" button navigates or shows messaging