import type { Paginated } from "@/lib/pagination";

export type PurchaseOrderStatus =
  | "draft"
  | "submitted"
  | "in_progress"
  | "rejected"
  | "closed";

export type PurchaseOrderItem = {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  price: string;
  quantity_received: number;
};

export type PurchaseOrderSummary = {
  id: string;
  workspace_id: string;
  company_id: string;
  company_name: string | null;
  supplier_id: string;
  supplier_name: string | null;
  po_number: string;
  status: PurchaseOrderStatus;
  created_at: string;
};

export type PurchaseOrderDetail = {
  id: string;
  workspace_id: string;
  company_id: string;
  company_name: string | null;
  company_address: string | null;
  company_country: string | null;
  supplier_id: string;
  supplier_name: string | null;
  supplier_address: string | null;
  supplier_country: string | null;
  po_number: string;
  status: PurchaseOrderStatus;
  approval_note: string | null;
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  items: PurchaseOrderItem[];
};

export type PaginatedPurchaseOrders = Paginated<PurchaseOrderSummary>;

export type CompanyOption = {
  id: string;
  name: string;
  address: string | null;
  country: string | null;
};

export type SupplierOption = {
  id: string;
  name: string;
  address: string | null;
  country: string | null;
};

export type PurchaseOrderFilters = {
  companyId?: string;
  supplierId?: string;
  status?: string;
};
