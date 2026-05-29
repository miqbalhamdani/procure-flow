# RBAC Rules — ProcureFlow

## Core Rules

- Always validate authorization on server
- Never trust frontend authorization
- Always filter data by `workspace_id` in memberships table (not in user table)
- Resolve accessible company IDs via `getCurrentWorkspaceContext().accessibleWorkspaceIds`
- Always validate company ownership
- Hide sidebar/menu if user has no access
- Use permission-based architecture
- Default behavior = deny access

---

# Roles

- Admin
- Manager
- Procurement
- Logistics
- Supplier
- Viewer

Users can have multiple roles.

---

# Permission Strategy

Never use:

```ts
if (role === "admin")
```

Always use:

```ts
hasPermission(user, "purchaseOrder.create")
```

---

# Supplier Module

## Admin
- Full access

## Manager
- Full access

## Viewer
- View only

## Others
- No access

---

# Purchase Order Module

## Admin
- Full access

## Manager
- View only
- Approve PO
- Reject PO

## Procurement
- View List
- View Detail
- Create
- Edit
- Delete
- Submit

Restrictions:
- Cannot edit/delete after Submitted
- Cannot edit/delete after Approved
- Cannot edit/delete after Rejected

## Supplier
- Read only
- Cannot view Rejected PO
- Cannot view Draft PO

## Logistics
- Read only
- Cannot view Rejected PO
- Cannot view Draft PO

## Viewer
- View only

---

# Shipment Module

## Admin
- Full access

## Manager
- View only

## Procurement
- View only

## Supplier
- View own company shipment only
- Create
- Edit
- Delete
- Mark In Transit

Restrictions:
- Cannot edit after In Transit
- Cannot edit after Delivered

## Logistics
- View own company shipment only
- Mark Delivered

Restrictions:
- Cannot edit shipment content
- Cannot edit after Delivered

## Viewer
- View only

---

# Purchase Order Status Flow

```txt
Draft → Submitted → Approved / Rejected
```

Rules:
- Only Draft can be edited
- Submitted PO is immutable
- Approved PO is immutable
- Rejected PO is immutable

---

# Shipment Status Flow

```txt
Pending → In Transit → Delivered
```

Rules:
- No backward transition
- Delivered is immutable

---

# UI Rules

Always hide unauthorized:
- sidebar menu
- buttons
- actions
- routes
- tabs

Never show disabled unauthorized actions.

---

# Required Structure

```txt
policies/
├── supplier.policy.ts
├── purchaseOrder.policy.ts
├── shipment.policy.ts
└── workspace.policy.ts
```

All RBAC logic MUST live in `policies/`.