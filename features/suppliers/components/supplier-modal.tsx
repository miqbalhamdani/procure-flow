"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import * as v from "valibot";

import {
  createSupplier,
  updateSupplier,
  fetchCompanyOptionsAction,
} from "@/features/suppliers/services/supplier-action";
import { ComboboxSelect, type ComboboxOption } from "@/components/ui/combobox-select";
import { COUNTRIES, flagUrl } from "@/lib/countries";
import type { CompanyOption, SupplierSummary } from "@/features/suppliers/types";

// ─── Validation schema ────────────────────────────────────────────────────────

const supplierSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1, "Supplier name is required")),
  companyId: v.pipe(v.string(), v.uuid("Please select a company")),
  address: v.optional(v.string()),
  country: v.optional(v.string()),
});

type FormValues = v.InferInput<typeof supplierSchema>;

// ─── Country options ──────────────────────────────────────────────────────────

const COUNTRY_OPTIONS: ComboboxOption[] = COUNTRIES.map((c) => ({
  value: c.name,
  label: c.name,
  prefix: (
    <img
      src={flagUrl(c.code)}
      alt={c.name}
      width={20}
      height={15}
      className="flex-shrink-0 rounded-sm object-cover shadow-sm"
    />
  ),
}));

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreateModeProps {
  supplier?: undefined;
  open?: undefined;
  onOpenChange?: undefined;
}

interface EditModeProps {
  supplier: SupplierSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Props = CreateModeProps | EditModeProps;

// ─── Component ────────────────────────────────────────────────────────────────

export function SupplierModal(props: Props) {
  const isEditMode = props.supplier !== undefined;
  const router = useRouter();

  const [internalOpen, setInternalOpen] = useState(false);
  const open = isEditMode ? props.open : internalOpen;
  const setOpen = isEditMode ? props.onOpenChange : setInternalOpen;

  const [serverError, setServerError] = useState<string | null>(null);
  const [companyOptions, setCompanyOptions] = useState<ComboboxOption[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const resolver = useMemo(() => valibotResolver(supplierSchema), []);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver,
    defaultValues: isEditMode
      ? {
          name: props.supplier.name,
          companyId: props.supplier.company_id,
          address: props.supplier.address ?? "",
          country: props.supplier.country ?? "",
        }
      : { name: "", companyId: "", address: "", country: "" },
  });

  // Fetch company options when dialog opens
  useEffect(() => {
    if (!open) return;

    setLoadingCompanies(true);
    fetchCompanyOptionsAction().then(({ data, error }) => {
      if (error) {
        toast.error(error);
      } else {
        setCompanyOptions(
          data.map((c: CompanyOption) => ({
            value: c.id,
            label: c.name,
            prefix: (
              <span className="material-symbols-outlined flex-shrink-0 text-[16px] leading-none text-on-surface-variant">
                domain
              </span>
            ),
          })),
        );
      }
      setLoadingCompanies(false);
    });
  }, [open]);

  // Sync form on open in edit mode
  useEffect(() => {
    if (open && isEditMode) {
      reset({
        name: props.supplier.name,
        companyId: props.supplier.company_id,
        address: props.supplier.address ?? "",
        country: props.supplier.country ?? "",
      });
      setServerError(null);
    }
    if (!open && !isEditMode) {
      reset({ name: "", companyId: "", address: "", country: "" });
      setServerError(null);
    }
  }, [open, isEditMode, reset, props.supplier]);

  const handleOpenChange = (next: boolean) => {
    if (!next && isSubmitting) return;
    setOpen(next);
  };

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    const result = isEditMode
      ? await updateSupplier({ id: props.supplier.id, ...values })
      : await createSupplier(values);

    if (result.error) {
      setServerError(result.error);
      return;
    }

    toast.success(isEditMode ? "Supplier updated." : "Supplier created.");
    if (!isEditMode) reset();
    setOpen(false);
    router.refresh();
  });

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      {/* Trigger — create mode only */}
      {!isEditMode && (
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="editorial-gradient flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">add</span>
            <span>Add Supplier</span>
          </button>
        </Dialog.Trigger>
      )}

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-[#131b2e]/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-[101] flex items-center justify-center p-6 sm:p-12">
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-8 pb-6 pt-8">
              <div>
                <Dialog.Title className="text-2xl font-extrabold tracking-tight text-on-background">
                  {isEditMode ? "Edit Supplier" : "Add New Supplier"}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-on-surface-variant">
                  {isEditMode
                    ? "Update the details for this supplier."
                    : "Enter details for the new supplier partner."}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-surface-container"
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
              </Dialog.Close>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-5 px-8 pb-8" noValidate>
              {serverError && (
                <div className="rounded-xl border border-error-container bg-error-container/40 px-4 py-3 text-sm font-medium text-on-error-container">
                  {serverError}
                </div>
              )}

              {/* Supplier Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-on-surface-variant" htmlFor="supplier-name">
                  Supplier Name
                </label>
                <input
                  id="supplier-name"
                  type="text"
                  placeholder="e.g. Acme Logistics"
                  {...register("name")}
                  className={`w-full rounded-xl border bg-surface px-4 py-3 text-sm text-on-surface placeholder:text-outline transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.name ? "border-error ring-1 ring-error" : "border-outline-variant/30"
                  }`}
                />
                {errors.name && (
                  <p className="text-xs text-error">{errors.name.message}</p>
                )}
              </div>

              {/* Company */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-on-surface-variant">Company</label>
                {loadingCompanies ? (
                  <div className="flex h-12 items-center justify-center rounded-xl bg-surface ring-1 ring-outline-variant/30">
                    <span className="text-sm text-on-surface-variant">Loading companies…</span>
                  </div>
                ) : (
                  <Controller
                    name="companyId"
                    control={control}
                    render={({ field }) => (
                      <ComboboxSelect
                        options={companyOptions}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Select a company"
                        searchPlaceholder="Search companies…"
                        hasError={!!errors.companyId}
                      />
                    )}
                  />
                )}
                {errors.companyId && (
                  <p className="text-xs text-error">{errors.companyId.message}</p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-on-surface-variant" htmlFor="supplier-address">
                  Address
                </label>
                <textarea
                  id="supplier-address"
                  rows={3}
                  placeholder="Full postal address"
                  {...register("address")}
                  className="w-full resize-none rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface placeholder:text-outline transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Country */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-on-surface-variant">Country</label>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <ComboboxSelect
                      options={COUNTRY_OPTIONS}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Select a country"
                      searchPlaceholder="Search countries…"
                    />
                  )}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    className="rounded-xl px-6 py-2.5 text-sm font-bold text-primary transition-all hover:bg-surface-container disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="editorial-gradient flex items-center gap-2 rounded-xl px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[16px] leading-none">
                        progress_activity
                      </span>
                      Saving…
                    </>
                  ) : isEditMode ? (
                    "Save Changes"
                  ) : (
                    "Save Supplier"
                  )}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
