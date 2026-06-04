import type { PurchaseOrderStatus } from "@/db/schema/purchase-orders";
import type { ShipmentStatus } from "@/db/schema/shipments";

export type DashboardStatusCounts<T extends string> = Record<T, number>;

export type DashboardKpis = {
  totalPurchaseOrders: number;
  approvedPurchaseOrders: number;
  totalShipments: number;
  deliveredShipments: number;
};

export type DashboardOverview = {
  kpis: DashboardKpis;
  purchaseOrderStatusCounts: DashboardStatusCounts<PurchaseOrderStatus>;
  shipmentStatusCounts: DashboardStatusCounts<ShipmentStatus>;
  hasAnyData: boolean;
};
