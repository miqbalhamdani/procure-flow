"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ActionsCell } from "@/components/ui/actions-cell";
import { BaseTable } from "@/components/ui/base-table";
import { ShipmentItemModal } from "@/features/shipments/components/shipment-item-modal";
import {
  deleteShipmentItem,
  updateShipmentItem,
} from "@/features/shipments/services/shipment-action";
import type { RemainingQuantity, ShipmentItem } from "@/features/shipments/types";
import { formatCurrency } from "@/lib/price";

interface ShipmentItemsTableProps {
  items: ShipmentItem[];
  shipmentId: string;
  remainingQuantities: RemainingQuantity[];
  isEditable: boolean;
}

type ShipmentItemFormValues = {
  purchaseOrderItemId: string;
  quantity: number;
};

export function ShipmentItemsTable({
  items,
  shipmentId,
  remainingQuantities,
  isEditable,
}: ShipmentItemsTableProps) {
  const router = useRouter();

  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * Number(item.price),
    0,
  );

  const handleEdit = async (
    item: ShipmentItem,
    values: ShipmentItemFormValues,
  ) => {
    const result = await updateShipmentItem({
      id: item.id,
      shipmentId,
      purchaseOrderItemId: item.purchase_order_item_id,
      quantity: values.quantity,
    });

    if (!result.error) {
      toast.success("Item updated.");
      router.refresh();
    }

    return result;
  };

  const baseColumns: ColumnDef<ShipmentItem>[] = [
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
        <span className="text-sm font-medium text-on-background">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Qty to Ship",
      cell: ({ row }) => (
        <span className="text-sm text-on-surface-variant">
          {row.original.quantity.toLocaleString()}
        </span>
      ),
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
  ];

  const columns: ColumnDef<ShipmentItem>[] = isEditable
    ? [
        ...baseColumns,
        {
          id: "actions",
          header: "Actions",
          cell: ({ row }) => (
            <ActionsCell
              editAction={{
                type: "modal",
                render: ({ open, onOpenChange }) => (
                  <ShipmentItemModal
                    item={row.original}
                    open={open}
                    onOpenChange={onOpenChange}
                    remainingQuantities={remainingQuantities}
                    onSubmit={(values) => handleEdit(row.original, values)}
                  />
                ),
              }}
              deleteAction={{
                resourceName: "Item",
                itemName: row.original.name,
                successMessage: "Item deleted.",
                onConfirm: async () => deleteShipmentItem(row.original.id, shipmentId),
              }}
            />
          ),
        },
      ]
    : baseColumns;

  return (
    <BaseTable
      columns={columns}
      data={items}
      emptyMessage={isEditable ? "No items added yet." : "Save this shipment to add items."}
      emptyDescription={
        isEditable
          ? "Use the Add Item button above to add shipment items."
          : "Complete the general information and save this shipment as a draft before adding items."
      }
      footer={
        items.length > 0 ? (
          <div className="flex items-center justify-end gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Total Qty
              </span>
              <span className="text-base font-extrabold text-on-background">
                {totalQty.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Total Amount
              </span>
              <span className="text-lg font-extrabold text-on-background">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        ) : null
      }
      pagination={null}
    />
  );
}
