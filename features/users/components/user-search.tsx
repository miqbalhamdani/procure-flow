"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function UserSearch({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(defaultValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const navigateToSearch = (next: string) => {
    const params = new URLSearchParams();
    if (next.trim()) params.set("search", next.trim());
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setValue(next);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      navigateToSearch(next);
    }, 350);
  };

  const handleClear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setValue("");
    router.replace(pathname, { scroll: false });
  };

  return (
    <div className="w-full max-w-md">
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[18px] leading-none text-on-surface-variant">
          search
        </span>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="Search by name or email..."
          className="w-full rounded-xl border border-outline-variant/30 bg-surface py-2.5 pl-11 pr-12 text-sm text-on-surface placeholder:text-outline transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {value.trim() ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            aria-label="Clear search"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">close</span>
          </button>
        ) : null}
      </div>
      {value.trim() ? (
        <p className="mt-2 px-1 text-xs font-medium text-on-surface-variant">
          Filtering users by <span className="font-semibold text-on-surface">{value.trim()}</span>.
        </p>
      ) : null}
    </div>
  );
}
