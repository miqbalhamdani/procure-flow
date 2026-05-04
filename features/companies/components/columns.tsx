"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { WorkspaceSummary } from "@/features/companies/types";

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
    cell: ({ row }) => (
      <span className="text-sm text-on-surface-variant">
        {row.original.country ?? <span className="italic text-on-surface-variant/50">—</span>}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => (
      <button
        type="button"
        className="rounded-lg p-2 text-on-surface-variant transition-all hover:bg-surface-container"
        aria-label="More actions"
      >
        <span className="material-symbols-outlined text-[20px] leading-none">more_vert</span>
      </button>
    ),
  },
];
