import Link from "next/link";
import { redirect } from "next/navigation";

import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { PoForm } from "@/features/purchase-orders/components/po-form";
import { getPurchaseOrderById, getCompanyOptions } from "@/features/purchase-orders/services/po-service";
import { getCurrentWorkspaceContext } from "@/lib/auth/session";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PurchaseOrderFormPage({ params }: Props) {
  const { id } = await params;
  const isNew = id === "new";

  const workspaceContext = await getCurrentWorkspaceContext();

  if (!workspaceContext) redirect("/login");

  let po: Awaited<ReturnType<typeof getPurchaseOrderById>> = null;

  if (!isNew) {
    po = await getPurchaseOrderById(id);

    if (!po) {
      redirect(`/purchase-orders`);
    }
    // Only draft POs can be edited
    if (po.status !== "draft") {
      redirect(`/purchase-orders/${id}/manage`);
    }
  }

  const companies = await getCompanyOptions();

  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Purchase Orders", href: "/purchase-orders" },
    { label: isNew ? "New Purchase Order" : `Edit ${po?.po_number ?? ""}` },
  ];

  return (
    <div className="p-8">
      <PageBreadcrumb className="mb-4" items={breadcrumbItems} />

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight text-on-background">
            {isNew ? "New Purchase Order" : `Edit ${po?.po_number}`}
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {isNew
              ? "Fill in the details to create a new purchase order."
              : "Update the draft purchase order details."}
          </p>
        </div>
        <Link
          href="/purchase-orders"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-surface-container-low px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-container active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px] leading-none">arrow_back</span>
          Back to Purchase Orders
        </Link>
      </div>

      <PoForm
        po={po ?? undefined}
        initialCompanies={companies}
        isChildWorkspace={workspaceContext.isChildWorkspace}
        currentWorkspaceId={workspaceContext.workspaceId}
      />
    </div>
  );
}
