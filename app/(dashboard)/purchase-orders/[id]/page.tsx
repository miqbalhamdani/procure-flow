import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { PoForm } from "@/features/purchase-orders/components/po-form";
import { getPurchaseOrderById, getCompanyOptions } from "@/features/purchase-orders/services/po-service";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/policies";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PurchaseOrderFormPage({ params }: Props) {
  const { id } = await params;
  const isNew = id === "new";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const user = await getCurrentUser();
  const policyContext = { existingClient: supabase, existingUser: user };

  if (!user) redirect("/login");

  const canCreatePurchaseOrder =
    user.isSuperAdmin || hasPermission(user.role, "purchaseOrder.create");
  const canEditPurchaseOrder =
    user.isSuperAdmin || hasPermission(user.role, "purchaseOrder.edit");

  if (isNew && !canCreatePurchaseOrder) {
    redirect("/purchase-orders");
  }

  let po: Awaited<ReturnType<typeof getPurchaseOrderById>> = null;

  if (!isNew) {
    if (!canEditPurchaseOrder) {
      redirect(`/purchase-orders/${id}/manage`);
    }

    po = await getPurchaseOrderById(id, policyContext);

    if (!po) {
      redirect(`/purchase-orders`);
    }
    // Only draft POs can be edited
    if (po.status !== "draft") {
      redirect(`/purchase-orders/${id}/manage`);
    }
  }

  const companies = await getCompanyOptions(policyContext);

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

      <PoForm po={po ?? undefined} initialCompanies={companies} />
    </div>
  );
}
