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
            {!isParent && (
              <p className="text-[10px] font-medium text-on-surface-variant">
                Regional Subsidiary
              </p>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "parent_id",
    header: "Type",
    cell: ({ row }) => {
      const isParent = !row.original.parent_id;
      return isParent ? (
        <span className="text-[10px] font-black uppercase tracking-tighter text-tertiary">
          Parent Entity
        </span>
      ) : (
        <span className="text-[10px] font-medium uppercase tracking-tight text-on-surface-variant">
          Subsidiary
        </span>
      );
    },
  },
  {
    accessorKey: "id",
    header: "Workspace ID",
    cell: ({ row }) => (
      <span className="rounded-md bg-surface-container px-2 py-1 font-mono text-xs text-on-surface-variant">
        {row.original.id}
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
