"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { signOut } from "@/features/auth/services/auth-service";
import type { SessionUser } from "@/lib/auth/session";

import { SidebarNav } from "./sidebar-nav";

type SidebarProps = {
  user: SessionUser | null;
};

function UserProfileDropdown({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const roleBadge = user?.isSuperAdmin ? "Super Admin" : "Member";
  const initial = user?.email?.charAt(0).toUpperCase() ?? "?";

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [open]);

  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open]);

  function handleLogout() {
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
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Dropdown panel — floats upward */}
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-[0_20px_50px_-12px_rgba(19,27,46,0.12)]">
          {/* User info header */}
          <div className="border-b border-outline-variant/5 px-4 py-3">
            <p className="truncate font-headline text-sm font-bold text-on-surface">
              {user?.email ?? "Unknown"}
            </p>
            <p className="text-[11px] font-semibold text-primary">{roleBadge}</p>
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isPending}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-error transition-colors hover:bg-error-container/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px] leading-none">logout</span>
              {isPending ? "Signing out…" : "Sign out"}
            </button>
          </div>

          {/* Inline error */}
          {errorMessage && (
            <p className="border-t border-outline-variant/5 px-4 py-2 text-xs text-error">
              {errorMessage}
            </p>
          )}
        </div>
      )}

      {/* Profile trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex w-full items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-container"
      >
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-sm font-bold text-primary">
          {initial}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate font-headline text-sm font-bold text-on-surface">
            {user?.email ?? "Unknown"}
          </p>
          <p className="text-[11px] font-semibold text-primary">{roleBadge}</p>
        </div>
        <span
          className="material-symbols-outlined flex-shrink-0 text-[18px] leading-none text-on-surface-variant transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          expand_more
        </span>
      </button>
    </div>
  );
}

export function Sidebar({ user }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-surface-container-low">
      <div className="flex h-full flex-col justify-between py-8">
        {/* Top: Logo + Nav */}
        <div className="flex-1 space-y-8 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6">
            <div className="editorial-gradient flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white">
              <span
                className="material-symbols-outlined text-[20px] leading-none"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
              >
                dataset
              </span>
            </div>
            <div>
              <h1 className="font-headline text-2xl font-black tracking-tighter text-on-background">
                ProcureFlow
              </h1>
              <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
                Editorial
              </p>
            </div>
          </div>

          {/* Navigation */}
          <SidebarNav />
        </div>

        {/* Bottom: User profile dropdown */}
        <div className="border-t border-outline-variant/10 px-4 py-4">
          <UserProfileDropdown user={user} />
        </div>
      </div>
    </aside>
  );
}
