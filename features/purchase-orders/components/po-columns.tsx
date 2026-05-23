"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { ActionsCell } from "@/components/ui/actions-cell";
import { StatusBadge } from "@/components/ui/status-badge";
import { deletePurchaseOrder } from "@/features/purchase-orders/services/po-action";
import type { PurchaseOrderSummary } from "@/features/purchase-orders/types";

function PoActionsCell({ po }: { po: PurchaseOrderSummary }) {
  const isDraft = po.status === "draft";

  return (
    <ActionsCell
      editAction={
        isDraft
          ? { type: "link", href: `/purchase-orders/${po.id}` }
          : {
              type: "link",
              href: `/purchase-orders/${po.id}/manage`,
              label: "Manage",
              icon: "tune",
            }
      }
      deleteAction={
        isDraft
          ? {
              resourceName: "Purchase Order",
              itemName: po.po_number,
              successMessage: "Purchase order deleted.",
              onConfirm: () => deletePurchaseOrder(po.id),
            }
          : undefined
      }
    />
  );
}

export const poColumns: ColumnDef<PurchaseOrderSummary>[] = [
  {
    accessorKey: "po_number",
    header: "PO Number",
    cell: ({ row }) => {
      const po = row.original;
      const href =
        po.status === "draft"
          ? `/purchase-orders/${po.id}`
          : `/purchase-orders/${po.id}/manage`;
      return (
        <Link
          href={href}
          className="text-sm font-bold text-primary"
        >
          {po.po_number}
        </Link>
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
    accessorKey: "supplier_name",
    header: "Supplier",
    cell: ({ row }) => (
      <span className="text-sm text-on-surface-variant">
        {row.original.supplier_name ?? (
          <span className="italic text-on-surface-variant/50">—</span>
        )}
      </span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Created Date",
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <PoActionsCell po={row.original} />,
  },
];
