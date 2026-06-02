"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { ActionsCell } from "@/components/ui/actions-cell";
import { BaseTable } from "@/components/ui/base-table";
import { SupplierModal } from "@/features/suppliers/components/supplier-modal";
import { deleteSupplier } from "@/features/suppliers/services/supplier-action";
import type { SupplierSummary } from "@/features/suppliers/types";
import { findCountryByName, flagUrl } from "@/lib/countries";
import type { PaginationMeta } from "@/lib/pagination";
import { getInitials } from "@/lib/utils";

type SupplierColumnsOptions = {
  canEditSupplier: boolean;
  canDeleteSupplier: boolean;
};

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

export function supplierColumns({
  canEditSupplier,
  canDeleteSupplier,
}: SupplierColumnsOptions): ColumnDef<SupplierSummary>[] {
  const columns: ColumnDef<SupplierSummary>[] = [
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
  ];

  if (canEditSupplier || canDeleteSupplier) {
    columns.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const supplier = row.original;
        return (
          <ActionsCell
            editAction={
              canEditSupplier
                ? {
                    type: "modal",
                    render: (props) => <SupplierModal supplier={supplier} {...props} />,
                  }
                : undefined
            }
            deleteAction={
              canDeleteSupplier
                ? {
                    resourceName: "Supplier",
                    itemName: supplier.name,
                    onConfirm: () => deleteSupplier(supplier.id),
                  }
                : undefined
            }
          />
        );
      },
    });
  }

  return columns;
}

type SupplierTableProps = {
  data: SupplierSummary[];
  pagination: PaginationMeta | null;
  search: string;
  canEditSupplier: boolean;
  canDeleteSupplier: boolean;
};

export function SupplierTable({
  data,
  pagination,
  search,
  canEditSupplier,
  canDeleteSupplier,
}: SupplierTableProps) {
  return (
    <BaseTable
      columns={supplierColumns({
        canEditSupplier,
        canDeleteSupplier,
      })}
      data={data}
      emptyMessage="No suppliers found."
      emptyDescription={
        search
          ? `No suppliers match "${search}". Try a different search.`
          : "Add your first supplier to get started."
      }
      pagination={pagination}
    />
  );
}
