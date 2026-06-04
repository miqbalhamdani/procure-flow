Build a Users Management module.

# GOAL
Allow Admin to manage users inside a workspace, including role assignment.

# PAGES

### 1. User List  [raw-ui/users_list_layout/code.html]
- Display list of users
- Columns:
  - Name
  - Email
  - Created date
  - Actions (edit, delete)
- Add search by name/email
- Add pagination

### 2. Create User [raw-ui/user_create_modal/code.html]
- Fields:
  - Name
  - Email
  - Password
- On submit:
  - Create user (if not exist check by email)
- Show success + error handling

### 3. Delete User
- Confirmation dialog
- On confirm:
  - Remove user
  - Remove all memberships of user

### 3. Update User [raw-ui/company_user_list_layout/code.html]
Edit User: [column 1]
- Name is editable and Email are not editable
- Password can be reset by entering new password, if left empty password will not be updated
- On submit:
  - Update user data  

Company Membership: [column 2]
- Display list of companies user belongs to
- Add Membership [Button]
- Columns:
  - Company Name
  - Role
  - Actions (edit role, delete)

### 4. Add Membership Modal [raw-ui/company_user_assign_role_modal/code.html]
- Fields:
  - Company Name (dropdown of available companies)
  - Role (admin/manager/procurement/logistics/supplier/viewer)
- On submit:
  - Add membership user to company with role 

### 5. Edit Membership Modal [raw-ui/company_user_assign_role_modal/code.html]
- Fields:
  - Company Name (disabled)
  - Role (admin/manager/procurement/logistics/supplier/viewer)
- On submit:
  - Update Add membership user to company with role

### 6. Delete Membership
- Confirmation dialog
- On confirm:
  - Remove user from company (delete membership)  

# Business Rules:
- Only Super Admin can access this module
- User can created without membership, but cannot access any page until assigned to a workspace
- User can belong to single workspace with multiple roles
- User can belong to multiple workspaces with different roles
- Role is stored in memberships table, not users table

# Output Expectation:
- Users page (table + actions)
- User Create dialog component
- User Edit page with company membership management
- Company Membership Add/Edit dialog component
- Confirmation dialog for delete actions
- Show success + error handling for all operations

# Keep logic aligned with:
- role-based access
- workspace isolation