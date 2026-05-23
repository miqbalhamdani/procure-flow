"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { ComboboxSelect } from "@/components/ui/combobox-select";
import type { CompanyOption, SupplierOption } from "@/features/purchase-orders/types";

const PO_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "in_progress", label: "In Progress" },
  { value: "rejected", label: "Rejected" },
  { value: "closed", label: "Closed" },
];

interface PoListFiltersProps {
  companies: CompanyOption[];
  suppliers: SupplierOption[];
  currentCompanyId?: string;
  currentSupplierId?: string;
  currentStatus?: string;
  isChildWorkspace?: boolean;
}

export function PoListFilters({
  companies,
  suppliers,
  currentCompanyId = "",
  currentSupplierId = "",
  currentStatus = "",
  isChildWorkspace = false,
}: PoListFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const companyOptions = [
    { value: "", label: "All Companies" },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];

  const supplierOptions = [
    { value: "", label: "All Suppliers" },
    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
  ];

  const statusOptions = [
    { value: "", label: "All Statuses" },
    ...PO_STATUS_OPTIONS,
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {!isChildWorkspace && (
        <div className="w-52">
          <ComboboxSelect
            options={companyOptions}
            value={currentCompanyId}
            onChange={(val) => updateParam("companyId", val)}
            placeholder="All Companies"
            searchPlaceholder="Search companies…"
          />
        </div>
      )}

      <div className="w-52">
        <ComboboxSelect
          options={supplierOptions}
          value={currentSupplierId}
          onChange={(val) => updateParam("supplierId", val)}
          placeholder="All Suppliers"
          searchPlaceholder="Search suppliers…"
        />
      </div>

      <div className="w-44">
        <ComboboxSelect
          options={statusOptions}
          value={currentStatus}
          onChange={(val) => updateParam("status", val)}
          placeholder="All Statuses"
          searchPlaceholder="Search statuses…"
        />
      </div>

      {(currentCompanyId || currentSupplierId || currentStatus) && (
        <button
          type="button"
          onClick={() => router.push(pathname, { scroll: false })}
          className="rounded-xl px-3 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
