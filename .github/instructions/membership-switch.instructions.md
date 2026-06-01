# Company Switch & Active Membership Rules

## Overview

The application supports multi-workspace access through the `memberships` table.

A user can belong to multiple workspaces and can also have multiple roles across different workspaces.

Users are able to switch active company/workspace from the application header using a "Switch Company" dropdown.

The selected membership becomes the active session context and affects:
- RBAC permissions
- visible data
- accessible menus
- API authorization
- page access
- UI visibility

---

# Active Membership Concept

The system must always have one active membership.

The active membership determines:
- current workspace
- current role
- permission scope
- accessible resources

---

# Default Membership Rules

When user logs in:

1. Fetch all memberships by `user_id`
2. Sort memberships consistently
3. Select the first membership as active membership
4. Save active membership into session/profile state

### Default Active Membership Example

If memberships are:

1. Workspace A → Admin
2. Workspace B → Manager
3. Workspace C → Viewer

Then default active membership is:

```ts
{
  workspaceId: "workspace_a",
  role: "admin"
}