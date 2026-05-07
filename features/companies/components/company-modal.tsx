"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import * as v from "valibot";

import {
  createCompany,
  updateCompany,
  fetchParentWorkspacesAction,
} from "@/features/companies/services/company-action";
import { ComboboxSelect, type ComboboxOption } from "@/components/ui/combobox-select";
import { COUNTRIES, flagUrl } from "@/lib/countries";
import type { ParentWorkspaceOption, WorkspaceSummary } from "@/features/companies/types";

const companySchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1, "Company name is required")),
  address: v.optional(v.string()),
  country: v.optional(v.string()),
  parentId: v.optional(v.nullable(v.string())),
});

type FormValues = v.InferInput<typeof companySchema>;

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

const ICON_CLASS =
  "material-symbols-outlined flex-shrink-0 text-[16px] leading-none text-on-surface-variant";

const NONE_OPTION: ComboboxOption = {
  value: "",
  label: "None / Parent Entity",
  prefix: <span className={ICON_CLASS}>remove_circle_outline</span>,
};

// ─── Create mode (self-managed trigger) ─────────────────────────────────────
interface CreateModeProps {
  workspace?: undefined;
  open?: undefined;
  onOpenChange?: undefined;
}

// ─── Edit mode (controlled from parent) ─────────────────────────────────────
interface EditModeProps {
  workspace: WorkspaceSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Props = CreateModeProps | EditModeProps;

export function CompanyModal(props: Props) {
  const isEditMode = props.workspace !== undefined;
  const router = useRouter();

  const [internalOpen, setInternalOpen] = useState(false);
  const open = isEditMode ? props.open : internalOpen;
  const setOpen = isEditMode ? props.onOpenChange : setInternalOpen;

  const [serverError, setServerError] = useState<string | null>(null);
  const [parentWorkspaces, setParentWorkspaces] = useState<ParentWorkspaceOption[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);

  const resolver = useMemo(() => valibotResolver(companySchema), []);
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
          name: props.workspace.name,
          address: props.workspace.address ?? "",
          country: props.workspace.country ?? "",
          parentId: props.workspace.parent_id,
        }
      : { name: "", address: "", country: "", parentId: null },
  });

  // Fetch parent options & sync form whenever dialog opens
  useEffect(() => {
    if (!open) return;

    setLoadingParents(true);
    fetchParentWorkspacesAction().then(({ data }) => {
      const filtered = isEditMode
        ? data.filter((w) => w.id !== props.workspace!.id)
        : data;
      setParentWorkspaces(filtered);
      setLoadingParents(false);
    });

    if (isEditMode) {
      reset({
        name: props.workspace.name,
        address: props.workspace.address ?? "",
        country: props.workspace.country ?? "",
        parentId: props.workspace.parent_id,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      if (!isEditMode) reset();
      setServerError(null);
    }
    setOpen(next);
  };

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    const result = isEditMode
      ? await updateCompany({ id: props.workspace.id, ...values })
      : await createCompany(values);

    if (result.error) {
      setServerError(result.error);
      return;
    }

    toast.success(isEditMode ? "Company updated." : "Company created.");
    if (!isEditMode) reset();
    setOpen(false);
    router.refresh();
  });

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      {/* Trigger — only in create mode */}
      {!isEditMode && (
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="editorial-gradient flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">add</span>
            <span>Add Company</span>
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
                  {isEditMode ? "Edit Company" : "Add New Company"}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-on-surface-variant">
                  {isEditMode
                    ? "Update the details for this procurement entity."
                    : "Configure details for your new procurement entity."}
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
            <form onSubmit={onSubmit} className="space-y-6 px-8 pb-8" noValidate>
              {serverError && (
                <div className="rounded-xl border border-error-container bg-error-container/40 px-4 py-3 text-sm font-medium text-on-error-container">
                  {serverError}
                </div>
              )}

              {/* Company Name */}
              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant/80">
                  Company Name
                </label>
                <input
                  {...register("name")}
                  type="text"
                  placeholder="e.g. Acme Procurement Ltd"
                  className="h-12 w-full rounded-xl border-0 bg-surface px-4 outline-none ring-1 ring-outline-variant/30 transition-all placeholder:text-outline/50 focus:ring-2 focus:ring-primary"
                />
                {errors.name && (
                  <p className="ml-1 text-xs text-error">{errors.name.message}</p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant/80">
                  Address
                </label>
                <input
                  {...register("address")}
                  type="text"
                  placeholder="Street, Building, Suite"
                  className="h-12 w-full rounded-xl border-0 bg-surface px-4 outline-none ring-1 ring-outline-variant/30 transition-all placeholder:text-outline/50 focus:ring-2 focus:ring-primary"
                />
                {errors.address && (
                  <p className="ml-1 text-xs text-error">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Country */}
                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant/80">
                    Country
                  </label>
                  <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                      <ComboboxSelect
                        options={COUNTRY_OPTIONS}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Select country"
                        searchPlaceholder="Search country…"
                        emptyMessage="No countries found."
                        hasError={!!errors.country}
                      />
                    )}
                  />
                  {errors.country && (
                    <p className="ml-1 text-xs text-error">{errors.country.message}</p>
                  )}
                </div>

                {/* Parent Company */}
                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant/80">
                    Parent Company
                  </label>
                  <Controller
                    name="parentId"
                    control={control}
                    render={({ field }) => {
                      const parentOptions: ComboboxOption[] = [
                        NONE_OPTION,
                        ...parentWorkspaces.map((w) => ({
                          value: w.id,
                          label: w.name,
                          prefix: <span className={ICON_CLASS}>corporate_fare</span>,
                        })),
                      ];
                      return (
                        <ComboboxSelect
                          options={parentOptions}
                          value={field.value ?? ""}
                          onChange={(val) => field.onChange(val === "" ? null : val)}
                          placeholder={loadingParents ? "Loading…" : "Select parent company"}
                          searchPlaceholder="Search company…"
                          emptyMessage="No companies found."
                          hasError={!!errors.parentId}
                        />
                      );
                    }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-4 border-t border-outline-variant/10 pt-6">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-xl px-6 py-3 text-sm font-semibold text-secondary transition-all hover:bg-surface-container-low"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary-container px-8 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-60"
                >
                  <span className="relative z-10">
                    {isSubmitting
                      ? isEditMode
                        ? "Saving…"
                        : "Creating…"
                      : isEditMode
                      ? "Save Changes"
                      : "Create Entity"}
                  </span>
                  <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              </div>
            </form>

          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
