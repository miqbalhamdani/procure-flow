"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as v from "valibot";

import { createUser } from "@/features/users/services/user-action";

const schema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1, "Name is required")),
  email: v.pipe(v.string(), v.trim(), v.email("Invalid email address")),
  password: v.pipe(v.string(), v.minLength(8, "Password must be at least 8 characters")),
});

type FormValues = v.InferInput<typeof schema>;

export function UserCreateModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: valibotResolver(schema) });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset();
      setServerError(null);
      setShowPassword(false);
    }
    setOpen(next);
  };

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await createUser(values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    toast.success("User created. Share the password with them directly.");
    reset();
    setOpen(false);
    router.refresh();
  });

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="editorial-gradient flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px] leading-none">person_add</span>
          <span>Add User</span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-[#131b2e]/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-[101] flex items-center justify-center p-6 sm:p-12">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between px-8 pb-4 pt-8">
              <div>
                <Dialog.Title className="text-2xl font-extrabold tracking-tight text-on-background">
                  Add User
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-on-surface-variant">
                  Create a new member in your organization.
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

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Full Name
                </label>
                <input
                  {...register("name")}
                  type="text"
                  placeholder="e.g. Alexander Thorne"
                  autoComplete="name"
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface placeholder:text-outline transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {errors.name && (
                  <p className="text-xs text-error">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Email Address
                </label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="alexander@company.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface placeholder:text-outline transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {errors.email && (
                  <p className="text-xs text-error">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 pr-12 text-sm text-on-surface placeholder:text-outline transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-on-surface"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <IconEyeOff className="h-5 w-5" />
                    ) : (
                      <IconEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-error">{errors.password.message}</p>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="flex flex-row-reverse gap-3 bg-surface-container-low/50 px-8 py-6">
              <button
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting}
                className="editorial-gradient flex-1 rounded-xl px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
              >
                {isSubmitting ? "Creating user…" : "Create User"}
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
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
