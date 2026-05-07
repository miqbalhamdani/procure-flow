"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as v from "valibot";

import { getInitials } from "@/lib/utils";
import { updateUser } from "@/features/users/services/user-action";
import type { UserDetail } from "@/features/users/types";

const schema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1, "Name is required")),
  password: v.optional(
    v.pipe(v.string(), v.minLength(8, "Password must be at least 8 characters")),
  ),
});
type FormValues = v.InferInput<typeof schema>;

export function UserProfileForm({ user }: { user: UserDetail }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const resolver = useMemo(() => valibotResolver(schema), []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver,
    defaultValues: { name: user.name ?? "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await updateUser({ id: user.id, name: values.name, password: values.password });
    if (result.error) {
      setServerError(result.error);
      return;
    }
    reset({ name: values.name, password: "" });
    setShowPassword(false);
    toast.success("Profile updated.");
    router.refresh();
  });

  const joinedDate = new Date(user.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm">
      <div className="flex flex-col items-center px-8 pb-6 pt-8 text-center">
        {/* Avatar */}
        <div className="flex size-24 flex-shrink-0 items-center justify-center rounded-full bg-secondary-container text-2xl font-bold text-primary ring-4 ring-primary/10">
          {getInitials(user.name, user.email)}
        </div>
        <h2 className="mt-4 font-headline text-xl font-bold text-on-surface">
          {user.name ?? <span className="italic text-outline">No name</span>}
        </h2>
        <p className="mt-0.5 text-sm text-on-surface-variant">{user.email}</p>
        <p className="mt-1 text-xs text-outline">Joined {joinedDate}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 px-8 pb-8" noValidate>
        {serverError && (
          <div className="rounded-xl border border-error-container bg-error-container/40 px-4 py-3 text-sm font-medium text-on-error-container">
            {serverError}
          </div>
        )}

        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            Full Name
          </label>
          <input
            {...register("name")}
            type="text"
            className="w-full rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-3 text-sm font-medium text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {errors.name && <p className="text-xs text-error">{errors.name.message}</p>}
        </div>

        {/* Email (read-only) */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            Email Address
          </label>
          <input
            type="email"
            disabled
            value={user.email}
            className="w-full cursor-not-allowed rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm font-medium text-on-surface-variant opacity-60"
          />
          <p className="text-[11px] text-outline">Email cannot be changed here.</p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            New Password
          </label>
          <div className="relative">
            <input
              {...register("password", {
                setValueAs: (value) => (value === "" ? undefined : value),
              })}
              type={showPassword ? "text" : "password"}
              placeholder="Leave empty to keep current password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-3 pr-12 text-sm font-medium text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
          {errors.password && <p className="text-xs text-error">{errors.password.message}</p>}
          <p className="text-[11px] text-outline">
            Leave this empty if you do not want to reset the password.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full rounded-xl bg-surface-container-highest py-3 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Update Profile"}
        </button>
      </form>
    </section>
  );
}
