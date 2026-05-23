"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { BaseTable } from "@/components/ui/base-table";
import { PartyCard } from "@/features/purchase-orders/components/po-party-card";
import type {
  PurchaseOrderDetail,
  PurchaseOrderItem,
} from "@/features/purchase-orders/types";
import { formatCurrency } from "@/lib/price";

interface PoDetailViewProps {
  po: PurchaseOrderDetail;
}

export function PoDetailView({ po }: PoDetailViewProps) {
  const totalAmount = po.items.reduce((sum, item) => sum + item.quantity * Number(item.price), 0);

  const columns: ColumnDef<PurchaseOrderItem>[] = [
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium text-on-surface-variant">
          {row.original.sku}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Item Name",
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-on-background">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Qty Ordered",
      cell: ({ row }) => (
        <span className="text-sm text-on-surface-variant">
          {row.original.quantity.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "quantity_received",
      header: "Qty Received",
      cell: ({ row }) => {
        const isComplete = row.original.quantity_received >= row.original.quantity;

        return (
          <div className="flex flex-col items-end gap-1">
            <span className={`text-sm font-semibold ${isComplete ? "text-primary" : "text-on-background"}`}>
              {row.original.quantity_received.toLocaleString()}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: "Price (USD)",
      cell: ({ row }) => (
        <span className="text-sm text-on-surface-variant">
          {formatCurrency(row.original.price)}
        </span>
      ),
    },
    {
      id: "total",
      header: "Total",
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-on-background">
          {formatCurrency(row.original.quantity * Number(row.original.price))}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Approval / Rejection note */}
      {po.status === "rejected" && po.rejection_reason && (
        <div className="rounded-xl border border-error-container bg-error-container/30 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-error mb-1">
            Rejection Reason
          </p>
          <p className="text-sm text-on-error-container">{po.rejection_reason}</p>
        </div>
      )}
      {po.status === "in_progress" && po.approval_note && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
            Approval Note
          </p>
          <p className="text-sm text-on-background">{po.approval_note}</p>
        </div>
      )}

      {/* Company & Supplier Info */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PartyCard
          title="Company"
          name={po.company_name}
          country={po.company_country}
          address={po.company_address}
          icon="domain"
          accentClass="from-primary/12 via-primary/6 to-surface-container-lowest"
          railClass="bg-primary"
          chipClass="bg-primary/10 text-primary ring-primary/10"
          iconClass="bg-primary text-white shadow-lg shadow-primary/20"
        />
        <PartyCard
          title="Supplier"
          name={po.supplier_name}
          country={po.supplier_country}
          address={po.supplier_address}
          icon="inventory_2"
          accentClass="from-tertiary-fixed/70 via-tertiary-fixed/25 to-surface-container-lowest"
          railClass="bg-tertiary"
          chipClass="bg-tertiary-fixed/60 text-on-tertiary-fixed-variant ring-tertiary/10"
          iconClass="bg-tertiary text-on-tertiary shadow-lg shadow-tertiary/20"
        />
      </div>

      {/* Items Detail Table */}
      <div className="overflow-hidden rounded-3xl border border-outline-variant/5 bg-surface-container-lowest shadow-sm">
        <div className="border-b border-outline-variant/5 px-8 py-6">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Purchase Order Items
          </p>
          <h4 className="mt-1 font-headline text-xl font-bold tracking-tight text-on-background">
            Items &amp; Quantities
          </h4>
        </div>

        <BaseTable
          columns={columns}
          data={po.items}
          emptyMessage="No items added to this purchase order."
          emptyDescription="Add line items to see quantities, pricing, and receipt progress here."
          footer={
            <div className="flex justify-end">
              <div className="rounded-2xl px-4 py-3 sm:min-w-56">
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
                  Total Amount
                </p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-on-background">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </div>
          }
          pagination={null}
        />
      </div>
    </div>
  );
}
