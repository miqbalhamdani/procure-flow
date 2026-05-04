import { Suspense } from "react";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { BaseTable } from "@/components/ui/base-table";
import { columns } from "@/features/companies/components/columns";
import { listWorkspacesForSuperAdmin } from "@/features/companies/services/company-service";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  let data: Awaited<ReturnType<typeof listWorkspacesForSuperAdmin>>["data"] = [];
  let meta: Awaited<ReturnType<typeof listWorkspacesForSuperAdmin>>["meta"] | null = null;
  let pageError: string | null = null;

  try {
    const result = await listWorkspacesForSuperAdmin(page);
    data = result.data;
    meta = result.meta;
  } catch (error) {
    pageError = error instanceof Error ? error.message : "Failed to load companies.";
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <PageBreadcrumb
        className="mb-4"
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Company Management" },
        ]}
      />

      {/* Page header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight text-on-background">
            Companies
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Manage your corporate hierarchy and entity locations.
          </p>
        </div>
        <button
          type="button"
          className="editorial-gradient flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px] leading-none">add</span>
          <span>Add Company</span>
        </button>
      </div>

      {/* Error banner */}
      {pageError ? (
        <div className="mb-6 rounded-xl border border-error-container bg-error-container/40 px-4 py-3 text-sm font-medium text-on-error-container">
          {pageError}
        </div>
      ) : null}

      {/* Table card + pagination */}
      <Suspense>
        <BaseTable
          title="Entity Directory"
          columns={columns}
          data={data}
          emptyMessage="No companies available."
          emptyDescription="Add your first company to get started."
          pagination={meta}
        />
      </Suspense>
    </div>
  );
}
