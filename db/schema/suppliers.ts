import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { workspaces } from "./workspaces";

export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    address: text("address"),
    country: text("country"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueWorkspaceName: unique("suppliers_workspace_name_unique").on(
      table.workspaceId,
      table.name,
    ),
  }),
);
