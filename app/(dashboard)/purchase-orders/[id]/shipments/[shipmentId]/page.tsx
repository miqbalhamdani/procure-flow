import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";

import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { StatusBadge } from "@/components/ui/status-badge";
import { ShipmentForm } from "@/features/shipments/components/shipment-form";
import { ShipmentActionButtons } from "@/features/shipments/components/shipment-action-buttons";
import { ShipmentTrackingTimeline } from "@/features/shipments/components/shipment-tracking-timeline";
import { ShipmentItemsTable } from "@/features/shipments/components/shipment-items-table";
import {
  getShipmentById,
  getRemainingQuantities,
} from "@/features/shipments/services/shipment-service";
import { getPurchaseOrderById } from "@/features/purchase-orders/services/po-service";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { hasPermission, requirePermission } from "@/policies";

interface Props {
  params: Promise<{ id: string; shipmentId: string }>;
}

export default async function ShipmentPage({ params }: Props) {
  const { id: poId, shipmentId } = await params;
  const isNew = shipmentId === "new";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const user = await getCurrentUser();
  const policyContext = { existingClient: supabase, existingUser: user };

  if (!user?.workspaceId) redirect("/login");

  // Fetch PO to verify it exists and is accessible
  const po = await getPurchaseOrderById(poId, policyContext);
  if (!po) {
    redirect(`/purchase-orders`);
  }

  if (po.status !== "in_progress" && po.status !== "closed") {
    redirect(`/purchase-orders/${poId}/manage`);
  }

  const canCreateShipment =
    user.isSuperAdmin || hasPermission(user.role, "shipment.create");
  const canViewShipment =
    user.isSuperAdmin || hasPermission(user.role, "shipment.view");
  const canEditShipment = user.isSuperAdmin || hasPermission(user.role, "shipment.edit");

  console.log({ canCreateShipment, canViewShipment, canEditShipment });

  if (isNew && !canCreateShipment) {
    redirect(`/purchase-orders/${poId}/manage?tab=shipments`);
  }

  console.log("isNew:", isNew);

  // Fetch shipment if not new
  let shipment: Awaited<ReturnType<typeof getShipmentById>> = null;

  if (!isNew) {
    shipment = await getShipmentById(shipmentId, policyContext);

    console.log("Fetched shipment for page:", shipment);
    if (!shipment) notFound();
    if (shipment.purchase_order_id !== poId) notFound();

    if (!canViewShipment) {
      redirect(`/purchase-orders/${poId}/manage?tab=shipments`);
    }
  }

  // Determine page mode
  const isManageMode =
    !isNew && shipment && (shipment.status === "in_transit" || shipment.status === "delivered");

  // Remaining quantities (exclude current shipment so its own items don't reduce the remaining)
  const remainingQuantities = await getRemainingQuantities(
    poId,
    isNew ? undefined : shipmentId,
    policyContext,
  );

  const [transitAccess, deliveryAccess] = await Promise.all([
    requirePermission("shipment.markInTransit", policyContext),
    requirePermission("shipment.markDelivered", policyContext),
  ]);

  const canTransit = !transitAccess.error;
  const canDeliver = !deliveryAccess.error;
  const canShowShipmentActions =
    !!shipment && shipment.status !== "delivered" && (canTransit || canDeliver);

  const shipmentListUrl = `/purchase-orders/${poId}/manage?tab=shipments`;

  const breadcrumbLabel = isNew
    ? "New Shipment"
    : `${shipment?.shipment_number ?? "Shipment"}`;

  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Purchase Orders", href: "/purchase-orders" },
    { label: po.po_number, href: shipmentListUrl },
    { label: breadcrumbLabel },
  ];

  return (
    <div className="p-8">
      <PageBreadcrumb className="mb-4" items={breadcrumbItems} />

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-background">
              {isNew ? "New Shipment" : shipment?.shipment_number}
            </h2>
            {!isNew && shipment && <StatusBadge status={shipment.status} />}
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">
            Purchase Order:{" "}
            <Link
              href={shipmentListUrl}
              className="font-semibold text-primary"
            >
              {po.po_number}
            </Link>
          </p>
        </div>
        <Link
          href={shipmentListUrl}
          className="flex items-center gap-2 rounded-xl bg-surface-container-low px-4 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px] leading-none">arrow_back</span>
          Back
        </Link>
      </div>

      {/* Manage mode: two-column layout */}
      {isManageMode && shipment ? (
        <div className="grid grid-cols-3 gap-6">
          {/* Left: Shipment info (read-only) */}
          <div className="col-span-2 space-y-6">
            {/* General Info */}
            <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
              <h3 className="mb-4 font-headline text-base font-bold tracking-tight text-on-background">
                General Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    Shipment Number
                  </p>
                  <p className="mt-1 text-sm font-semibold text-on-background">
                    {shipment.shipment_number}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    Shipment Date
                  </p>
                  <p className="mt-1 text-sm font-medium text-on-background">
                    {shipment.shipment_date
                      ? formatDate(shipment.shipment_date)
                      : "—"}
                  </p>
                </div>
              </div>
            </section>

            {/* Items (read-only) */}
            <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
              <h3 className="mb-4 font-headline text-base font-bold tracking-tight text-on-background">
                Shipment Items
              </h3>
              <ShipmentItemsTable
                items={shipment.items}
                shipmentId={shipment.id}
                remainingQuantities={remainingQuantities}
                isEditable={false}
              />
            </section>
          </div>

          {/* Right: Actions + Timeline */}
          <div className="space-y-6">
            {canShowShipmentActions && (
              <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
                <h3 className="mb-4 font-headline text-base font-bold tracking-tight text-on-background">
                  Shipment Actions
                </h3>
                <ShipmentActionButtons
                  shipment={shipment}
                  canTransit={canTransit}
                  canDeliver={canDeliver}
                />
              </section>
            )}

            <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
              <h3 className="mb-4 font-headline text-base font-bold tracking-tight text-on-background">
                Tracking Timeline
              </h3>
              <ShipmentTrackingTimeline events={shipment.tracking} />
            </section>
          </div>
        </div>
      ) : (
        /* Create / Edit mode */
          <ShipmentForm
            purchaseOrderId={poId}
            shipment={shipment ?? undefined}
            remainingQuantities={remainingQuantities}
            canEditShipment={canEditShipment}
          />
      )}
    </div>
  );
}
