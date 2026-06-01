"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { toast } from "sonner";
import * as v from "valibot";

import { ComboboxSelect, type ComboboxOption } from "@/components/ui/combobox-select";
import {
  createPurchaseOrder,
  updatePurchaseOrder,
  submitPurchaseOrder,
  fetchSupplierOptionsAction,
} from "@/features/purchase-orders/services/po-action";
import { PoItemsTable } from "@/features/purchase-orders/components/po-items-table";
import { PoItemModal } from "@/features/purchase-orders/components/po-item-modal";
import type {
  PurchaseOrderDetail,
  CompanyOption,
  SupplierOption,
} from "@/features/purchase-orders/types";

// ─── Schema ───────────────────────────────────────────────────────────────────

const poSchema = v.object({
  companyId: v.pipe(v.string(), v.uuid("Please select a company")),
  supplierId: v.pipe(v.string(), v.uuid("Please select a supplier")),
  poNumber: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "PO Number is required"),
    v.maxLength(100, "PO Number must be at most 100 characters"),
  ),
});

type FormValues = v.InferInput<typeof poSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface PoFormProps {
  po?: PurchaseOrderDetail;
  initialCompanies?: CompanyOption[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PoForm({
  po,
  initialCompanies = [],
}: PoFormProps) {
  const isEditMode = !!po;
  const router = useRouter();

  const initialCompanyId =
    po?.company_id ?? (initialCompanies.length === 1 ? initialCompanies[0].id : "");
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(() => Boolean(initialCompanyId));
  const [supplierLoadError, setSupplierLoadError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedPoId, setSavedPoId] = useState<string | null>(po?.id ?? null);
  const poId = savedPoId ?? po?.id ?? null;
  const hasItems = (po?.items.length ?? 0) > 0;
  const createdAt = po?.created_at;

  const resolver = useMemo(() => valibotResolver(poSchema), []);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver,
    defaultValues: isEditMode
      ? {
          companyId: po.company_id,
          supplierId: po.supplier_id,
          poNumber: po.po_number,
        }
      : {
          companyId: initialCompanyId,
          supplierId: "",
          poNumber: "",
        },
  });

  const watchedCompanyId = useWatch({ control, name: "companyId" });
  const watchedSupplierId = useWatch({ control, name: "supplierId" });
  const selectedCompany = useMemo(
    () => initialCompanies.find((c) => c.id === watchedCompanyId) ?? null,
    [initialCompanies, watchedCompanyId],
  );
  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === watchedSupplierId) ?? null,
    [suppliers, watchedSupplierId],
  );
  const createdDate = useMemo(() => {
    const date = createdAt ? new Date(createdAt) : new Date();

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [createdAt]);

  useEffect(() => {
    if (isEditMode || !initialCompanyId) {
      return;
    }

    setValue("companyId", initialCompanyId);
  }, [initialCompanyId, isEditMode, setValue]);

  // Auto-load suppliers when company changes
  useEffect(() => {
    let ignore = false;

    if (!watchedCompanyId) {
      return;
    }

    fetchSupplierOptionsAction(watchedCompanyId)
      .then(({ data, error }) => {
        if (ignore) {
          return;
        }

        if (error) {
          setSuppliers([]);
          setSupplierLoadError(error);
          return;
        }

        setSuppliers(data ?? []);
      })
      .catch(() => {
        if (!ignore) {
          setSuppliers([]);
          setSupplierLoadError("Failed to load suppliers.");
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoadingSuppliers(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [watchedCompanyId]);

  const companyOptions = useMemo<ComboboxOption[]>(
    () =>
      initialCompanies.map((c) => ({
        value: c.id,
        label: c.name,
      })),
    [initialCompanies],
  );

  const supplierOptions = useMemo<ComboboxOption[]>(
    () =>
      (watchedCompanyId ? suppliers : []).map((s) => ({
        value: s.id,
        label: s.name,
      })),
    [suppliers, watchedCompanyId],
  );

  const onSaveDraft = handleSubmit(async (values) => {
    setServerError(null);
    if (isEditMode || savedPoId) {
      const result = await updatePurchaseOrder({
        id: savedPoId ?? po!.id,
        ...values,
      });
      if (result.error) {
        setServerError(result.error);
        return;
      }
      toast.success("Draft saved.");
      router.refresh();
    } else {
      const result = await createPurchaseOrder(values);
      if (result.error) {
        setServerError(result.error);
        return;
      }
      if (!result.id) {
        setServerError("Failed to create purchase order.");
        return;
      }
      toast.success("Draft saved.");
      setSavedPoId(result.id);
      router.replace(`/purchase-orders/${result.id}`);
    }
  });

  const onSubmitForApproval = handleSubmit(async (values) => {
    setServerError(null);
    if (!poId) {
      return;
    }
    if (!hasItems) {
      setServerError("Add at least one purchase order item before submitting.");
      return;
    }

    const result = await updatePurchaseOrder({ id: poId, ...values });
    if (result.error) {
      setServerError(result.error);
      return;
    }

    const submitResult = await submitPurchaseOrder(poId);
    if (submitResult.error) {
      setServerError(submitResult.error);
      return;
    }

    toast.success("Purchase order submitted for approval.");
    router.push(`/purchase-orders/${poId}/manage`);
  });

  const inputClass =
    "w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-background placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30";
  const readonlyClass =
    "w-full rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface-variant";
  const readonlyTextareaClass =
    "w-full rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface-variant resize-none";
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

      {/* ── General Information ─────────────────────────────────────────── */}
      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <h3 className="mb-5 font-headline text-base font-bold tracking-tight text-on-background">
          General Information
        </h3>

        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          {/* PO Number + Created Date */}
          <div>
            <label className={labelClass}>PO Number</label>
            <input
              {...register("poNumber")}
              className={inputClass}
              placeholder="e.g. PO-2026-001"
            />
            {errors.poNumber && <p className={errorClass}>{errors.poNumber.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Created Date</label>
            <div className={readonlyClass}>
              {createdDate}
            </div>
          </div>

          {/* Company */}
          <div>
            <label className={labelClass}>Company</label>
            <Controller
              name="companyId"
              control={control}
              render={({ field }) => (
                <ComboboxSelect
                  options={companyOptions}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                    setValue("supplierId", "");
                    setSuppliers([]);
                    setLoadingSuppliers(Boolean(val));
                    setSupplierLoadError(null);
                  }}
                  placeholder="Select company"
                  hasError={!!errors.companyId}
                />
              )}
            />
            {errors.companyId && <p className={errorClass}>{errors.companyId.message}</p>}
          </div>

          {/* Supplier */}
          <div>
            <label className={labelClass}>Supplier</label>
            <Controller
              name="supplierId"
              control={control}
              render={({ field }) => (
                <ComboboxSelect
                  options={supplierOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={
                    !watchedCompanyId
                      ? "Select a company first"
                      : loadingSuppliers
                        ? "Loading suppliers…"
                        : "Select supplier"
                  }
                  hasError={!!errors.supplierId}
                />
              )}
            />
            {errors.supplierId && <p className={errorClass}>{errors.supplierId.message}</p>}
            {watchedCompanyId && supplierLoadError && (
              <p className={errorClass}>{supplierLoadError}</p>
            )}
          </div>

          {/* Company Country (read-only) */}
          <div>
            <label className={labelClass}>Company Country</label>
            <div className={readonlyClass}>{selectedCompany?.country ?? "—"}</div>
          </div>

          {/* Supplier Country (read-only) */}
          <div>
            <label className={labelClass}>Supplier Country</label>
            <div className={readonlyClass}>{selectedSupplier?.country ?? "—"}</div>
          </div>

          {/* Company Address (full width) */}
          <div>
            <label className={labelClass}>Company Address</label>
            <textarea
              readOnly
              rows={3}
              value={selectedCompany?.address ?? ""}
              placeholder="—"
              className={readonlyTextareaClass}
            />
          </div>

          {/* Supplier Address (full width) */}
          <div>
            <label className={labelClass}>Supplier Address</label>
            <textarea
              readOnly
              rows={3}
              value={selectedSupplier?.address ?? ""}
              placeholder="—"
              className={readonlyTextareaClass}
            />
          </div>
        </div>
      </section>

      {/* ── Items & Quantities ──────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-3xl border border-outline-variant/5 bg-surface-container-lowest shadow-sm">
        <div className="flex flex-col gap-4 border-b border-outline-variant/5 px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-headline text-base font-bold tracking-tight text-on-background">
            Items &amp; Quantities
          </h3>
          {poId && (
            <PoItemModal purchaseOrderId={poId} />
          )}
        </div>

        <PoItemsTable
          items={po?.items ?? []}
          purchaseOrderId={poId ?? ""}
          isEditable={!!poId}
        />
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-on-background">
              {poId
                ? hasItems
                  ? "Review your items and submit for approval."
                  : "Add at least one item before submitting for approval."
                : "Save a draft to start adding items."}
            </p>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              Submitted POs will be sent to a manager or admin for approval.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-bold text-primary transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[16px] leading-none">save</span>
              {isSubmitting ? "Saving…" : "Save as Draft"}
            </button>
            <button
              type="button"
              onClick={onSubmitForApproval}
              disabled={isSubmitting || !poId || !hasItems}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[16px] leading-none">send</span>
              {isSubmitting ? "Submitting…" : "Submit Purchase Order"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
