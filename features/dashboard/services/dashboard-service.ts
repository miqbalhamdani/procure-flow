import {
  purchaseOrderStatusValues,
  type PurchaseOrderStatus,
} from "@/db/schema/purchase-orders";
import { shipmentStatusValues, type ShipmentStatus } from "@/db/schema/shipments";
import {
  canViewPendingShipment,
  isOperationalRole,
  requirePermission,
  type PolicyContextOptions,
} from "@/policies";

import type { DashboardOverview, DashboardStatusCounts } from "../types";

function createZeroStatusCount<T extends string>(statuses: readonly T[]): DashboardStatusCounts<T> {
  return statuses.reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {} as DashboardStatusCounts<T>,
  );
}

async function countPurchaseOrdersByStatus(
  status: PurchaseOrderStatus,
  options: PolicyContextOptions,
  restrictForOperationalRole: boolean,
): Promise<number> {
  const { error, supabase, user } = await requirePermission("purchaseOrder.view", options);
  if (error || !supabase || !user) throw new Error(error ?? "Unauthorized");

  let query = supabase
    .from("purchase_orders")
    .select("id", { head: true, count: "exact" })
    .in("company_id", user.accessibleWorkspaceIds)
    .eq("status", status);

  if (restrictForOperationalRole) {
    query = query.neq("status", "draft").neq("status", "rejected");
  }

  const { count, error: countError } = await query;
  if (countError) throw new Error(countError.message);

  return count ?? 0;
}

async function countShipmentsByStatus(
  status: ShipmentStatus,
  options: PolicyContextOptions,
  canViewPending: boolean,
): Promise<number> {
  const { error, supabase, user } = await requirePermission("shipment.view", options);
  if (error || !supabase || !user) throw new Error(error ?? "Unauthorized");

  let query = supabase
    .from("shipments")
    .select("id", { head: true, count: "exact" })
    .in("workspace_id", user.accessibleWorkspaceIds)
    .eq("status", status);

  if (!canViewPending) {
    query = query.neq("status", "pending");
  }

  const { count, error: countError } = await query;
  if (countError) throw new Error(countError.message);

  return count ?? 0;
}

export async function getDashboardOverview(
  options: PolicyContextOptions = {},
): Promise<DashboardOverview> {
  const { error, user, role } = await requirePermission("purchaseOrder.view", options);
  if (error || !user) throw new Error(error ?? "Unauthorized");

  const restrictForOperationalRole = isOperationalRole(role);
  const canViewPending = canViewPendingShipment(user.isSuperAdmin, role);

  const purchaseOrderStatusCounts = createZeroStatusCount(purchaseOrderStatusValues);
  const shipmentStatusCounts = createZeroStatusCount(shipmentStatusValues);

  const [
    poDraft,
    poSubmitted,
    poInProgress,
    poRejected,
    poClosed,
    shipmentPending,
    shipmentInTransit,
    shipmentDelivered,
  ] = await Promise.all([
    countPurchaseOrdersByStatus("draft", options, restrictForOperationalRole),
    countPurchaseOrdersByStatus("submitted", options, restrictForOperationalRole),
    countPurchaseOrdersByStatus("in_progress", options, restrictForOperationalRole),
    countPurchaseOrdersByStatus("rejected", options, restrictForOperationalRole),
    countPurchaseOrdersByStatus("closed", options, restrictForOperationalRole),
    countShipmentsByStatus("pending", options, canViewPending),
    countShipmentsByStatus("in_transit", options, canViewPending),
    countShipmentsByStatus("delivered", options, canViewPending),
  ]);

  purchaseOrderStatusCounts.draft = poDraft;
  purchaseOrderStatusCounts.submitted = poSubmitted;
  purchaseOrderStatusCounts.in_progress = poInProgress;
  purchaseOrderStatusCounts.rejected = poRejected;
  purchaseOrderStatusCounts.closed = poClosed;

  shipmentStatusCounts.pending = shipmentPending;
  shipmentStatusCounts.in_transit = shipmentInTransit;
  shipmentStatusCounts.delivered = shipmentDelivered;

  const totalPurchaseOrders = Object.values(purchaseOrderStatusCounts).reduce((sum, n) => sum + n, 0);
  const totalShipments = Object.values(shipmentStatusCounts).reduce((sum, n) => sum + n, 0);

  const approvedPurchaseOrders =
    purchaseOrderStatusCounts.in_progress + purchaseOrderStatusCounts.closed;
  const deliveredShipments = shipmentStatusCounts.delivered;

  const hasAnyData = totalPurchaseOrders > 0 || totalShipments > 0;

  return {
    kpis: {
      totalPurchaseOrders,
      approvedPurchaseOrders,
      totalShipments,
      deliveredShipments,
    },
    purchaseOrderStatusCounts,
    shipmentStatusCounts,
    hasAnyData,
  };
}
