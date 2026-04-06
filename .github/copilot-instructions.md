# 🧠 Copilot Instructions — ProcureFlow

---

## 📦 1. Product Context

ProcureFlow is a **B2B multi-tenant SaaS** for procurement & shipment.

Core modules:

* Dashboard
* Suppliers
* Purchase Orders
* Shipments
* Billing
* Companies (multi-tenant)
* Users

Multi-tenant model:

* 1 workspace = 1 company
* Supports parent → child (max 2 levels)

---

## 🔐 2. Critical Rules

These rules are NON-NEGOTIABLE:

* ALWAYS include `workspace_id` in every query
* NEVER allow cross-workspace access
* ALWAYS validate RBAC via policies
* NEVER query database from UI/components
* ALWAYS use service layer

Hierarchy rules:

* Parent → can access child data
* Child → only its own data

Supplier restriction:

```sql
purchase_orders WHERE supplier_id = current_supplier_id
```

---

## 🏗️ 3. Tech Stack

* Next.js (App Router)
* TypeScript (strict)
* Tailwind CSS + shadcn/ui
* Supabase (Auth + DB)
* Vercel

---

## 📁 4. Project Structure

* `app/` → routing
* `features/` → business modules (MAIN SOURCE)
* `components/` → UI only
* `hooks/` → reusable logic
* `services/` → business + DB logic
* `policies/` → RBAC enforcement
* `lib/` → utilities (supabase, auth, helpers)
* `config/` → roles & permissions
* `types/` → global types
* `middleware.ts` → auth + workspace guard

Feature structure:

```
feature/
  ├── components/
  ├── hooks/
  ├── services/
  └── types.ts
```

---

## 🧩 5. Architecture

```
UI Component
  ↓
Feature Hook
  ↓
Service Layer
  ↓
Policy (RBAC)
  ↓
Supabase (with workspace filter)
```

Rules:

* Server Components → default
* Client Components → only if needed
* Server Actions → for mutations

---

## 🔄 6. Service Layer

All business logic MUST go through `/services`.

Responsibilities:

* Supabase queries
* Enforce `workspace_id`
* Apply policies
* RBAC validation
* Data transformation
* Error handling

DO NOT:

* Call Supabase directly from UI
* Skip tenant filtering

---

## 🛡️ 7. RBAC & Policies

Roles:

* Admin
* Manager
* Procurement
* Logistics
* Supplier
* Viewer

Rules:

* Defined in `config/roles.ts` & `permissions.ts`
* ALWAYS validate via `/policies`
* DENY if unauthorized

---

## 🌐 8. Data Fetching Strategy

* Prefer Server Components
* Use services for all data access
* Client fetch only for interactivity

---

## 🔐 9. Authentication Flow

1. Login via Supabase Auth
2. Session stored (server/client)
3. Middleware validates:

   * Auth
   * Workspace access

---

## ⚙️ 10. Middleware Responsibilities

* Protect routes
* Validate session
* Validate workspace access

---

## 🔄 11. Business Rules

### Purchase Order

* Draft → Submitted → Approved / Rejected
* ONLY approved PO can create shipment

### Shipment

* Pending → In Transit → Delivered
* NO backward transition

### Supplier

* Can view assigned PO only
* Can set shipment → In Transit

---

## ⚙️ 12. Data Access Rules

* ALWAYS pass `workspace_id`
* ALWAYS go through services

Example services:

* `purchaseOrder.service.ts`
* `shipment.service.ts`
* `supplier.service.ts`

---

## 🎨 13. UI Rules

UI = PRESENTATIONAL ONLY

* NO business logic
* NO direct data access
* Use Tailwind + shadcn/ui

Structure:

* `components/ui` → base
* `components/shared` → reusable
* `components/features` → feature-specific

Must handle:

* loading state
* error state

---

## ⚙️ 14. Hooks

Responsibilities:

* Encapsulate UI logic
* Handle state & side effects
* Reuse logic across components

Global hooks:

* `useAuth()`
* `useWorkspace()`
* `useCompanyContext()`
* `usePermissions()`

---

## 🛡️ 15. Policies

Handle:

* Role permission
* Ownership validation
* Business rules enforcement

---

## 🧬 16. Database (Migration & Seeder)

Location:

```
db/migrations/
db/seed/
```

Rules:

* Use SQL (Supabase)
* NEVER modify old migration
* Seeder must be idempotent

---

## 🧼 17. Coding Conventions

* TypeScript strict (NO `any`)
* Use async/await
* Prefer `const`
* Named exports

Naming:

* Components → PascalCase
* Hooks → useXxx
* Services → xxx.service.ts
* Policies → xxx.policy.ts
* Types → xxx.types.ts

---

## 🚫 18. Anti-Patterns

* Direct Supabase calls in components
* Skipping `workspace_id`
* Skipping RBAC validation
* Mixing UI & business logic
* Hardcoding values

---

## 🚀 19. Scalability Principles

* Feature-based architecture
* Loose coupling
* Reusable components/hooks
* Independent services
