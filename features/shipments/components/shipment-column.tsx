"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useMemo } from "react";

import { ActionsCell } from "@/components/ui/actions-cell";
import { BaseTable } from "@/components/ui/base-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { deleteShipment } from "@/features/shipments/services/shipment-action";
import type { ShipmentSummary } from "@/features/shipments/types";
import type { PaginationMeta } from "@/lib/pagination";
import { formatDate } from "@/lib/utils";

function ShipmentActionsCell({
  shipment,
  purchaseOrderId,
}: {
  shipment: ShipmentSummary;
  purchaseOrderId: string;
}) {
  const isPending = shipment.status === "pending";
  const isManageOnly =
    shipment.status === "in_transit" || shipment.status === "delivered";
  const href = `/purchase-orders/${purchaseOrderId}/shipments/${shipment.id}`;

  if (!isPending && !isManageOnly) {
    return null;
  }

  return (
    <ActionsCell
      editAction={
        isPending
          ? { type: "link", href }
          : { type: "link", href, label: "Manage", icon: "tune" }
      }
      deleteAction={
        isPending
          ? {
              resourceName: "Shipment",
              itemName: shipment.shipment_number,
              onConfirm: () => deleteShipment(shipment.id, purchaseOrderId),
            }
          : undefined
      }
    />
  );
}

function shipmentColumns(purchaseOrderId: string): ColumnDef<ShipmentSummary>[] {
  return [
    {
      accessorKey: "shipment_number",
      header: "Shipment Number",
      cell: ({ row }) => {
        const shipment = row.original;
        return (
          <Link
            href={`/purchase-orders/${purchaseOrderId}/shipments/${shipment.id}`}
            className="text-sm font-bold text-primary"
          >
            {shipment.shipment_number}
          </Link>
        );
      },
    },
    {
      accessorKey: "shipment_date",
      header: "Shipment Date",
      cell: ({ row }) => {
        const shipmentDate = row.original.shipment_date;
        return (
          <span className="text-sm text-on-surface-variant">
            {shipmentDate ? (
              formatDate(shipmentDate)
            ) : (
              <span className="italic text-on-surface-variant/50">—</span>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "last_tracking_at",
      header: "Last Update",
      cell: ({ row }) => {
        const lastTrackingAt = row.original.last_tracking_at;
        return (
          <span className="text-sm text-on-surface-variant">
            {lastTrackingAt ? (
              formatDate(lastTrackingAt)
            ) : (
              <span className="italic text-on-surface-variant/50">—</span>
            )}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <ShipmentActionsCell shipment={row.original} purchaseOrderId={purchaseOrderId} />
      ),
    },
  ];
}

interface ShipmentListTableProps {
  purchaseOrderId: string;
  shipments: ShipmentSummary[];
  pagination: PaginationMeta | null;
  canCreateShipment: boolean;
}

export function ShipmentListTable({
  purchaseOrderId,
  shipments,
  pagination,
  canCreateShipment,
}: ShipmentListTableProps) {
  const columns = useMemo(
    () => shipmentColumns(purchaseOrderId),
    [purchaseOrderId],
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-outline-variant/5 bg-surface-container-lowest shadow-sm">
      <div className="border-b border-outline-variant/5 px-8 py-6">
        {canCreateShipment && (
          <div className="flex justify-end">
            <Link
              href={`/purchase-orders/${purchaseOrderId}/shipments/new`}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px] leading-none">add</span>
              Add Shipment
            </Link>
          </div>
        )}
      </div>

      <BaseTable
        columns={columns}
        data={shipments}
        emptyMessage="No shipments yet."
        emptyDescription={
          canCreateShipment
            ? "Create the first shipment for this purchase order."
            : "Shipments will appear here once created."
        }
        pagination={pagination}
      />
    </div>
  );
}
