"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { ActionsCell } from "@/components/ui/actions-cell";
import { SupplierModal } from "@/features/suppliers/components/supplier-modal";
import { deleteSupplier } from "@/features/suppliers/services/supplier-action";
import type { SupplierSummary } from "@/features/suppliers/types";
import { findCountryByName, flagUrl } from "@/lib/countries";
import { getInitials } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-primary/10 text-primary",
  "bg-tertiary/10 text-tertiary",
  "bg-secondary/10 text-secondary",
  "bg-error/10 text-error",
];

function avatarColor(id: string): string {
  const idx = id.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export const columns: ColumnDef<SupplierSummary>[] = [
  {
    accessorKey: "name",
    header: "Supplier Name",
    cell: ({ row }) => {
      const supplier = row.original;
      const initials = getInitials(supplier.name);
      return (
        <div className="flex items-center gap-3">
          <div
            className={`flex size-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ${avatarColor(supplier.id)}`}
          >
            {initials}
          </div>
          <span className="text-sm font-semibold text-on-background">{supplier.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "company_name",
    header: "Company",
    cell: ({ row }) => (
      <span className="text-sm font-medium text-on-surface-variant">
        {row.original.company_name ?? (
          <span className="italic text-on-surface-variant/50">—</span>
        )}
      </span>
    ),
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => (
      <span className="text-sm text-on-surface-variant">
        {row.original.address ?? (
          <span className="italic text-on-surface-variant/50">—</span>
        )}
      </span>
    ),
  },
  {
    accessorKey: "country",
    header: "Country",
    cell: ({ row }) => {
      const name = row.original.country;
      if (!name) return <span className="italic text-on-surface-variant/50">—</span>;
      const country = findCountryByName(name);
      return (
        <span className="flex items-center gap-2 text-sm font-medium text-on-background">
          {country && (
            <img
              src={flagUrl(country.code)}
              alt={name}
              width={20}
              height={15}
              className="flex-shrink-0 rounded-sm object-cover shadow-sm"
            />
          )}
          {name}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const supplier = row.original;
      return (
        <ActionsCell
          editAction={{
            type: "modal",
            render: (props) => <SupplierModal supplier={supplier} {...props} />,
          }}
          deleteAction={{
            resourceName: "Supplier",
            itemName: supplier.name,
            onConfirm: () => deleteSupplier(supplier.id),
          }}
        />
      );
    },
  },
];
