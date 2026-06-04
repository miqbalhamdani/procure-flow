"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as v from "valibot";

import { DatePicker } from "@/components/ui/date-picker";
import { ShipmentItemModal } from "@/features/shipments/components/shipment-item-modal";
import { ShipmentItemsTable } from "@/features/shipments/components/shipment-items-table";
import {
  addShipmentItem,
  createShipment,
  submitShipment,
  updateShipment,
} from "@/features/shipments/services/shipment-action";
import type { RemainingQuantity, ShipmentDetail } from "@/features/shipments/types";

// ─── Schema ───────────────────────────────────────────────────────────────────

const shipmentSchema = v.object({
  shipmentNumber: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Shipment number is required"),
    v.maxLength(100),
  ),
  shipmentDate: v.optional(v.string()),
});

type FormValues = v.InferInput<typeof shipmentSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ShipmentFormProps {
  purchaseOrderId: string;
  shipment?: ShipmentDetail;
  remainingQuantities: RemainingQuantity[];
  canEditShipment: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ShipmentForm({
  purchaseOrderId,
  shipment,
  remainingQuantities,
  canEditShipment,
}: ShipmentFormProps) {
  const router = useRouter();

  const [serverError, setServerError] = useState<string | null>(null);
  const [savedShipmentId, setSavedShipmentId] = useState<string | null>(
    shipment?.id ?? null,
  );

  const shipmentDateFieldId = useId();

  const resolver = useMemo(() => valibotResolver(shipmentSchema), []);

  const shipmentId = savedShipmentId ?? shipment?.id ?? null;
  const isShipmentCreated = !!shipmentId;
  const isPendingShipment = !shipment || shipment.status === "pending";
  const canManageShipmentItems = canEditShipment && isShipmentCreated && isPendingShipment;
  const hasShipmentItems = (shipment?.items.length ?? 0) > 0;
  const canSubmitShipment = canEditShipment && isShipmentCreated && hasShipmentItems;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver,
    defaultValues: shipment
      ? {
        shipmentNumber: shipment.shipment_number,
        shipmentDate: shipment.shipment_date ?? "",
      }
      : { shipmentNumber: "", shipmentDate: "" },
  });

  const onSaveDraft = handleSubmit(async (values) => {
    setServerError(null);

    if (!canEditShipment) {
      setServerError("You do not have permission to edit this shipment.");
      return;
    }

    if (shipmentId) {
      const result = await updateShipment({
        id: shipmentId,
        purchaseOrderId,
        ...values,
      });
      if (result.error) {
        setServerError(result.error);
        return;
      }
      toast.success("Shipment draft saved.");
      router.refresh();
    } else {
      const result = await createShipment({ purchaseOrderId, ...values });
      if (result.error) {
        setServerError(result.error);
        return;
      }
      toast.success("Shipment draft saved.");
      setSavedShipmentId(result.id ?? null);
      router.replace(
        `/purchase-orders/${purchaseOrderId}/shipments/${result.id}`,
      );
    }
  });

  const onSubmitShipment = handleSubmit(async (values) => {
    setServerError(null);

    if (!canEditShipment) {
      setServerError("You do not have permission to submit this shipment.");
      return;
    }

    if (!shipmentId) {
      setServerError("Save this shipment as a draft before submitting it.");
      return;
    }
    if (!hasShipmentItems) {
      setServerError("Add at least one shipment item before submitting.");
      return;
    }

    const result = await updateShipment({
      id: shipmentId,
      purchaseOrderId,
      ...values,
    });
    if (result.error) {
      setServerError(result.error);
      return;
    }

    const submitResult = await submitShipment({ id: shipmentId });
    if (submitResult.error) {
      setServerError(submitResult.error);
      return;
    }

    toast.success("Shipment submitted and in transit.");
    router.push(`/purchase-orders/${purchaseOrderId}/shipments/${shipmentId}`);
  });

  const handleAddItem = async (values: {
    purchaseOrderItemId: string;
    quantity: number;
  }) => {
    if (!canEditShipment) {
      return { error: "You do not have permission to edit shipment items." };
    }

    if (!shipmentId) {
      return { error: "Save this shipment as a draft before adding items." };
    }

    const result = await addShipmentItem({
      shipmentId,
      purchaseOrderItemId: values.purchaseOrderItemId,
      quantity: values.quantity,
    });
    if (!result.error) {
      toast.success("Item added.");
      router.refresh();
    }
    return result;
  };

  const inputClass =
    "w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-background placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30";
  const labelClass =
    "block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5";
  const errorClass = "mt-1 text-xs font-medium text-error";

  return (
    <div className="space-y-6">
      {serverError && (
        <div className="rounded-xl border border-error-container bg-error-container/40 px-4 py-3 text-sm font-medium text-on-error-container">
          {serverError}
        </div>
      )}

      {/* General Information */}
      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <h3 className="mb-5 font-headline text-base font-bold tracking-tight text-on-background">
          General Information
        </h3>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Shipment Number</label>
            <input
              {...register("shipmentNumber")}
              className={inputClass}
              placeholder="e.g. SHP-2026-001"
              disabled={!canEditShipment}
            />
            {errors.shipmentNumber && (
              <p className={errorClass}>{errors.shipmentNumber.message}</p>
            )}
          </div>
          <div>
            <label htmlFor={shipmentDateFieldId} className={labelClass}>
              Shipment Date
            </label>
            <Controller
              name="shipmentDate"
              control={control}
              render={({ field, fieldState }) => {
                return (
                  <DatePicker
                    id={shipmentDateFieldId}
                    value={field.value}
                    onChange={(value) => {
                      if (!canEditShipment) return;
                      field.onChange(value);
                    }}
                    errorId={`${shipmentDateFieldId}-error`}
                    hasError={!!fieldState.error}
                    triggerClassName="h-[46px] rounded-xl border-0 bg-surface-container-low px-4 text-on-background shadow-none ring-1 ring-transparent hover:bg-surface-container-low hover:text-on-background focus-visible:ring-2 focus-visible:ring-primary/30 data-[empty=true]:text-on-surface-variant/70"
                    disabled={!canEditShipment}
                  />
                );
              }}
            />
            {errors.shipmentDate && (
              <p id={`${shipmentDateFieldId}-error`} className={errorClass}>
                {errors.shipmentDate.message}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Shipment Items */}
      <section className="overflow-hidden rounded-3xl border border-outline-variant/5 bg-surface-container-lowest shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-outline-variant/5 px-8 py-6">
          <h3 className="font-headline text-base font-bold tracking-tight text-on-background">
            Shipment Items
          </h3>
          {canManageShipmentItems && (
            <ShipmentItemModal
              remainingQuantities={remainingQuantities}
              onSubmit={handleAddItem}
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl bg-surface-container-low px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-surface-container active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px] leading-none">
                    add
                  </span>
                  Add Item
                </button>
              }
            />
          )}
        </div>
        <ShipmentItemsTable
          items={shipment?.items ?? []}
          shipmentId={shipmentId ?? ""}
          remainingQuantities={remainingQuantities}
          isEditable={canManageShipmentItems}
        />
      </section>

      {/* Actions */}

      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-on-background">
              {canSubmitShipment
                ? "Review your shipment items and submit when you're ready."
                : isShipmentCreated
                  ? "Add at least one shipment item before submitting."
                  : "Save this shipment as a draft before submitting it."}
            </p>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              Submitted shipments will move into the In Transit status.
            </p>
          </div>
          {canEditShipment && (
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={onSaveDraft}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-bold text-primary hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
              >
                <span className="material-symbols-outlined text-[16px] leading-none">
                  save
                </span>
                {isSubmitting ? "Saving…" : "Save as Draft"}
              </button>
              <button
                type="button"
                onClick={onSubmitShipment}
                disabled={isSubmitting || !canSubmitShipment}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[16px] leading-none">
                  send
                </span>
                {isSubmitting ? "Submitting…" : "Submit Shipment"}
              </button>
            </div>)}
        </div>
      </section>
    </div>
  );
}
