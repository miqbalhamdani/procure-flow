Here is your **fully finalized, clean, and aligned PRD (MVP)** with all updates applied, inconsistencies resolved, and product decisions tightened.

---

# 📦 **ProcureFlow — Multi-Tenant Procurement & Shipment SaaS (Final PRD)**

*(Based on your latest version with final product refinements)*

---

## 1. 🧭 Product Overview

**Product Name:** ProcureFlow

**Type:** B2B SaaS (Multi-Tenant, Hierarchical)

**Target Users:** Companies managing procurement & shipment operations

**Core Value Proposition:**

> Enable companies to manage purchase orders, approvals, and shipment tracking in a centralized, simple, and scalable system — including multi-company (parent-child) visibility.
> 

---

## 2. 🎯 Product Goals (Added)

### Primary Goals (MVP)

- Digitize procurement workflow (PO → Approval → Shipment)
- Provide clear shipment tracking visibility
- Support multi-company structure (parent-child)
- Enable role-based collaboration across teams

---

### Success Metrics (MVP)

- of POs created per workspace
- % of approved POs
- of shipments created
- Weekly active workspaces
- Conversion rate: Free → Pro

---

## 3. 👥 Actors & Roles (Final)

### Internal Actors

### 1. Procurement Staff

- Create Purchase Orders
- View shipments

---

### 2. Management / Manager

- Approve / reject PO
- Manage suppliers (CRUD)
- Create Purchase Orders
- Create shipment
- Update shipment status
- Full operational access

---

### 3. Logistics Staff

- View shipments
- Update shipment status:
    - In Transit → Delivered

---

### 4. Admin (Workspace Admin)
- Manage users & roles (within workspace)
- Manage parent-child structure
- Full access to all operational features

### 5. Super Admin (Platform Owner)
- Create workspace
- Add users to workspace
- Assign Admin role
- Not restricted by workspace

---

### External Actor (Now System User)

### 6. Supplier

- Can login into system
- Scoped to assigned company

**Permissions:**

- View assigned PO only
- Create shipment
- Update shipment:
    - Set **In Transit**
    - Add location / notes

**Restrictions:**

- Cannot view other suppliers’ data
- Cannot approve PO
- Cannot access company settings

---

### 7. Viewer

- Read-only access to all modules

---

### 🔐 Data Access Rule (Critical)

- Supplier can only access:

```sql
purchase_orders WHERE supplier_id = current_supplier_id
```

- All queries must enforce:

```sql
workspace_id = active_workspace
```

---

---

## 4. 🧠 Multi-Tenant Model (Final)

### Concept

- Each **workspace = 1 company**
- Supports **parent-child hierarchy (max 2 levels)**

---

### Structure

```
Parent Company
   ├── Child Company A
   ├── Child Company B
```

---

### Rules

### Data Isolation

- Strict by `workspace_id`
- No cross-tenant access

---

### Parent vs Child

| Level | Access |
| --- | --- |
| Parent | View all child data |
| Child | Only own data |

---

### Supplier Scope

- Suppliers belong to **child company only**
- Parent must select child company before using suppliers

---

### User Access

- Users can belong to multiple companies
- Users can switch company context
- Parent users must be granted access to child company

---

### UX Behavior

| Context | Behavior |
| --- | --- |
| Child company | Auto-selected |
| Parent company | Must select company |

---

## 5. 🧩 Core Modules (MVP)

---

### 📄 A. Authentication & Workspace

### Features:

- Register / Login (Supabase Auth)
- Create workspace
- Only Super Admin can create workspace
- Create child company (Pro only)
- Invite users
- Assign roles:
    - Admin
    - Manager
    - Procurement
    - Logistics
    - Supplier
    - Viewer
- Users cannot exist without workspace assignment

---

### 📄 B. Supplier Module

### Features:

- Create supplier
- Edit supplier
- List suppliers

---

### Rules:

- Supplier tied to `workspace_id`
- Supplier visible only within company

---

### Parent Behavior:

- Supplier list empty by default
- Must select child company

---

### 📄 C. Purchase Order Module

---

### Status Flow:

```
Draft → Submitted → Approved / Rejected
```

---

### Features:

- Create PO:
    - Supplier
    - Items (name, qty, price)
    - Company (conditional)

---

### Company Logic:

| User Type | Behavior |
| --- | --- |
| Child | Auto-selected |
| Parent | Must select company |

---

### Rules:

- Only **Approved PO → Shipment allowed**
- PO bound to company

---

### Purpose of Approval:

- Budget control
- Authorization
- Audit trail

---

### 📄 D. Shipment Module

---

### Status Flow:

```
Pending → In Transit → Delivered
```

---

### Features:

- Create shipment (from approved PO)
- Update shipment status
- Shipment timeline (events)

---

### Responsibility Split:

| Action | Role |
| --- | --- |
| Create shipment | Manager / Supplier |
| Set In Transit | Supplier |
| Set Delivered | Logistics / Manager |

---

### Data Model:

- `shipments.status` → current state
- `shipment_events` → history

---

### Rules:

- Must reference PO
- PO must be Approved
- No backward status

---

### 📄 E. Dashboard

### Features:

- Total PO
- PO status summary
- Shipment summary
- Recent activity

---

### Parent Behavior:

- Aggregated across child companies

---

### 📄 F. Billing Module (Final)

---

### Plans

### Free Plan

| Feature | Limit |
| --- | --- |
| Purchase Orders | 30 / month |
| Shipments | 30 / month |
| Users | 5 |
| Companies | 1 |

---

### Pro Plan

- Unlimited usage
- Multi-company (parent-child enabled)

---

### Feature Gating

| Feature | Free | Pro |
| --- | --- | --- |
| PO Module | ✅ | ✅ |
| Shipment Module | ✅ | ✅ |
| Multi-company | ❌ | ✅ |

---

### UX Behavior

- Show usage (e.g. 20/30 PO)
- Disable when limit reached
- Show upgrade CTA

---

## 7. 🔐 RBAC (Final)

| Role        | Permissions                    |
| ----------- | ------------------------------ |
| Super Admin | Create workspace, assign users |
| Admin       | Full workspace control         |
| Manager     | Operational control            |
| Procurement | Create PO                      |
| Logistics   | Update shipment                |
| Supplier    | Limited                        |
| Viewer      | Read-only                      |

---

### Shipment Permissions

| Action | Role |
| --- | --- |
| Create | Manager, Supplier |
| In Transit | Supplier |
| Delivered | Logistics, Manager |

---

## 8. 🔄 End-to-End Workflow

```
1. Procurement creates PO (Draft)
2. Submit PO
3. Manager approves PO
4. Shipment created (Manager / Supplier)
5. Supplier sets In Transit (location)
6. Logistics marks Delivered
```

---

## 9. 🗂️ Data Model (Final)

```
users
- id
- email
- is_super_admin (boolean, default false)

workspaces
- id
- name
- parent_id

memberships
- user_id
- workspace_id
- role

suppliers
- id
- workspace_id
- name

purchase_orders
- id
- workspace_id
- supplier_id
- status

po_items
- id
- purchase_order_id
- name
- qty
- price

shipments
- id
- workspace_id
- purchase_order_id
- status

shipment_events
- id
- shipment_id
- status
- note
- timestamp

subscriptions
- workspace_id
- plan
- usage_po
- usage_shipment
```

---

## 10. 🖥️ Frontend Requirements (Final)

---

### Tech Stack

- Next.js
- Tailwind CSS
- TypeScript
- Shadcn UI
- Supabase
- Drizzle ORM
- Vercel

---

### Pages

- `/dashboard`
- `/purchase-orders`
- `/purchase-orders/:id`
- `/purchase-orders/:id/shipments`
- `/purchase-orders/:id/shipments/:id`
- `/suppliers`
- `/settings`
- `/billing`

---

### UX Pattern

Inside PO Detail:

```
[Details] [Items] [Shipments]
```

---

### Key Patterns

- `useAuth()`
- `useWorkspace()`
- `useCompanyContext()`
- API abstraction
- Reset state on switch

---

## 11. ⚠️ Edge Cases

- Unauthorized workspace access → deny
- Parent without child access → hidden
- Shipment before approval → blocked
- Free limit reached → block action
- Supplier sees only assigned PO
- Empty supplier (parent context) → show guidance

---

## 12. 🧪 Non-Functional Requirements

- Responsive UI
- <2s load time
- Clear error/loading states
- Clean UX & validation
- Audit logging (recommended)

---

## 13. 🚀 Deployment

- Frontend: Vercel
- Backend: Supabase
- ORM: Drizzle ORM
- Auth: Supabase Auth

---

# 🎯 14. MVP Scope Summary

---

### ✅ Included

- Multi-tenant + parent-child
- Full PO → Shipment workflow
- Supplier login (MVP included)
- RBAC system
- Dashboard
- Billing (limits + gating)

---

### ❌ Excluded

- Supplier external portal (advanced)
- 3rd party logistics integration
- Multi-level approval
- Notifications
- Payment integration
