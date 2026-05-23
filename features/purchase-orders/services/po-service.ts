import { cookies } from "next/headers";

import { getCurrentUser, getCurrentWorkspaceContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { buildPaginated } from "@/lib/pagination";
import type {
  PaginatedPurchaseOrders,
  PurchaseOrderDetail,
  PurchaseOrderFilters,
  PurchaseOrderItem,
  PurchaseOrderSummary,
  CompanyOption,
  SupplierOption,
} from "@/features/purchase-orders/types";

const PO_APPROVER_ROLES = new Set(["admin", "manager"]);

// ─── List Purchase Orders ─────────────────────────────────────────────────────

export async function listPurchaseOrders(
  page: number = 1,
  filters: PurchaseOrderFilters = {},
  pageSize: number = 10,
): Promise<PaginatedPurchaseOrders> {
  const workspaceContext = await getCurrentWorkspaceContext();

  if (!workspaceContext) throw new Error("Unauthorized");

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  let query = supabase
    .from("purchase_orders")
    .select("id, workspace_id, company_id, supplier_id, po_number, status, created_at", {
      count: "exact",
    })
    .in("workspace_id", workspaceContext.accessibleWorkspaceIds)
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo);

  if (filters.companyId) query = query.eq("company_id", filters.companyId);
  if (filters.supplierId) query = query.eq("supplier_id", filters.supplierId);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  // Batch-fetch company names (workspaces)
  const companyIds = [...new Set((data ?? []).map((r) => r.company_id))];
  const companyMap = new Map<string, string>();
  if (companyIds.length > 0) {
    const { data: companies } = await supabase
      .from("workspaces")
      .select("id, name")
      .in("id", companyIds);
    for (const c of companies ?? []) companyMap.set(c.id, c.name);
  }

  // Batch-fetch supplier names
  const supplierIds = [...new Set((data ?? []).map((r) => r.supplier_id))];
  const supplierMap = new Map<string, string>();
  if (supplierIds.length > 0) {
    const { data: suppliers } = await supabase
      .from("suppliers")
      .select("id, name")
      .in("id", supplierIds);
    for (const s of suppliers ?? []) supplierMap.set(s.id, s.name);
  }

  const rows: PurchaseOrderSummary[] = (data ?? []).map((r) => ({
    id: r.id,
    workspace_id: r.workspace_id,
    company_id: r.company_id,
    company_name: companyMap.get(r.company_id) ?? null,
    supplier_id: r.supplier_id,
    supplier_name: supplierMap.get(r.supplier_id) ?? null,
    po_number: r.po_number,
    status: r.status as PurchaseOrderSummary["status"],
    created_at: r.created_at,
  }));

  return buildPaginated<PurchaseOrderSummary>(rows, count ?? 0, page, pageSize);
}

// ─── Get Purchase Order Detail ────────────────────────────────────────────────

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrderDetail | null> {
  const user = await getCurrentUser();

  if (!user?.workspaceId) throw new Error("Unauthorized");

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: po, error } = await supabase
    .from("purchase_orders")
    .select(
      "id, workspace_id, company_id, supplier_id, po_number, status, approval_note, rejection_reason, approved_by, approved_at, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!po) return null;

  // Fetch company info
  const { data: company } = await supabase
    .from("workspaces")
    .select("name, address, country")
    .eq("id", po.company_id)
    .maybeSingle();

  // Fetch supplier info
  const { data: supplier } = await supabase
    .from("suppliers")
    .select("name, address, country")
    .eq("id", po.supplier_id)
    .maybeSingle();

  // Fetch items
  const { data: items } = await supabase
    .from("purchase_order_items")
    .select("id, sku, name, quantity, price")
    .eq("purchase_order_id", id)
    .order("created_at", { ascending: true });

  // Calculate quantity_received per item from delivered shipments
  const itemIds = (items ?? []).map((i) => i.id);
  const receivedMap = new Map<string, number>();

  if (itemIds.length > 0) {
    // Get delivered shipment IDs for this PO
    const { data: deliveredShipments } = await supabase
      .from("shipments")
      .select("id")
      .eq("purchase_order_id", id)
      .eq("status", "delivered");

    const deliveredIds = (deliveredShipments ?? []).map((s) => s.id);

    if (deliveredIds.length > 0) {
      const { data: receivedItems } = await supabase
        .from("shipment_items")
        .select("purchase_order_item_id, quantity")
        .in("shipment_id", deliveredIds)
        .in("purchase_order_item_id", itemIds);

      for (const ri of receivedItems ?? []) {
        receivedMap.set(
          ri.purchase_order_item_id,
          (receivedMap.get(ri.purchase_order_item_id) ?? 0) + ri.quantity,
        );
      }
    }
  }

  const poItems: PurchaseOrderItem[] = (items ?? []).map((i) => ({
    id: i.id,
    sku: i.sku,
    name: i.name,
    quantity: i.quantity,
    price: i.price,
    quantity_received: receivedMap.get(i.id) ?? 0,
  }));

  return {
    id: po.id,
    workspace_id: po.workspace_id,
    company_id: po.company_id,
    company_name: company?.name ?? null,
    company_address: company?.address ?? null,
    company_country: company?.country ?? null,
    supplier_id: po.supplier_id,
    supplier_name: supplier?.name ?? null,
    supplier_address: supplier?.address ?? null,
    supplier_country: supplier?.country ?? null,
    po_number: po.po_number,
    status: po.status as PurchaseOrderDetail["status"],
    approval_note: po.approval_note,
    rejection_reason: po.rejection_reason,
    approved_by: po.approved_by,
    approved_at: po.approved_at,
    created_at: po.created_at,
    items: poItems,
  };
}

export async function canCurrentUserApprovePurchaseOrders(): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user?.workspaceId) return false;
  if (user.isSuperAdmin) return true;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: membership, error } = await supabase
    .from("memberships")
    .select("role")
    .eq("workspace_id", user.workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return PO_APPROVER_ROLES.has(membership?.role ?? "");
}

// ─── Company Options ──────────────────────────────────────────────────────────

export async function getCompanyOptions(): Promise<CompanyOption[]> {
  const workspaceContext = await getCurrentWorkspaceContext();

  if (!workspaceContext) throw new Error("Unauthorized");

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Parent workspace: child workspaces are "companies"
  // Child workspace: itself is the company
  const companyIds = workspaceContext.isChildWorkspace
    ? [workspaceContext.workspaceId]
    : workspaceContext.accessibleWorkspaceIds;

  if (companyIds.length === 0) return [];

  const { data } = await supabase
    .from("workspaces")
    .select("id, name, address, country")
    .in("id", companyIds)
    .order("name", { ascending: true });

  return (data ?? []).map((w) => ({
    id: w.id,
    name: w.name,
    address: w.address ?? null,
    country: w.country ?? null,
  }));
}

// ─── Supplier Options (filtered by company) ───────────────────────────────────

export async function getSupplierOptionsForCompany(companyId: string): Promise<SupplierOption[]> {
  const user = await getCurrentUser();

  if (!user?.workspaceId) throw new Error("Unauthorized");

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data } = await supabase
    .from("suppliers")
    .select("id, name, address, country")
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  return (data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    address: s.address ?? null,
    country: s.country ?? null,
  }));
}
