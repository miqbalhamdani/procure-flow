# 🧠 Copilot Instructions — ProcureFlow

---

# 📦 PROJECT_CONTEXT

## 🧭 Product Overview

ProcureFlow is a **B2B multi-tenant SaaS** for procurement & shipment.

Core modules:

* Dashboard
* Suppliers
* Purchase Orders
* Shipments
* Billing
* Companies (multi-tenant)
* Users

---

## 🧠 Multi-Tenant Model

* 1 workspace = 1 company
* Supports parent → child (max 2 levels)

Hierarchy:

* Parent → can access child data
* Child → only its own data

---

## 👥 Roles (RBAC)

* Admin
* Manager
* Procurement
* Logistics
* Supplier
* Viewer

---

## 🔐 Access Rules (CRITICAL)

* ALWAYS include `workspace_id` in every query
* NEVER allow cross-workspace access
* ALWAYS validate RBAC via policies

Supplier restriction:

```sql id="ctxsql2"
purchase_orders WHERE supplier_id = current_supplier_id
```

---

## 🔄 Core Business Flow

### Purchase Order

* Draft → Submitted → Approved / Rejected

### Shipment

* Pending → In Transit → Delivered
* No backward status

Rules:

* Only Approved PO can create Shipment

---

## 🧩 System Modules

* Authentication & Workspace
* Supplier Management
* Purchase Orders
* Shipments
* Dashboard
* Billing

---

# 🏗️ ARCHITECTURE

## 🧩 Core Architecture Flow

```id="archflow2"
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

---

## 🧱 Layer Responsibilities

### UI Layer (`components/`)

* Presentational only
* No business logic
* No data fetching

---

### Hooks Layer (`hooks/`, `features/*/hooks`)

* Handle state & side effects
* Encapsulate reusable logic

---

### Service Layer (`services/`) (MANDATORY)

* Business logic
* Supabase queries
* Enforce `workspace_id`
* Apply RBAC via policies
* Handle errors
* Transform data

DO NOT:

* Call Supabase directly from UI
* Skip tenant filtering

---

### Policy Layer (`policies/`)

* RBAC validation
* Ownership checks
* Business rule enforcement

---

### Middleware (`middleware.ts`)

* Auth validation
* Workspace access guard

---

## ⚙️ Rendering Strategy

* Server Components → default
* Client Components → only when needed
* Server Actions → for mutations

---

## 🌐 Data Fetching Rules

* Prefer Server Components
* Always fetch via services
* Never fetch directly from UI

---

## 📁 Project Structure (SOURCE OF TRUTH)

* `app/` → routing
* `features/` → business modules
* `components/` → UI
* `hooks/` → shared logic
* `services/` → business logic
* `policies/` → RBAC
* `lib/` → utilities
* `config/` → roles & permissions
* `types/` → global types
* `middleware.ts` → auth + tenant guard

Feature structure:

```id="archfeat"
feature/
  ├── components/
  ├── hooks/
  ├── services/
  └── types.ts
```

---

## 🛡️ Security Flow

```id="archsec2"
Request
  ↓
middleware.ts (auth + workspace)
  ↓
policy (RBAC)
  ↓
service layer
  ↓
database query (with workspace_id)
```

---

## 🚫 Strict Rules

* NEVER query database in UI
* ALWAYS use service layer
* ALWAYS enforce `workspace_id`
* ALWAYS validate via policy

---

# 🧼 CONVENTIONS

## 🔤 Naming Conventions

* Components → PascalCase
* Hooks → useXxx
* Services → xxx.service.ts
* Policies → xxx.policy.ts
* Types → xxx.types.ts

---

## 🧠 Code Style

* TypeScript strict (NO `any`)
* Use async/await
* Prefer `const`
* Use arrow functions
* Prefer named exports

---

## 📦 Feature Structure

```id="convfeat2"
feature/
  ├── components/
  ├── hooks/
  ├── services/
  └── types.ts
```

---

## 🎨 UI Rules

* Use Tailwind CSS + shadcn/ui
* No business logic in UI
* No direct data access
* Keep components small & reusable
* Prefer existing components

Must handle:

* loading state
* error state

---

## ⚙️ Hooks Rules

* Extract reusable logic
* Avoid unnecessary global state
* Keep hooks focused

---

## 🧬 Database Rules

Location:

```id="convdb2"
db/migrations/
db/seed/
```

Rules:

* Use SQL (Supabase)
* Never modify existing migration
* Seeder must be idempotent

---

## ⚠️ Anti-Patterns

* Direct Supabase calls in components
* Skipping `workspace_id`
* Skipping RBAC validation
* Mixing UI & business logic
* Hardcoding values

---

## 🚀 Best Practices

* Reuse hooks instead of duplicating logic
* Keep functions small and focused
* Prefer readability over complexity
* Follow existing patterns before creating new ones
