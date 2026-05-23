"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ActionsCell } from "@/components/ui/actions-cell";
import { BaseTable } from "@/components/ui/base-table";
import { PoItemModal } from "@/features/purchase-orders/components/po-item-modal";
import {
  deletePurchaseOrderItem,
  updatePurchaseOrderItem,
} from "@/features/purchase-orders/services/po-action";
import type { PurchaseOrderItem } from "@/features/purchase-orders/types";
import { formatCurrency } from "@/lib/price";

interface PoItemsTableProps {
  items: PurchaseOrderItem[];
  purchaseOrderId: string;
  isEditable: boolean;
}

export function PoItemsTable({ items, purchaseOrderId, isEditable }: PoItemsTableProps) {
  const router = useRouter();

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * Number(item.price), 0);

  const handleEdit = async (
    item: PurchaseOrderItem,
    values: { sku: string; name: string; quantity: number; price: number },
  ) => {
    const result = await updatePurchaseOrderItem({
      id: item.id,
      purchaseOrderId,
      sku: values.sku,
      name: values.name,
      quantity: values.quantity,
      price: values.price,
    });
    if (!result.error) {
      toast.success("Item updated.");
      router.refresh();
    }
    return result;
  };

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
        <span className="text-sm font-medium text-on-background">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
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

  if (isEditable) {
    columns.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <ActionsCell
          editAction={{
            type: "modal",
            render: ({ open, onOpenChange }) => (
              <PoItemModal
                item={row.original}
                open={open}
                onOpenChange={onOpenChange}
                onSubmit={(values) => handleEdit(row.original, values)}
              />
            ),
          }}
          deleteAction={{
            resourceName: "Item",
            itemName: row.original.name,
            successMessage: "Item deleted.",
            onConfirm: async () => deletePurchaseOrderItem(row.original.id, purchaseOrderId),
          }}
        />
      ),
    });
  }

  return (
    <div className="space-y-3">
      <BaseTable
        columns={columns}
        data={items}
        emptyMessage={isEditable ? "No items added yet." : "Save this purchase order to add items."}
        emptyDescription={isEditable
          ? "Use the Add Item button to create the first line item for this purchase order."
          : "Complete the general information and save this purchase order as a draft before adding items."
        }
        pagination={null}
      />

      {items.length > 0 && (
        <div className="flex items-center justify-end gap-2 py-4 pr-12">
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Total Amount
          </span>
          <span className="text-lg font-extrabold text-on-background">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      )}
    </div>
  );
}
