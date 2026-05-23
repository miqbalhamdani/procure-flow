"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as v from "valibot";

import { addPurchaseOrderItem } from "@/features/purchase-orders/services/po-action";
import type { PurchaseOrderItem } from "@/features/purchase-orders/types";
import {
  formatPriceInput,
  formatStoredPrice,
  parsePriceInput,
  PRICE_INPUT_PATTERN,
} from "@/lib/price";

// ─── Schema ───────────────────────────────────────────────────────────────────

const itemSchema = v.object({
  sku: v.pipe(v.string(), v.trim(), v.minLength(1, "SKU is required"), v.maxLength(100)),
  name: v.pipe(v.string(), v.trim(), v.minLength(1, "Item name is required"), v.maxLength(255)),
  quantity: v.pipe(
    v.number("Quantity must be a number"),
    v.integer(),
    v.minValue(1, "Quantity must be at least 1"),
  ),
  price: v.pipe(
    v.string("Price is required"),
    v.trim(),
    v.minLength(1, "Price is required"),
    v.check((input) => PRICE_INPUT_PATTERN.test(input.replace(/,/g, "")), "Price must be a number"),
    v.transform((input) => parsePriceInput(input)),
    v.check((input) => Number.isFinite(input), "Price must be a number"),
    v.minValue(0, "Price must be non-negative"),
  ),
});

type FormValues = v.InferInput<typeof itemSchema>;
type SubmitValues = v.InferOutput<typeof itemSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddModeProps {
  item?: undefined;
  purchaseOrderId: string;
  open?: undefined;
  onOpenChange?: undefined;
  onSubmit?: undefined;
}

interface EditModeProps {
  item: PurchaseOrderItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SubmitValues) => Promise<{ error?: string }>;
}

type Props = AddModeProps | EditModeProps;

// ─── Component ────────────────────────────────────────────────────────────────

export function PoItemModal(props: Props) {
  const isEditMode = props.item !== undefined;
  const router = useRouter();

  const [internalOpen, setInternalOpen] = useState(false);
  const open = props.item ? props.open : internalOpen;
  const setOpen = props.item ? props.onOpenChange : setInternalOpen;

  const [serverError, setServerError] = useState<string | null>(null);

  const resolver = useMemo(() => valibotResolver(itemSchema), []);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, undefined, SubmitValues>({
    resolver,
    defaultValues: props.item
      ? {
          sku: props.item.sku,
          name: props.item.name,
          quantity: props.item.quantity,
          price: formatStoredPrice(props.item.price),
        }
      : { sku: "", name: "", quantity: 1, price: "" },
  });

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      reset();
      setServerError(null);
    }
  };

  const onSubmit = async (values: SubmitValues) => {
    setServerError(null);
    const result = props.item
      ? await props.onSubmit(values)
      : await addPurchaseOrderItem({
          purchaseOrderId: props.purchaseOrderId,
          ...values,
        });

    if (result?.error) {
      setServerError(result.error);
      return;
    }

    if (!props.item) {
      toast.success("Item added.");
      router.refresh();
    }

    onOpenChange(false);
  };

  const inputClass =
    "w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-background placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30";
  const errorClass = "mt-1 text-xs font-medium text-error";
  const labelClass = "block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {!isEditMode && (
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-surface-container-low px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-surface-container active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">add</span>
            Add Item
          </button>
        </Dialog.Trigger>
      )}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-[#131b2e]/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-[101] flex items-center justify-center p-6">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xl">
            {/* Header */}
            <div className="px-8 pb-4 pt-8">
              <Dialog.Title className="text-xl font-extrabold tracking-tight text-on-background">
                {isEditMode ? "Edit Item" : "Add Item"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-on-surface-variant">
                {isEditMode ? "Update item details." : "Add a new item to this purchase order."}
              </Dialog.Description>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="px-8 pb-8">
              {serverError && (
                <div className="mb-4 rounded-xl border border-error-container bg-error-container/40 px-4 py-3 text-sm font-medium text-on-error-container">
                  {serverError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>SKU</label>
                  <input {...register("sku")} className={inputClass} placeholder="e.g. SKU-001" />
                  {errors.sku && <p className={errorClass}>{errors.sku.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Quantity</label>
                  <input
                    {...register("quantity", { valueAsNumber: true })}
                    type="number"
                    min={1}
                    className={inputClass}
                    placeholder="1"
                  />
                  {errors.quantity && <p className={errorClass}>{errors.quantity.message}</p>}
                </div>
              </div>

              <div className="mt-4">
                <label className={labelClass}>Item Name</label>
                <input {...register("name")} className={inputClass} placeholder="Item name" />
                {errors.name && <p className={errorClass}>{errors.name.message}</p>}
              </div>

              <div className="mt-4">
                <label className={labelClass}>Price (USD)</label>
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      inputMode="decimal"
                      value={field.value ?? ""}
                      onBlur={() => {
                        field.onBlur();
                        field.onChange(formatPriceInput(field.value ?? ""));
                      }}
                      onChange={(event) => field.onChange(formatPriceInput(event.target.value))}
                      className={inputClass}
                      placeholder="e.g. 3,000"
                    />
                  )}
                />
                {errors.price && <p className={errorClass}>{errors.price.message}</p>}
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-secondary transition-all hover:bg-surface-container-low"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-60"
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
