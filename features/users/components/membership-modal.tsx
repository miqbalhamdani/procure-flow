"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as v from "valibot";

import {
  addMembership,
  updateMembership,
  fetchAllWorkspacesAction,
} from "@/features/users/services/user-action";
import { ComboboxSelect, type ComboboxOption } from "@/components/ui/combobox-select";
import { MEMBERSHIP_ROLES, type UserMembership, type WorkspaceOption } from "@/features/users/types";
import { ROLE_LABELS } from "@/policies/roles";

const membershipSchema = v.object({
  workspaceId: v.pipe(v.string(), v.minLength(1, "Company is required")),
  role: v.picklist(MEMBERSHIP_ROLES, "Role is required"),
});

type FormValues = v.InferInput<typeof membershipSchema>;

// ─── Add mode ────────────────────────────────────────────────────────────────

interface AddModeProps {
  mode: "add";
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  membership?: undefined;
}

// ─── Edit mode ────────────────────────────────────────────────────────────────

interface EditModeProps {
  mode: "edit";
  userId: string;
  membership: UserMembership;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Props = AddModeProps | EditModeProps;

export function MembershipModal(props: Props) {
  const { userId, open, onOpenChange } = props;
  const membership = props.mode === "edit" ? props.membership : undefined;
  const isEditMode = membership !== undefined;
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);

  const defaultValues = useMemo<FormValues>(
    () =>
      membership
        ? { workspaceId: membership.workspace_id, role: membership.role }
        : { workspaceId: "", role: "viewer" },
    [membership],
  );

  const resolver = useMemo(() => valibotResolver(membershipSchema), []);
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver,
    defaultValues,
  });

  // Fetch workspaces (add mode only) + sync form whenever dialog opens
  useEffect(() => {
    if (!open) return;

    if (!isEditMode) {
      void fetchAllWorkspacesAction().then(({ data }) => setWorkspaces(data));
    }

    reset(defaultValues);
  }, [defaultValues, isEditMode, open, reset]);

  const handleOpenChange = (next: boolean) => {
    if (!next) setServerError(null);
    onOpenChange(next);
  };

  const workspaceOptions: ComboboxOption[] = workspaces.map((w) => ({
    value: w.id,
    label: w.name,
  }));
  const roleOptions: ComboboxOption[] = MEMBERSHIP_ROLES.map((role) => ({
    value: role,
    label: ROLE_LABELS[role],
  }));

  // ─── Submit handlers ────────────────────────────────────────────────────────

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    const result = isEditMode
      ? await updateMembership({ id: membership.id, role: values.role }, userId)
      : await addMembership({ userId, workspaceId: values.workspaceId, role: values.role });

    if (result.error) {
      setServerError(result.error);
      return;
    }

    toast.success(isEditMode ? "Role updated." : "Membership added.");
    onOpenChange(false);
    router.refresh();
  });

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-[#131b2e]/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-[101] flex items-center justify-center p-6 sm:p-12">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between px-8 pb-4 pt-8">
              <div>
                <Dialog.Title className="text-2xl font-extrabold tracking-tight text-on-background">
                  {isEditMode ? "Edit Role" : "Add Membership"}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-on-surface-variant">
                  {isEditMode
                    ? `Editing role for ${membership.workspace_name}.`
                    : "Assign this user to a company with a role."}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
              </Dialog.Close>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-5 px-8 pb-4" noValidate>
              {serverError && (
                <div className="rounded-xl border border-error-container bg-error-container/40 px-4 py-3 text-sm font-medium text-on-error-container">
                  {serverError}
                </div>
              )}

              {/* Company */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Company Name
                </label>
                {isEditMode ? (
                  <>
                    <input type="hidden" {...register("workspaceId")} />
                    <input
                      type="text"
                      disabled
                      value={membership.workspace_name}
                      className="w-full cursor-not-allowed rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant opacity-60"
                    />
                  </>
                ) : (
                  <Controller
                    control={control}
                    name="workspaceId"
                    render={({ field }) => (
                      <>
                        <ComboboxSelect
                          options={workspaceOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select a company…"
                          hasError={!!errors.workspaceId}
                        />
                        {errors.workspaceId && (
                          <p className="text-xs text-error">{errors.workspaceId.message}</p>
                        )}
                      </>
                    )}
                  />
                )}
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Assigned Role
                </label>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <>
                      <ComboboxSelect
                        options={roleOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select a role…"
                        searchPlaceholder="Search role…"
                        emptyMessage="No roles found."
                        hasError={!!errors.role}
                      />
                      {errors.role && (
                        <p className="text-xs text-error">{errors.role.message}</p>
                      )}
                    </>
                  )}
                />
              </div>

              <div className="flex flex-row-reverse gap-3 pb-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="editorial-gradient flex-1 rounded-xl px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                >
                  {isSubmitting
                    ? isEditMode
                      ? "Saving…"
                      : "Adding…"
                    : isEditMode
                    ? "Save Changes"
                    : "Add Membership"}
                </button>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="flex-1 rounded-xl bg-surface-container-highest px-8 py-3 text-sm font-bold text-primary transition-colors hover:bg-surface-variant sm:flex-none"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
