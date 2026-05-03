"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { IconBuildingBank, IconEye, IconEyeOff } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as v from "valibot";

// Update the import path below to the correct relative path if the alias does not resolve
import { signInWithPassword } from "../services/auth-service";

const loginSchema = v.object({
  email: v.pipe(v.string(), v.email("Please enter a valid email")),
  password: v.pipe(v.string(), v.minLength(8, "Password must be at least 8 characters")),
});

type LoginFormValues = v.InferInput<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const resolver = useMemo(() => valibotResolver(loginSchema), []);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver,
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);

    const result = await signInWithPassword(values);

    if (result.error || !result.redirectTo) {
      setErrorMessage(result.error ?? "Login failed. Please try again.");
      return;
    }

    router.replace(result.redirectTo);
    // router.refresh();
  });

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#faf8ff] px-6 py-12">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-[#f2f3ff] opacity-60 blur-[120px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[50%] w-[50%] rounded-full bg-[#dae2fd] opacity-40 blur-[150px]" />
      </div>

      <div className="w-full max-w-[440px] rounded-xl bg-white p-8 shadow-[0_20px_50px_-12px_rgba(19,27,46,0.08)] ring-1 ring-[#c7c4d7]/20 md:p-12">
        <div className="mb-10 flex flex-col items-center">
          <div className="mb-8 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#712ae2] to-[#8a4cfc] text-white">
              <IconBuildingBank className="h-5 w-5" />
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-[#131b2e]">ProcureFlow</span>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-[#131b2e]">Welcome back</h1>
          <p className="text-center text-sm text-[#515f74]">
            Enter your credentials to access your workspace
          </p>
        </div>

        <form className="space-y-6" onSubmit={onSubmit} noValidate>
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-xs font-semibold tracking-wider text-[#464554] uppercase"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@company.com"
              className="h-12 w-full rounded-lg bg-white px-4 text-[#131b2e] ring-1 ring-[#c7c4d7]/40 outline-none transition-all focus:ring-2 focus:ring-[#712ae2]"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            {errors.email?.message ? (
              <p className="text-xs text-red-700">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-xs font-semibold tracking-wider text-[#464554] uppercase"
              >
                Password
              </label>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-12 w-full rounded-lg bg-white px-4 pr-12 text-[#131b2e] ring-1 ring-[#c7c4d7]/40 outline-none transition-all focus:ring-2 focus:ring-[#712ae2]"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-[#767586] transition-colors hover:text-[#464554]"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? (
                  <IconEyeOff className="h-5 w-5" />
                ) : (
                  <IconEye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password?.message ? (
              <p className="text-xs text-red-700">{errors.password.message}</p>
            ) : null}
          </div>

          {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-lg bg-gradient-to-br from-[#712ae2] to-[#8a4cfc] font-bold text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Signing in..." : "Log In"}
          </button>
        </form>
      </div>
    </main>
  );
}
