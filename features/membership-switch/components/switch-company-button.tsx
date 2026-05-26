"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { switchMembership } from "@/features/membership-switch";
import type { MembershipWithWorkspace } from "@/features/membership-switch/types";

type SwitchCompanyButtonProps = {
  memberships: MembershipWithWorkspace[];
  membershipId: string | undefined;
};

export function SwitchCompanyButton({ memberships, membershipId }: SwitchCompanyButtonProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const activeMembership = memberships.find((m) => m.id === membershipId)
    ?? memberships[0];

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
    if (open) {
      document.addEventListener("keydown", onEscape);
      // Focus search when dropdown opens
      requestAnimationFrame(() => searchRef.current?.focus());
    } else {
      setSearch("");
    }
    return () => document.removeEventListener("keydown", onEscape);
  }, [open]);

  const filteredMemberships = memberships.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.workspaceName?.toLowerCase().includes(q) ||
      m.role?.toLowerCase().includes(q)
    );
  });

  function handleSwitch(id: string) {
    if (id === membershipId || isPending) return;
    setOpen(false);
    startTransition(async () => {
      const result = await switchMembership(id);
      if (!result.error) {
        router.refresh();
      }
    });
  }

  // Hide when user only has one (or zero) memberships
  if (memberships.length <= 1) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-surface-container-low px-4 py-2 text-sm font-bold text-primary">
        <span className="material-symbols-outlined text-[18px] leading-none">business_center</span>
        <span className="flex min-w-0 flex-col items-start">
          <span className="max-w-[160px] truncate">{activeMembership?.workspaceName ?? "No company"}</span>
          {activeMembership?.role && (
            <span className="max-w-[160px] truncate text-[11px] font-normal capitalize text-on-surface-variant">
              {activeMembership.role}
            </span>
          )}
        </span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-2 rounded-lg bg-surface-container-low px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="material-symbols-outlined text-[18px] leading-none">business_center</span>
        <span className="flex min-w-0 flex-col items-start">
          <span className="max-w-[160px] truncate">
            {isPending ? "Switching…" : (activeMembership?.workspaceName ?? "Switch Company")}
          </span>
          {!isPending && activeMembership?.role && (
            <span className="max-w-[160px] truncate text-[11px] font-normal capitalize text-on-surface-variant">
              {activeMembership.role}
            </span>
          )}
        </span>
        <span
          className="material-symbols-outlined text-[18px] leading-none transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          expand_more
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="listbox"
          aria-label="Select company"
          className="absolute right-0 top-full z-50 mt-2 min-w-[220px] overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-[0_20px_50px_-12px_rgba(19,27,46,0.12)]"
        >
          <p className="border-b border-outline-variant/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant">
            Your companies
          </p>

          {/* Search */}
          <div className="border-b border-outline-variant/5 px-3 py-2">
            <div className="flex items-center gap-2 rounded-lg bg-surface-container px-3 py-1.5">
              <span className="material-symbols-outlined text-[16px] leading-none text-on-surface-variant">search</span>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Company / role name"
                className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60"
                aria-label="Search companies"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-on-surface-variant hover:text-on-surface"
                  aria-label="Clear search"
                >
                  <span className="material-symbols-outlined text-[16px] leading-none">close</span>
                </button>
              )}
            </div>
          </div>

          <ul className="max-h-56 overflow-y-auto py-1">
            {filteredMemberships.length === 0 && (
              <li className="px-4 py-3 text-sm text-on-surface-variant">No results found.</li>
            )}
            {filteredMemberships.map((m) => {
              const isActive = m.id === activeMembership?.id;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleSwitch(m.id)}
                    disabled={isActive || isPending}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-container disabled:cursor-default"
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`truncate font-medium ${isActive ? "text-primary" : "text-on-surface"}`}>
                        {m.workspaceName}
                      </p>
                      <p className="truncate text-[11px] capitalize text-on-surface-variant">
                        {m.role}
                      </p>
                    </div>
                    {isActive && (
                      <span className="material-symbols-outlined flex-shrink-0 text-[18px] leading-none text-primary">
                        check
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
