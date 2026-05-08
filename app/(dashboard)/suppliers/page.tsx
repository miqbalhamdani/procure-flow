import { Suspense } from "react";

import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { BaseTable } from "@/components/ui/base-table";
import { columns } from "@/features/suppliers/components/columns";
import { SupplierModal } from "@/features/suppliers/components/supplier-modal";
import { SupplierSearch } from "@/features/suppliers/components/supplier-search";
import { listSuppliers } from "@/features/suppliers/services/supplier-service";

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const { page: pageParam, search = "" } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  let data: Awaited<ReturnType<typeof listSuppliers>>["data"] = [];
  let meta: Awaited<ReturnType<typeof listSuppliers>>["meta"] | null = null;
  let pageError: string | null = null;

  try {
    const result = await listSuppliers(page, search);
    data = result.data;
    meta = result.meta;
  } catch (error) {
    pageError = error instanceof Error ? error.message : "Failed to load suppliers.";
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <PageBreadcrumb
        className="mb-4"
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Suppliers" },
        ]}
      />

      {/* Page header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight text-on-background">
            Suppliers
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Manage and monitor your strategic supplier network.
          </p>
        </div>
        <Suspense>
          <SupplierModal />
        </Suspense>
      </div>

      {/* Error */}
      {pageError && (
        <div className="mb-6 rounded-xl border border-error-container bg-error-container/40 px-4 py-3 text-sm font-medium text-on-error-container">
          {pageError}
        </div>
      )}

      {/* Table */}
      <Suspense>
        <div className="overflow-hidden rounded-3xl border border-outline-variant/5 bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant/5 px-8 py-6">
            <SupplierSearch defaultValue={search} />
          </div>

          <BaseTable
            columns={columns}
            data={data}
            emptyMessage="No suppliers found."
            emptyDescription={
                search
                ? `No suppliers match "${search}". Try a different search.`
                : "Add your first supplier to get started."
            }
            pagination={meta}
          />
        </div>
      </Suspense>
    </div>
  );
}
