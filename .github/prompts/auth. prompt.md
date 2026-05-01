# 🎯 GOAL
- User can login into the system
- After login → redirect to Companies page (if super admin)

# 📄 PAGES

### 1. Login Page
Path:
app/(auth)/login/page.tsx

UI Source:
raw-ui/login_page/code.html

Requirements:
- Email + Password form
- Use Supabase Auth (signInWithPassword)
- Show loading + error state
- On success:
  - If user.is_super_admin → redirect `/companies`
  - Else → redirect `/dashboard`

---

### 2. Companies List Page (Super Admin Only)
Path:
app/(dashboard)/companies/page.tsx

UI Source:
raw-ui/companies_list_layout/code.html

Requirements:
- Fetch all companies (workspaces)
- Display list (name, parent_id if exists)
- Only accessible by super admin
- Protect route via middleware

---

# 🧱 MIGRATIONS

Create migration files for:
- users
- workspaces
- memberships


# 🌱 SEEDERS

Create seed script:

1. Create 1 company:
   - name: "Demo Company"

2. Create 1 user:
   - email: "admin@procureflow.com"
   - password: (hashed or via Supabase)
   - is_super_admin: true

3. Assign user to company (membership):
   - role: "admin"

---

# 📁 STRUCTURE REFERENCE

Follow this structure strictly:

- app/(auth)/login
- app/(dashboard)/companies
- features/auth
- features/companies
- lib/auth
- middleware.ts

---

# 🚀 OUTPUT EXPECTATION

Generate:
- Migration files
- Seeder script
- Auth service
- Company service
- Login page
- Companies page
- Middleware protection