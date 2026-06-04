Build a Supplier Management module.

# GOAL


# PAGES

### 1. Supplier List  [raw-ui/suppliers_list_layout/code.html]
- Display list of suppliers
- Columns:
  - Supplier Name
  - Supplier Company (from company table, display company name instead of id)
  - Address
  - Supplier Country
  - Actions (edit, delete)
- Add search by Supplier Name
- Add pagination

### 2. Create Supplier [raw-ui/supplier_create_modal/code.html]
- Modal form to create new supplier
- Fields:
  - Supplier Name (must be unique within workspace)
  - Supplier Company (from company table, dropdown select)
    - If parent workspace, show all child companies incuding current company
    - If child workspace, show only current company
  - Address
  - Supplier Country (dropdown select)
- On submit:
  - Create supplier

### 3. Edit Supplier [raw-ui/supplier_create_modal/code.html]
- Same modal form with create new supplier
- Fields:
  - Supplier Name
  - Supplier Company (from company table, dropdown select)
  - Address
  - Supplier Country (dropdown select)
- On submit:
  - Update supplier

### 4. Delete User
- Confirmation dialog
- On confirm:
  - Remove Supplier

### 5. Business Rules

- Supplier is always tied to a `workspace_id`
- Admin and Manager can manage suppliers (create, update, delete)
- Supplier name must be unique within a workspace
- Parent workspace users can see suppliers from all child companies
- Child workspace users can only see and manage suppliers for their own company

# Keep logic aligned with:
- role-based access
- workspace isolation
