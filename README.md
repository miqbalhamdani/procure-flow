# ProcureFlow

ProcureFlow is a multi-tenant SaaS platform designed to manage procurement and shipment workflows in a centralized system.

It enables companies to streamline purchase orders, approvals, and shipment tracking while supporting multi-company (parent-child) structures.

---

## ✨ Features

* Multi-tenant architecture (workspace-based)
* Parent-child company hierarchy
* Role-based access control (RBAC)
* Purchase order management (Draft → Approved)
* Shipment tracking (Pending → Delivered)
* Supplier portal (limited access)
* Usage-based billing (Free vs Pro plan)

---

## 🧱 Tech Stack

* **Frontend**: Next.js (App Router), TypeScript
* **UI**: Tailwind CSS, Shadcn UI
* **Forms & Validation**: React Hook Form, Valibot
* **Backend**: Supabase (Auth) + Drizzle (Database)
* **Deployment**: Vercel

---

## 🚀 Getting Started

### 1. Clone repository

```bash
git clone <your-repo-url>
cd procureflow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 4. Run development server

```bash
npm run dev
```

---

## 🗂️ Project Structure

```
app/                → Next.js routes
features/           → Business modules (PO, shipment, supplier)
components/         → Shared UI components
hooks/              → Global hooks
lib/                → Utilities & helpers
db/                 → Database schema & queries
services/           → Business logic layer
policies/           → RBAC rules
config/             → Roles & permissions
```

---

## 🔐 Core Concepts

### Multi-Tenant

* Each workspace represents one company
* Data is isolated using `workspace_id`

### Parent-Child Company

* Parent company can view all child companies
* Child company can only access its own data

### Role-Based Access

Roles:

* Admin
* Manager
* Procurement
* Logistics
* Supplier
* Viewer

---

## 🔄 Workflow

1. Procurement creates Purchase Order (Draft)
2. Submit PO
3. Manager approves PO
4. Shipment created
5. Supplier sets In Transit
6. Logistics marks Delivered

---

## 📜 Scripts

```bash
npm run dev      # Start development
npm run build    # Build production
npm run start    # Start production
npm run lint     # Lint code
```

---

## 📌 Notes

* All business rules and AI context are defined in `.github/copilot-instructions.md`
* Feature-level logic is defined in `.github/instructions/*`

---

## 📄 License

Private / Internal Project
