"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { signOut } from "@/features/auth/services/auth-service";

export function LogoutButton() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    setErrorMessage(null);

    startTransition(async () => {
      const result = await signOut();

      if (result.error) {
        setErrorMessage(result.error);
        return;
      }

      router.replace("/login");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        className="rounded-lg bg-[#131b2e] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#26324d] disabled:cursor-not-allowed disabled:opacity-70"
        onClick={handleLogout}
        disabled={isPending}
      >
        {isPending ? "Signing out..." : "Logout"}
      </button>
      {errorMessage ? <p className="text-xs text-red-700">{errorMessage}</p> : null}
    </div>
  );
}
