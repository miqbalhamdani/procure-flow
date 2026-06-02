import { Suspense } from "react";
import { redirect } from "next/navigation";

import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { SupplierTable } from "@/features/suppliers/components/supplier-table";
import { SupplierModal } from "@/features/suppliers/components/supplier-modal";
import { SupplierSearch } from "@/features/suppliers/components/supplier-search";
import { listSuppliers } from "@/features/suppliers/services/supplier-service";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/policies";

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.isSuperAdmin && !hasPermission(user.role, "supplier.view")) {
    redirect("/dashboard");
  }

  const { page: pageParam, search = "" } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const canCreateSupplier = user.isSuperAdmin || hasPermission(user.role, "supplier.create");
  const canEditSupplier = user.isSuperAdmin || hasPermission(user.role, "supplier.edit");
  const canDeleteSupplier = user.isSuperAdmin || hasPermission(user.role, "supplier.delete");

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
          {canCreateSupplier ? <SupplierModal /> : null}
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

          <SupplierTable
            data={data}
            pagination={meta}
            search={search}
            canEditSupplier={canEditSupplier}
            canDeleteSupplier={canDeleteSupplier}
          />
        </div>
      </Suspense>
    </div>
  );
}
