# ProcureFlow — GitHub Copilot Instructions (Final + Super Admin)

You are a senior engineer building ProcureFlow, a production-grade multi-tenant B2B SaaS.

---

# 1) THINKING PRIORITY (MANDATORY)

Always think in this order:

1. Tenant isolation
2. RBAC / authorization
3. Business rules
4. Data integrity
5. UX

Never skip this order.

---

# 2) CORE ARCHITECTURE

## Tech Stack (STRICT)

* Next.js App Router
* Server Components (default)
* Server Actions (for mutations)
* Supabase (Auth + DB + RLS)
* Drizzle ORM (CRUD, migrations, seeder)
* Tailwind CSS
* shadcn/ui
* React Hook Form + Valibot

---

# 3) MULTI-TENANT RULES (CRITICAL)

* Every table MUST include `workspace_id`
* Every query MUST filter by `workspace_id`
* NEVER allow cross-workspace access
* Parent can view child data (via policy)
* Child CANNOT access parent data

Supabase RLS is the source of truth.

---

# 4) RBAC RULES (UPDATED)

## Roles

* Super Admin (platform-level)
* Admin (workspace-level)
* Manager
* Procurement
* Logistics
* Supplier
* Viewer

---

## Core Rules

* Always validate role on server
* NEVER trust frontend
* All permission logic MUST be in `policies/`
* NEVER hardcode permissions in UI

---

## Super Admin Rules (CRITICAL)

* NOT tied to workspace
* Has global access
* Can:

  * Create workspace
  * Add users to workspace
  * Assign Admin role

---

## Admin Rules (UPDATED)

* Scoped to workspace via `memberships`
* Has full access ONLY inside workspace
* Cannot:

  * Create workspace
  * Assign users across workspace

---

## Permission Strategy

* Super Admin → bypass all checks
* Others → must pass:

  * workspace_id match
  * role validation

---

# 5) FEATURE-BASED ARCHITECTURE (MANDATORY)

Each domain MUST follow:

features/
└── <module>/
├── components/
├── services/
├── types.ts
└── index.ts

---

# 6) GLOBAL VS FEATURE RESPONSIBILITY

## Global

* cross-feature logic
* shared utilities
* generic components

## Feature

* module-specific logic
* module UI
* module services

Rule:
→ Prefer feature first

---

# 7) PROJECT STRUCTURE (STRICT)

* app/ → routing only
* features/ → business logic
* components/ → shared UI
* services/ → cross-feature only
* db/ → Drizzle schema
* policies/ → RBAC enforcement
* lib/ → utilities

---

# 8) DATA ACCESS RULES

Flow:

Server Component / Action
→ feature service
→ policy check
→ db query

NEVER:

* call DB from UI
* bypass service layer

---

# 9) WORKSPACE RULES (NEW - CRITICAL)

* User MUST belong to workspace via `memberships`
* EXCEPTION: Super Admin

---

## Workspace Creation

* ONLY Super Admin can create workspace
* Workspace MUST have at least 1 Admin

---

## Membership Rules

* User can belong to multiple workspaces
* Role is stored in `memberships`
* All access MUST resolve from membership

---

# 10) DOMAIN RULES

## Purchase Order

* Draft → Submitted → Approved / Rejected
* Only Approved PO → Shipment

## Shipment

* Pending → In Transit → Delivered
* No backward transition

## Supplier

* Only see assigned PO
* Cannot approve
* Cannot access workspace settings

## Billing

* Enforce limits on server
* Block when limit reached

---

# 11) UI RULES

### COMPONENT LOCATION (STRICT)

Use the correct location based on responsibility:
* Base UI (shadcn) → `/components/shadcn-ui`
* Shared Components → `/components/ui`
* Layout Components → `/components/layouts`
* Feature-specific UI → `/features/<module>/components`

Rules:
* NEVER duplicate components across layers
* Prefer shared → fallback to feature → never reverse

---

### SHADCN USAGE (MANDATORY)

* MUST use shadcn/ui for all base components:
  * Button
  * Input
  * Select
  * Dialog
  * Table
  * Form
* NEVER build base components from scratch
* ALWAYS extend shadcn instead of replacing it

Allowed:
* Wrap shadcn components
* Compose new components using shadcn primitives

---

### STYLING RULES

* Tailwind CSS ONLY
* Follow design spacing system (consistent padding, gap, margin)
* NO arbitrary values unless justified

Bad:

```tsx
className="mt-[13px]"
```

Good:

```tsx
className="mt-3"
```

---

### CONSISTENCY RULES

* Match existing UI patterns before creating new ones
* Reuse components from `/components/ui` first
* Only create new if truly needed

---

### STATE HANDLING (REQUIRED)

Every UI MUST handle:

* loading state
* error state
* empty state

Examples:

* loading → skeleton / spinner
* empty → "No data available"
* error → alert / message

---

### ANTI-PATTERNS (FORBIDDEN)

* ❌ Creating custom button/input from scratch
* ❌ Business logic inside UI
* ❌ Hardcoding role/permission in UI
* ❌ Direct API/DB call in component
* ❌ Duplicate components across folders
* ❌ Overusing `"use client"`

---

### IMPLEMENTATION DEFAULT

Always build UI that is:

* Consistent
* Accessible
* Reusable
* Minimal
* Aligned with design system


---

# 12) FORMS & VALIDATION

* React Hook Form
* Valibot ONLY
* Validate on server + client

---

# 13) CODING STANDARDS

* TypeScript strict
* No any
* Small components
* Clear naming
* No monolith files

---

# 14) REQUIRED PATTERNS

* optimistic updates
* debouncing search
* reset state on workspace switch

---

# 15) ANTI-PATTERNS (FORBIDDEN)

* Missing workspace_id
* Business logic in UI
* Direct DB access from UI
* Hardcoded roles
* Client-side authorization
* Bypassing RLS
* Cross-tenant access

---

# 16) IMPLEMENTATION DEFAULT

Always generate:

* Secure
* Tenant-safe
* Scalable
* Feature-based
* Server-first

# 17) MIGRATIONS STEPS

1. Create new migration file with Drizzle CLI
    `npm run db:generate <migration_name>`
2. Define schema changes in migration file
3. Run migration locally and test
    `npm run db:migrate`