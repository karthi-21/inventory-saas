# T032: Add User/Role/Permission Management Page

- **ID**: T032
- **Phase**: 4 - Features
- **Priority**: P2
- **Status**: done
- **Complexity**: L
- **Depends on**: T012
- **Blocks**: (none)

## Problem

The Prisma schema defines a comprehensive RBAC system with `Persona`, `PersonaPermission`, `UserPersona`, and `UserStoreAccess` models. There is no UI to manage any of this. Users cannot:
- Invite new team members
- Assign roles/permissions
- Manage store access per user
- Create custom permission roles

The "Manage Team Members" button on settings page links nowhere.

## Approach

1. Create `/dashboard/team` page with tabs:
   - **Members**: List of users with their roles and store access
   - **Roles**: List of personas with their permissions (grid view)

2. **Members tab**:
   - Invite user (email + role + store assignment)
   - Edit role/store access
   - Remove user (soft delete / deactivate)

3. **Roles tab**:
   - List personas (Owner/Admin, Cashier, Manager, etc.)
   - Edit permissions grid (module × action checkboxes)
   - Create custom role

4. Create API routes:
   - `GET/POST /api/users` — list/invite users
   - `PUT/DELETE /api/users/[id]` — update/remove user
   - `GET/POST /api/personas` — list/create roles
   - `PUT/DELETE /api/personas/[id]` — update/delete role

5. Add navigation link in dashboard sidebar

## Files to Modify

- `src/app/(dashboard)/team/page.tsx` — NEW: team management page
- `src/app/api/users/route.ts` — NEW: user management API
- `src/app/api/users/[id]/route.ts` — NEW: user detail API
- `src/app/api/personas/route.ts` — NEW: persona management API
- `src/app/(dashboard)/layout.tsx` — add "Team" nav item
- `src/app/(dashboard)/settings/page.tsx` — update "Manage Team" button link

## Verification

- [ ] `/dashboard/team` page renders with members and roles tabs
- [ ] Can invite a new team member with a role
- [ ] Can edit a user's role and store access
- [ ] Can create a custom role with specific permissions
- [ ] Permissions are enforced via T012 when user tries unauthorized actions