import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";
import { workspaces } from "./workspaces";
import { suppliers } from "./suppliers";

export const purchaseOrderStatusValues = [
  "draft",
  "submitted",
  "in_progress",
  "rejected",
  "closed",
] as const;

export type PurchaseOrderStatus = (typeof purchaseOrderStatusValues)[number];

export const purchaseOrders = pgTable(
  "purchase_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "restrict" }),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "restrict" }),
    poNumber: text("po_number").notNull(),
    status: text("status").notNull().default("draft"),
    approvalNote: text("approval_note"),
    rejectionReason: text("rejection_reason"),
    approvedBy: uuid("approved_by").references(() => users.id, { onDelete: "set null" }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueWorkspacePo: unique("purchase_orders_workspace_po_unique").on(
      table.workspaceId,
      table.poNumber,
    ),
  }),
);
