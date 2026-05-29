import { Suspense } from "react";
import Link from "next/link";

import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { BaseTable } from "@/components/ui/base-table";
import { poColumns } from "@/features/purchase-orders/components/po-columns";
import { PoListFilters } from "@/features/purchase-orders/components/po-filters";
import { listPurchaseOrders, getCompanyOptions, getSupplierOptionsForCompany } from "@/features/purchase-orders/services/po-service";
import { getCurrentUser } from "@/lib/auth/session";

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    companyId?: string;
    supplierId?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const filters = {
    companyId: params.companyId,
    supplierId: params.supplierId,
    status: params.status,
  };

  const user = await getCurrentUser();
  const isChildWorkspace = user?.isChildWorkspace ?? false;

  let companies: Awaited<ReturnType<typeof getCompanyOptions>> = [];
  let suppliers: Awaited<ReturnType<typeof getSupplierOptionsForCompany>> = [];
  let data: Awaited<ReturnType<typeof listPurchaseOrders>>["data"] = [];
  let meta: Awaited<ReturnType<typeof listPurchaseOrders>>["meta"] | null = null;
  let pageError: string | null = null;

  try {
    const [poResult, companyResult] = await Promise.all([
      listPurchaseOrders(page, filters),
      getCompanyOptions(),
    ]);
    data = poResult.data;
    meta = poResult.meta;
    companies = companyResult;

    if (filters.companyId) {
      suppliers = await getSupplierOptionsForCompany(filters.companyId);
    } else {
      // Load all suppliers for filter dropdown (from all accessible companies)
      const allSuppliers = await Promise.all(
        companyResult.map((c) => getSupplierOptionsForCompany(c.id)),
      );
      suppliers = allSuppliers.flat();
    }
  } catch (error) {
    pageError = error instanceof Error ? error.message : "Failed to load purchase orders.";
  }

  return (
    <div className="p-8">
      <PageBreadcrumb
        className="mb-4"
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Purchase Orders" },
        ]}
      />

      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight text-on-background">
            Purchase Orders
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Create and manage purchase orders across your workspace.
          </p>
        </div>
        <Link
          href="/purchase-orders/new"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px] leading-none">add</span>
          New Purchase Order
        </Link>
      </div>

      {pageError && (
        <div className="mb-6 rounded-xl border border-error-container bg-error-container/40 px-4 py-3 text-sm font-medium text-on-error-container">
          {pageError}
        </div>
      )}

      {/* Filters */}
      <Suspense>
        <div className="overflow-hidden rounded-3xl border border-outline-variant/5 bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant/5 px-8 py-6">
            <PoListFilters
              companies={companies}
              suppliers={suppliers}
              currentCompanyId={params.companyId}
              currentSupplierId={params.supplierId}
              currentStatus={params.status}
              isChildWorkspace={isChildWorkspace}
            />
          </div>
          <BaseTable
            columns={poColumns}
            data={data}
            emptyMessage="No purchase orders found."
            emptyDescription="Create your first purchase order to get started."
            pagination={meta}
          />
        </div>
      </Suspense>
    </div>
  );
}
