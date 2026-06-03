import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { workspaces } from "./workspaces";

export const workspaceSettings = pgTable(
  "workspace_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    module: text("module").notNull(),
    key: text("key").notNull(),
    value: text("value").notNull().default("true"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    updatedBy: uuid("updated_by"),
  },
  (t) => [unique("workspace_settings_workspace_module_key").on(t.workspaceId, t.module, t.key)],
);

export type WorkspaceSetting = typeof workspaceSettings.$inferSelect;
export type NewWorkspaceSetting = typeof workspaceSettings.$inferInsert;
