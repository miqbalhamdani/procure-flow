"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useMemo, useState, type ReactElement } from "react";
import { useForm, Controller } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import * as v from "valibot";

import { ComboboxSelect, type ComboboxOption } from "@/components/ui/combobox-select";
import type { RemainingQuantity, ShipmentItem } from "@/features/shipments/types";
import { formatCurrency } from "@/lib/price";

// ─── Schema ───────────────────────────────────────────────────────────────────

const itemSchema = v.object({
  purchaseOrderItemId: v.pipe(v.string(), v.uuid("Please select a product")),
  quantity: v.pipe(v.number("Quantity is required"), v.integer(), v.minValue(1, "Quantity must be at least 1")),
});

type FormValues = v.InferInput<typeof itemSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddModeProps {
  item?: undefined;
  open?: undefined;
  onOpenChange?: undefined;
  trigger?: ReactElement;
  remainingQuantities: RemainingQuantity[];
  onSubmit: (values: FormValues) => Promise<{ error?: string }>;
}

interface EditModeProps {
  item: ShipmentItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remainingQuantities: RemainingQuantity[];
  onSubmit: (values: FormValues) => Promise<{ error?: string }>;
}

type Props = AddModeProps | EditModeProps;

// ─── Component ────────────────────────────────────────────────────────────────

export function ShipmentItemModal(props: Props) {
  const isEditMode = props.item !== undefined;

  const [internalOpen, setInternalOpen] = useState(false);
  const open = isEditMode ? props.open : internalOpen;
  const setOpen = isEditMode ? props.onOpenChange : setInternalOpen;

  const [serverError, setServerError] = useState<string | null>(null);

  const resolver = useMemo(() => valibotResolver(itemSchema), []);

  const {
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver,
    defaultValues: isEditMode
      ? { purchaseOrderItemId: props.item.purchase_order_item_id, quantity: props.item.quantity }
      : { purchaseOrderItemId: "", quantity: 1 },
  });

  const watchedPoItemId = watch("purchaseOrderItemId");
  const selectedRemaining = props.remainingQuantities.find(
    (r) => r.poItemId === watchedPoItemId,
  );

  // In edit mode, the "effective" remaining = remainingQty + current item's own qty (since it's excluded from calc)
  const effectiveRemaining = isEditMode && selectedRemaining
    ? selectedRemaining.remainingQty + (props.item?.quantity ?? 0)
    : selectedRemaining?.remainingQty ?? 0;

  const productOptions: ComboboxOption[] = props.remainingQuantities
    .filter((r) => isEditMode ? true : r.remainingQty > 0)
    .map((r) => ({
      value: r.poItemId,
      label: `${r.sku} — ${r.name}`,
    }));

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      reset();
      setServerError(null);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const result = await props.onSubmit(values);
    if (result?.error) {
      setServerError(result.error);
      return;
    }
    onOpenChange(false);
  };

  const inputClass =
    "w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-background placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30";
  const readonlyClass =
    "w-full rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface-variant";
  const labelClass =
    "block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5";
  const errorClass = "mt-1 text-xs font-medium text-error";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {!isEditMode && (
        <Dialog.Trigger asChild>
          {props.trigger ?? (
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-surface-container-low px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-surface-container active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px] leading-none">add</span>
              Add Item
            </button>
          )}
        </Dialog.Trigger>
      )}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-[#131b2e]/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-[101] flex items-center justify-center p-6">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xl">
            <div className="px-8 pb-4 pt-8">
              <Dialog.Title className="text-xl font-extrabold tracking-tight text-on-background">
                {isEditMode ? "Edit Shipment Item" : "Add Shipment Item"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-on-surface-variant">
                Select a product from the purchase order and specify quantity.
              </Dialog.Description>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="px-8 pb-8 space-y-4">
              {serverError && (
                <div className="rounded-xl border border-error-container bg-error-container/40 px-4 py-3 text-sm font-medium text-on-error-container">
                  {serverError}
                </div>
              )}

              <div>
                <label className={labelClass}>Product</label>
                <Controller
                  name="purchaseOrderItemId"
                  control={control}
                  render={({ field }) => (
                    <ComboboxSelect
                      options={productOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select product…"
                      hasError={!!errors.purchaseOrderItemId}
                    />
                  )}
                />
                {errors.purchaseOrderItemId && (
                  <p className={errorClass}>{errors.purchaseOrderItemId.message}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Quantity to Ship</label>
                <Controller
                  name="quantity"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      min={1}
                      max={effectiveRemaining || undefined}
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                      className={inputClass}
                      placeholder="1"
                    />
                  )}
                />
                {errors.quantity && <p className={errorClass}>{errors.quantity.message}</p>}
              </div>

              {selectedRemaining && (
                <>
                  <div>
                    <label className={labelClass}>Remaining to Ship</label>
                    <div className={readonlyClass}>
                      {effectiveRemaining.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Price (USD)</label>
                    <div className={readonlyClass}>
                      {formatCurrency(selectedRemaining.priceFromPO)}
                    </div>
                  </div>
                </>
              )}

              {selectedRemaining && watch("quantity") > 0 && (
                <div>
                  <label className={labelClass}>Total</label>
                  <div className={readonlyClass + " font-semibold text-on-background"}>
                    {formatCurrency(watch("quantity") * Number(selectedRemaining.priceFromPO))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-secondary hover:bg-surface-container-low transition-colors"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Saving…" : isEditMode ? "Save Changes" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
