import { pgTable, text, timestamp, date, uuid } from "drizzle-orm/pg-core";

import { workspaces } from "./workspaces";
import { purchaseOrders } from "./purchase-orders";

export const shipmentStatusValues = ["pending", "in_transit", "delivered"] as const;

export type ShipmentStatus = (typeof shipmentStatusValues)[number];

export const shipments = pgTable("shipments", {
  id: uuid("id").defaultRandom().primaryKey(),
  purchaseOrderId: uuid("purchase_order_id")
    .notNull()
    .references(() => purchaseOrders.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  shipmentNumber: text("shipment_number").notNull(),
  shipmentDate: date("shipment_date"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
