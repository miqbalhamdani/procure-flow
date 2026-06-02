"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { ActionsCell } from "@/components/ui/actions-cell";
import { BaseTable } from "@/components/ui/base-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { deletePurchaseOrder } from "@/features/purchase-orders/services/po-action";
import type {
  PaginatedPurchaseOrders,
  PurchaseOrderSummary,
} from "@/features/purchase-orders/types";

type PoColumnsOptions = {
  canEditPurchaseOrder: boolean;
  canDeletePurchaseOrder: boolean;
};

function PoActionsCell({
  po,
  canEditPurchaseOrder,
  canDeletePurchaseOrder,
}: {
  po: PurchaseOrderSummary;
  canEditPurchaseOrder: boolean;
  canDeletePurchaseOrder: boolean;
}) {
  const isDraft = po.status === "draft";
  const detailHref = `/purchase-orders/${po.id}/manage`;
  const editHref = `/purchase-orders/${po.id}`;

  return (
    <ActionsCell
      editAction={
        isDraft
          ? canEditPurchaseOrder
            ? { type: "link", href: editHref }
            : { type: "link", href: detailHref, label: "View", icon: "visibility" }
          : {
              type: "link",
              href: detailHref,
              label: "Manage",
              icon: "tune",
            }
      }
      deleteAction={
        isDraft && canDeletePurchaseOrder
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

export function poColumns({
  canEditPurchaseOrder,
  canDeletePurchaseOrder,
}: PoColumnsOptions): ColumnDef<PurchaseOrderSummary>[] {
  const columns: ColumnDef<PurchaseOrderSummary>[] = [
    {
    accessorKey: "po_number",
    header: "PO Number",
    cell: ({ row }) => {
      const po = row.original;
      const href =
        po.status === "draft" && canEditPurchaseOrder
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
  ];

  if (canEditPurchaseOrder || canDeletePurchaseOrder) {
    columns.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <PoActionsCell
          po={row.original}
          canEditPurchaseOrder={canEditPurchaseOrder}
          canDeletePurchaseOrder={canDeletePurchaseOrder}
        />
      ),
    });
  }

  return columns;
}

type PoListTableProps = {
  data: PaginatedPurchaseOrders["data"];
  pagination: PaginatedPurchaseOrders["meta"] | null;
  canEditPurchaseOrder: boolean;
  canDeletePurchaseOrder: boolean;
};

export function PoListTable({
  data,
  pagination,
  canEditPurchaseOrder,
  canDeletePurchaseOrder,
}: PoListTableProps) {
  return (
    <BaseTable
      columns={poColumns({
        canEditPurchaseOrder,
        canDeletePurchaseOrder,
      })}
      data={data}
      emptyMessage="No purchase orders found."
      emptyDescription="Create your first purchase order to get started."
      pagination={pagination}
    />
  );
}
