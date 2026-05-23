# 📄 Purchase Order Module Specification

## 🎯 Goals

Create a robust Purchase Order and shipment module that allows users to create, manage, and track purchase orders until their shipment within their workspace. 

---

## 🚀 Main Features

### 1. Purchase Order List [raw-ui/purchase_orders_list_layout/code.html]
- Add puchase order button
- Display a list of purchase orders. 
  - If parent workspace, show all purchase orders from child companies
  - If child workspace, show only purchase orders for their own company
  - Column:
    - PO Number
    - Company Name
    - Supplier Name
    - Created Date
    - Status (Draft, Submitted, In Progress, Rejected, Closed)
    - Actions
      - Edit (if status Draft)
      - Manage (if status not draft)
      - Delete (show modal confirmation, only if status is Draft)
- filter functionality by:
  - Company Name
    - if parent workspace, show all child companies
    - if child workspace, show only current company
  - Supplier Name
    - if parent workspace, show all suppliers from child companies
    - if child workspace, show only suppliers for their own company
  - Status
- Pagination

### 2. Create/Edit Purchase Order [raw-ui/purchase_order_create_layout/code.html]
- New page for creating/editing purchase order
- General Information Section
  - Form fields:
    - PO Number
    - Created Date (auto-filled, located next to PO Number)
    - Company (dropdown select)
      - Only can select if parent workspace
      - Auto-select if child workspace
    - Company Country (auto-filled based on selected company, read-only)
    - Company Address (auto-filled based on selected company, read-only)
    - Supplier (dropdown select, filtered by selected company)
    - Supplier Country (auto-filled based on selected supplier, read-only)
    - Supplier Address (auto-filled based on selected supplier, read-only)
- Items & Quantities Section
  - user need to fill in general information before adding items, otherwise show guidance message
  - Display list of items
    - Columns:
      - SKU 
      - Item Name
      - Quantity
      - Price (USD)
    - Actions:
      - Edit (modal form to edit item details)
      - Delete (show modal confirmation)
  - Add Item button
  - Modal form to add new / edit item [raw-ui/purchase_order_item_create_modal/code.html]
    - Form fields:
      - SKU
      - Item Name
      - Quantity
      - Price (USD)
- Total Amount (auto-calculated based on items, read-only)
- Actions:
  - Save as Draft
  - Submit for Approval (only if status is Draft)
  - Cancel (navigate back to purchase order list)
- Editing rules:
  - If status is Draft, allow editing all fields and items

### 3. Manage Purchase Order [raw-ui/purchase_order_approval_layout/code.html]
- New page for managing purchase order
- Only accessible if status is not Draft
- Purchase order status (Submitted, In Progress, Rejected, Closed)
  - Submitted: waiting for approval
  - In Progress: approved and waiting for shipment
  - Rejected: rejected by manager
  - Closed: all shipments is completed
- Button approval actions (only for Super Admin, Admin, Manager role, only if status is Submitted)
  - Approve (show modal to fill in approval note, optional)
  - Reject (show modal to fill in rejection reason)
- General Information Section
  - Company (including country and address)
  - Supplier (including country and address)
- Items & Quantities Section
  - Columns:
    - SKU 
    - Item Name
    - Quantity Ordered
    - Quantity Received (auto-calculated based on related shipments, read-only)
    - Price (USD)
    - Total (auto-calculated based on quantity and price)
  - Total Amount (auto-calculated based on items, read-only)
- Back Button to Purchase Order List button


### 4. Shipment [raw-ui/shipment_list__empty_state/code.html]
- Same page with manage purchase order, but different tab
- Only accessible if status is In Progress
- Add Shipment button inside table, if there is no shipment created yet
- Display list of shipments related to the purchase order
  - Columns:
    - Shipment Number
    - Shipment Date
    - Status (Pending, Shipped, Delivered)
    - Last Tracking Update
    - Actions:
      - Manage (navigate to shipment create/edit page)
      - Edit (if status is Pending)
      - Delete (if status is Pending, show modal confirmation)
- Pagination
- Back Button to Purchase Order List button

### 5. Shipment Create/Edit [raw-ui/shipment_create_layout/code.html]
- New page for creating/editing shipment
- Action Buttons:
  - Save as draft
  - Submit Shipment
  - Cancel (navigate back to manage purchase order page)
- General Information Section
  - Form fields:
    - Shipment Number
    - Shipment Date (date picker)
- Shipment Items Section
  - Display list of shipment items from the purchase order
  - Columns:
     - SKU 
     - Item Name
     - Quantity to Ship (number input, max value based on remaining quantity from purchase order)
     - Price (USD, auto-filled from purchase order, read-only)
     - Actions:
       - Edit (modal form to edit shipment item details)
       - Delete (show modal confirmation)
  - Button to add new shipment item (open modal form to add item)
- Total Quantity to Ship (auto-calculated based on quantity to ship, read-only)
- Total Amount (auto-calculated based on quantity to ship and price, read-only)

### 6. Shipment Item Create/Edit [raw-ui/shipment_item_create_modal/code.html]
- Modal form to create/edit shipment item
- Form fields:
  - Product (dropdown select based on items in the purchase order, show SKU and Item Name in dropdown)
  - Qunatity that remains to be shipped for the selected product (auto-filled based on purchase order and existing shipments, read-only)
  - Quantity to Ship (number input, max value based on remaining quantity from purchase order)
  - Price (USD, auto-filled from purchase order, read-only)
  - Total (auto-calculated based on quantity to ship and price, read-only)
- Actions:
  - Add Item
  - Cancel (close modal)

### 7. Manage Shipment [raw-ui/shipment_detail_layout/code.html]
- Same page with shipment create/edit, but with new column in right side to display shipment action and tracking timeline
- This page is only accessible if shipment status is not Pending
- Shipment Actions:
  - When button clicked show modal [raw-ui/shipment_action_modal/code.html]
  - Mark in Transit (only if status is Shipped) 
    - Show modal to fill in location and delivery note, optional
  - Mark as Delivered 
    - Show modal to fill in delivery note, optional
  - on buttom modal, there's footer that informs user that the action will update tracking timeline
- Shipment Tracking Timeline:
  - Display timeline of shipment status updates, including:
    - Shipment created (auto-generated when shipment is created)
    - Shipment updated with location, note, and user info that performed the update 
  - Latest update at the top

## User Flow 
1. Procurement / Manager / Admin / Super Admin Create Purchase Order
  - Fill in general information and add items
  - Save as draft or submit for approval
2. If submitted, Manager / Admin / Super Admin review the purchase order and approve or reject
3. If approved, Supplier / Admin / Super Admin can create shipments for the purchase order
  - Fill in shipment information and add shipment items based on the purchase order
  - Save as draft or submit shipment
4. If submitted, Supplier / Admin / Super Admin can manage the shipment and update tracking information.
  - Supplier / Admin / Super Admin can mark the shipment in transit with location and delivery note
  - Logistics / Admin / Super Admin can update the shipment status to delivered with delivery note
5. Once all shipments are marked as delivered, the purchase order is closed

---

## Edge Cases

- Creating PO without supplier → block
- Creating PO without items → block
- Submitting empty PO → block
- Editing PO after approval → block
- Creating shipment before approval → block
- Supplier from different workspace → block
- Parent without child selected → show guidance
- Duplicate rapid submission → prevent
- Unauthorized role:
  - Hide UI actions
  - Enforce on server
- Creating shipment before PO approval → block
- Supplier accessing other supplier shipment → block