import { buildPaginated } from "@/lib/pagination";
import { requirePermission, type PolicyContextOptions } from "@/policies";
import { canViewPendingShipment } from "@/policies/roles";
import type {
  PaginatedShipments,
  ShipmentDetail,
  ShipmentItem,
  ShipmentSummary,
  TrackingEvent,
  RemainingQuantity,
} from "@/features/shipments/types";

// ─── List Shipments for a PO ──────────────────────────────────────────────────

export async function listShipments(
  purchaseOrderId: string,
  page: number = 1,
  pageSize: number = 10,
  options: PolicyContextOptions = {},
): Promise<PaginatedShipments> {
  const { error: authError, supabase, user, role } = await requirePermission(
    "shipment.view",
    options,
  );
  if (authError || !supabase || !user) throw new Error(authError ?? "Unauthorized");

  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  let query = supabase
    .from("shipments")
    .select("id, purchase_order_id, workspace_id, shipment_number, shipment_date, status, created_at", {
      count: "exact",
    })
    .eq("purchase_order_id", purchaseOrderId)
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo);

  if (!canViewPendingShipment(user.isSuperAdmin, role)) {
    query = query.neq("status", "pending");
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  // Fetch last tracking event per shipment
  const shipmentIds = (data ?? []).map((s) => s.id);
  const lastTrackingMap = new Map<string, string>();

  if (shipmentIds.length > 0) {
    const { data: tracking } = await supabase
      .from("shipment_tracking")
      .select("shipment_id, created_at")
      .in("shipment_id", shipmentIds)
      .order("created_at", { ascending: false });

    for (const t of tracking ?? []) {
      if (!lastTrackingMap.has(t.shipment_id)) {
        lastTrackingMap.set(t.shipment_id, t.created_at);
      }
    }
  }

  const rows: ShipmentSummary[] = (data ?? []).map((s) => ({
    id: s.id,
    purchase_order_id: s.purchase_order_id,
    workspace_id: s.workspace_id,
    shipment_number: s.shipment_number,
    shipment_date: s.shipment_date,
    status: s.status as ShipmentSummary["status"],
    last_tracking_at: lastTrackingMap.get(s.id) ?? null,
    created_at: s.created_at,
  }));

  return buildPaginated<ShipmentSummary>(rows, count ?? 0, page, pageSize);
}

// ─── Get Shipment Detail ──────────────────────────────────────────────────────

export async function getShipmentById(
  id: string,
  options: PolicyContextOptions = {},
): Promise<ShipmentDetail | null> {
  const { error: authError, supabase, user } = await requirePermission(
    "shipment.view",
    options,
  );
  if (authError || !supabase || !user) throw new Error(authError ?? "Unauthorized");

  const { data: shipment, error } = await supabase
    .from("shipments")
    .select("id, purchase_order_id, workspace_id, shipment_number, shipment_date, status, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!shipment) return null;

  if (shipment.status === "pending" && !canViewPendingShipment(user.isSuperAdmin, user.role)) {
    return null;
  }

  // Fetch shipment items with PO item details
  const { data: rawItems } = await supabase
    .from("shipment_items")
    .select("id, purchase_order_item_id, quantity, price")
    .eq("shipment_id", id)
    .order("created_at", { ascending: true });

  // Enrich with PO item SKU/name
  const poItemIds = (rawItems ?? []).map((i) => i.purchase_order_item_id);
  const poItemMap = new Map<string, { sku: string; name: string }>();

  if (poItemIds.length > 0) {
    const { data: poItems } = await supabase
      .from("purchase_order_items")
      .select("id, sku, name")
      .in("id", poItemIds);

    for (const pi of poItems ?? []) {
      poItemMap.set(pi.id, { sku: pi.sku, name: pi.name });
    }
  }

  const items: ShipmentItem[] = (rawItems ?? []).map((i) => ({
    id: i.id,
    purchase_order_item_id: i.purchase_order_item_id,
    sku: poItemMap.get(i.purchase_order_item_id)?.sku ?? "—",
    name: poItemMap.get(i.purchase_order_item_id)?.name ?? "—",
    quantity: i.quantity,
    price: i.price,
  }));

  // Fetch tracking events (newest first)
  const { data: rawTracking } = await supabase
    .from("shipment_tracking")
    .select("id, status, location, note, performed_by, created_at")
    .eq("shipment_id", id)
    .order("created_at", { ascending: false });

  // Enrich with user name
  const userIds = [...new Set((rawTracking ?? []).map((t) => t.performed_by).filter(Boolean))];
  const userNameMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: usersData } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", userIds);

    for (const u of usersData ?? []) {
      userNameMap.set(u.id, u.name ?? u.email);
    }
  }

  const tracking: TrackingEvent[] = (rawTracking ?? []).map((t) => ({
    id: t.id,
    status: t.status,
    location: t.location,
    note: t.note,
    performed_by_name: t.performed_by ? (userNameMap.get(t.performed_by) ?? null) : null,
    created_at: t.created_at,
  }));

  return {
    id: shipment.id,
    purchase_order_id: shipment.purchase_order_id,
    workspace_id: shipment.workspace_id,
    shipment_number: shipment.shipment_number,
    shipment_date: shipment.shipment_date,
    status: shipment.status as ShipmentDetail["status"],
    created_at: shipment.created_at,
    items,
    tracking,
  };
}

// ─── Remaining Quantities ─────────────────────────────────────────────────────

export async function getRemainingQuantities(
  purchaseOrderId: string,
  excludeShipmentId?: string,
  options: PolicyContextOptions = {},
): Promise<RemainingQuantity[]> {
  const { error: authError, supabase, user } = await requirePermission(
    "shipment.view",
    options,
  );

  if (authError || !supabase || !user) throw new Error(authError ?? "Unauthorized");

  // Get PO items
  const { data: poItems } = await supabase
    .from("purchase_order_items")
    .select("id, sku, name, quantity, price")
    .eq("purchase_order_id", purchaseOrderId)
    .order("created_at", { ascending: true });

  if (!poItems?.length) return [];

  // Get all shipment items (excluding current shipment if editing)
  const shipmentsQuery = supabase
    .from("shipments")
    .select("id")
    .eq("purchase_order_id", purchaseOrderId);

  const { data: allShipments } = await shipmentsQuery;
  const shipmentIds = (allShipments ?? [])
    .map((s) => s.id)
    .filter((sid) => sid !== excludeShipmentId);

  const shippedMap = new Map<string, number>();

  if (shipmentIds.length > 0) {
    const { data: shipmentItems } = await supabase
      .from("shipment_items")
      .select("purchase_order_item_id, quantity")
      .in("shipment_id", shipmentIds);

    for (const si of shipmentItems ?? []) {
      shippedMap.set(
        si.purchase_order_item_id,
        (shippedMap.get(si.purchase_order_item_id) ?? 0) + si.quantity,
      );
    }
  }

  return poItems.map((pi) => ({
    poItemId: pi.id,
    sku: pi.sku,
    name: pi.name,
    orderedQty: pi.quantity,
    remainingQty: Math.max(0, pi.quantity - (shippedMap.get(pi.id) ?? 0)),
    priceFromPO: pi.price,
  }));
}
