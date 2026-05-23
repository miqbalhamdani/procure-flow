import type { Paginated } from "@/lib/pagination";

export type ShipmentStatus = "pending" | "in_transit" | "delivered";

export type ShipmentItem = {
  id: string;
  purchase_order_item_id: string;
  sku: string;
  name: string;
  quantity: number;
  price: string;
};

export type TrackingEvent = {
  id: string;
  status: string;
  location: string | null;
  note: string | null;
  performed_by_name: string | null;
  created_at: string;
};

export type ShipmentSummary = {
  id: string;
  purchase_order_id: string;
  workspace_id: string;
  shipment_number: string;
  shipment_date: string | null;
  status: ShipmentStatus;
  last_tracking_at: string | null;
  created_at: string;
};

export type ShipmentDetail = {
  id: string;
  purchase_order_id: string;
  workspace_id: string;
  shipment_number: string;
  shipment_date: string | null;
  status: ShipmentStatus;
  created_at: string;
  items: ShipmentItem[];
  tracking: TrackingEvent[];
};

export type RemainingQuantity = {
  poItemId: string;
  sku: string;
  name: string;
  orderedQty: number;
  remainingQty: number;
  priceFromPO: string;
};

export type PaginatedShipments = Paginated<ShipmentSummary>;
