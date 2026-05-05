"use client";

import * as Popover from "@radix-ui/react-popover";
import { useRef, useState, type ReactNode } from "react";

export interface ComboboxOption {
  value: string;
  label: string;
  prefix?: ReactNode;
}

interface Props {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  hasError?: boolean;
}

export function ComboboxSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search…",
  emptyMessage = "No results found.",
  hasError = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered =
    query.trim() === ""
      ? options
      : options.filter((o) =>
          o.label.toLowerCase().includes(query.toLowerCase()),
        );

  const handleSelect = (option: ComboboxOption) => {
    onChange(option.value);
    setQuery("");
    setOpen(false);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          className={[
            "flex h-12 w-full items-center gap-3 rounded-xl border-0 bg-surface px-4 text-left outline-none ring-1 transition-all",
            hasError
              ? "ring-error focus:ring-2 focus:ring-error"
              : "ring-outline-variant/30 focus:ring-2 focus:ring-primary",
          ].join(" ")}
        >
          {selected ? (
            <>
              {selected.prefix}
              <span className="flex-1 truncate text-sm text-on-background">
                {selected.label}
              </span>
            </>
          ) : (
            <span className="flex-1 text-sm text-outline/50">{placeholder}</span>
          )}
          <span className="material-symbols-outlined flex-shrink-0 text-[18px] leading-none text-on-surface-variant">
            expand_more
          </span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          align="start"
          className="z-[200] w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-xl bg-surface-container-lowest shadow-[0_20px_50px_-12px_rgba(19,27,46,0.12)] ring-1 ring-outline-variant/20"
        >
          {/* Search */}
          <div className="border-b border-outline-variant/10 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] leading-none text-on-surface-variant">
                search
              </span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-outline/50"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-[16px] leading-none">
                    close
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Options */}
          <ul role="listbox" className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-on-surface-variant">
                {emptyMessage}
              </li>
            ) : (
              filtered.map((option) => {
                const isSelected = option.value === value;
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option)}
                    className={[
                      "flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                      isSelected
                        ? "bg-primary/8 font-semibold text-primary"
                        : "text-on-background hover:bg-surface-container",
                    ].join(" ")}
                  >
                    {option.prefix}
                    {option.label}
                    {isSelected && (
                      <span className="material-symbols-outlined ml-auto text-[16px] leading-none text-primary">
                        check
                      </span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
