"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { ActionsCell } from "@/components/ui/actions-cell";
import { deleteUser } from "@/features/users/services/user-action";
import type { UserSummary } from "@/features/users/types";
import { getInitials } from "@/lib/utils";

export const columns: ColumnDef<UserSummary>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const { name, email } = row.original;
      return (
        <div className="flex items-center gap-4">
          <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-xl bg-secondary-container text-sm font-bold text-primary">
            {getInitials(name, email)}
          </div>
          <span className="font-semibold text-on-background">{name ?? <span className="italic text-outline">—</span>}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-sm text-on-surface-variant">{row.original.email}</span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-sm text-on-surface-variant">
        {new Date(row.original.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <ActionsCell
          editAction={{ type: "link", href: `/users/${user.id}` }}
          deleteAction={{
            resourceName: "User",
            itemName: user.name ?? user.email,
            warning: "This will remove all their company memberships and cannot be undone.",
            onConfirm: async () => deleteUser(user.id),
          }}
        />
      );
    },
  },
];
