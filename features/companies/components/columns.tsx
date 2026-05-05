"use client";

import type { ColumnDef } from "@tanstack/react-table";

import type { WorkspaceSummary } from "@/features/companies/types";
import { findCountryByName, flagUrl } from "@/lib/countries";
import { ActionsCell } from "@/components/ui/actions-cell";

export const columns: ColumnDef<WorkspaceSummary>[] = [
  {
    accessorKey: "name",
    header: "Company Name",
    cell: ({ row }) => {
      const workspace = row.original;
      const isParent = !workspace.parent_id;
      return (
        <div className={`flex items-center gap-3 ${!isParent ? "pl-8" : ""}`}>
          {isParent ? (
            <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary shadow-sm">
              <span className="material-symbols-outlined text-lg leading-none">corporate_fare</span>
            </div>
          ) : (
            <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant shadow-sm">
              <span className="material-symbols-outlined text-sm leading-none">domain</span>
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-on-background">{workspace.name}</p>
            <p className={isParent
              ? "text-[10px] font-black uppercase tracking-tighter text-tertiary"
              : "text-[10px] font-medium text-on-surface-variant"
            }>
              {isParent ? "Parent Entity" : "Regional Subsidiary"}
            </p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => (
      <span className="text-sm text-on-surface-variant">
        {row.original.address ?? <span className="italic text-on-surface-variant/50">—</span>}
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
        <span className="flex items-center gap-2">
          {country && (
            <img
              src={flagUrl(country.code)}
              alt={name}
              width={20}
              height={15}
              className="flex-shrink-0 rounded-sm object-cover shadow-sm"
            />
          )}
          <span className="text-sm text-on-surface-variant">{name}</span>
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell workspace={row.original} />,
  },
];
