import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";

import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { StatusBadge } from "@/components/ui/status-badge";
import { PoDetailView } from "@/features/purchase-orders/components/po-detail-view";
import { PoApprovalActions } from "@/features/purchase-orders/components/po-approval-actions";
import { ShipmentListTable } from "@/features/shipments/components/shipment-column";
import {
  canCurrentUserApprovePurchaseOrders,
  getPurchaseOrderById,
} from "@/features/purchase-orders/services/po-service";
import { listShipments } from "@/features/shipments/services/shipment-service";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function PurchaseOrderManagePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab = "details" } = await searchParams;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const user = await getCurrentUser();
  const policyContext = { existingClient: supabase, existingUser: user };

  if (!user?.workspaceId) redirect("/login");

  const po = await getPurchaseOrderById(id, policyContext);
  if (!po) {
    redirect(`/purchase-orders`);
  }

  // Draft POs go to edit page
  if (po.status === "draft") {
    redirect(`/purchase-orders/${id}`);
  }

  const canApprove = await canCurrentUserApprovePurchaseOrders(policyContext);

  const activeTab = tab === "shipments" ? "shipments" : "details";

  const shipments =
    activeTab === "shipments"
      ? await (async () => {
          try {
            return await listShipments(id, 1, 10, policyContext);
          } catch {
            return null;
          }
        })()
      : null;

  return (
    <div className="p-8">
      <PageBreadcrumb
        className="mb-4"
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Purchase Orders", href: "/purchase-orders" },
          { label: po.po_number },
        ]}
      />

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-background">
              {po.po_number}
            </h2>
            <StatusBadge status={po.status} />
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">
            Created {formatDate(po.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PoApprovalActions po={po} canApprove={canApprove} />
          <Link
            href="/purchase-orders"
            className="flex items-center gap-2 rounded-xl bg-surface-container-low px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-container active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] leading-none">arrow_back</span>
            Back
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-outline-variant/10">
        <Link
          href={`/purchase-orders/${id}/manage?tab=details`}
          className={`px-4 pb-3 text-sm font-semibold transition-colors ${
            activeTab === "details"
              ? "border-b-2 border-primary text-primary"
              : "text-on-surface-variant hover:text-on-background"
          }`}
        >
          Details
        </Link>
        {po.status === "in_progress" || po.status === "closed" ? (
          <Link
            href={`/purchase-orders/${id}/manage?tab=shipments`}
            className={`px-4 pb-3 text-sm font-semibold transition-colors ${
              activeTab === "shipments"
                ? "border-b-2 border-primary text-primary"
                : "text-on-surface-variant hover:text-on-background"
            }`}
          >
            Shipments
          </Link>
        ) : null}
      </div>

      {/* Tab Content */}
      {activeTab === "details" && <PoDetailView po={po} />}

      {activeTab === "shipments" && (
        <ShipmentListTable
          purchaseOrderId={id}
          shipments={shipments?.data ?? []}
          pagination={shipments?.meta ?? null}
          canCreateShipment={po.status === "in_progress"}
        />
      )}
    </div>
  );
}
