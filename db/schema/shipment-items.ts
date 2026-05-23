import { integer, numeric, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { workspaces } from "./workspaces";
import { shipments } from "./shipments";
import { purchaseOrderItems } from "./purchase-order-items";

export const shipmentItems = pgTable("shipment_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  shipmentId: uuid("shipment_id")
    .notNull()
    .references(() => shipments.id, { onDelete: "cascade" }),
  purchaseOrderItemId: uuid("purchase_order_item_id")
    .notNull()
    .references(() => purchaseOrderItems.id, { onDelete: "restrict" }),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
