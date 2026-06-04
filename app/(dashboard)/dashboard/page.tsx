import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { KpiCard, StatusPill, getDashboardOverview } from "@/features/dashboard";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/policies";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!can(user.isSuperAdmin, user.role, "purchaseOrder.view")) {
    redirect("/login");
  }

  const overview = await getDashboardOverview({ existingClient: supabase, existingUser: user });

  return (
    <section className="space-y-8 bg-surface-container p-8">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Overview" },
        ]}
      />

      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
            Procurement Dashboard
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Track purchasing flow and shipment execution across your accessible workspaces.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-surface-container-low px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-surface"
        >
          <span className="material-symbols-outlined text-[18px] leading-none">monitoring</span>
          Last 30 Days
        </button>
      </div>

      {!overview.hasAnyData ? (
        <div className="rounded-2xl bg-surface-container-lowest p-8 text-center">
          <h3 className="font-headline text-xl font-bold text-on-surface">No activity yet</h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            Purchase orders and shipments will appear here after your team starts transacting.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Purchase Orders"
          value={overview.kpis.totalPurchaseOrders}
          icon="receipt_long"
          iconContainerClassName="bg-indigo-50 group-hover:bg-indigo-100"
          iconClassName="text-indigo-600"
        />
        <KpiCard
          label="Approved Purchase Orders"
          value={overview.kpis.approvedPurchaseOrders}
          icon="task_alt"
          iconContainerClassName="bg-emerald-50 group-hover:bg-emerald-100"
          iconClassName="text-emerald-600"
        />
        <KpiCard
          label="Total Shipments"
          value={overview.kpis.totalShipments}
          icon="local_shipping"
          iconContainerClassName="bg-amber-50 group-hover:bg-amber-100"
          iconClassName="text-amber-600"
        />
        <KpiCard
          label="Delivered Shipments"
          value={overview.kpis.deliveredShipments}
          icon="package_2"
          iconContainerClassName="bg-blue-50 group-hover:bg-blue-100"
          iconClassName="text-blue-600"
        />
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 space-y-8">
          <div className="rounded-2xl bg-surface-container-lowest p-8">
            <div className="mb-8 flex items-center justify-between gap-4">
              <h3 className="font-headline text-xl font-bold tracking-tight text-on-surface">
                Status Overview
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-primary"
                >
                  Last 30 Days
                </button>
                <button
                  type="button"
                  className="rounded-full px-3 py-1 text-xs font-medium text-secondary transition-colors hover:bg-surface-container"
                >
                  All Time
                </button>
              </div>
            </div>

            <div className="space-y-12">
              <section className="space-y-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container">file_copy</span>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-secondary">
                    Purchase Order Pipeline
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="flex flex-col items-center justify-center rounded-xl bg-surface p-4 text-center">
                    <span className="text-2xl font-bold text-on-surface">
                      {overview.purchaseOrderStatusCounts.draft.toLocaleString()}
                    </span>
                    <StatusPill label="DRAFT" className="bg-slate-100 text-slate-600" />
                  </div>

                  <div className="flex flex-col items-center justify-center rounded-xl bg-surface p-4 text-center">
                    <span className="text-2xl font-bold text-on-surface">
                      {overview.purchaseOrderStatusCounts.submitted.toLocaleString()}
                    </span>
                    <StatusPill label="SUBMITTED" className="bg-indigo-100 text-indigo-600" />
                  </div>

                  <div className="flex flex-col items-center justify-center rounded-xl bg-surface p-4 text-center">
                    <span className="text-2xl font-bold text-indigo-600">
                      {overview.kpis.approvedPurchaseOrders.toLocaleString()}
                    </span>
                    <StatusPill label="APPROVED" className="bg-emerald-100 text-emerald-700" />
                  </div>

                  <div className="flex flex-col items-center justify-center rounded-xl bg-surface p-4 text-center">
                    <span className="text-2xl font-bold text-on-surface">
                      {overview.purchaseOrderStatusCounts.rejected.toLocaleString()}
                    </span>
                    <StatusPill
                      label="REJECTED"
                      className="bg-error-container/40 text-on-error-container"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container">
                    local_shipping
                  </span>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-secondary">
                    Shipment Tracking
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="flex items-center justify-between rounded-xl bg-surface p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                        <span className="material-symbols-outlined text-amber-600">schedule</span>
                      </div>
                      <span className="font-bold text-on-surface">Pending</span>
                    </div>
                    <span className="text-xl font-extrabold text-on-surface">
                      {overview.shipmentStatusCounts.pending.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-surface p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                        <span className="material-symbols-outlined text-blue-600">navigation</span>
                      </div>
                      <span className="font-bold text-on-surface">In Transit</span>
                    </div>
                    <span className="text-xl font-extrabold text-on-surface">
                      {overview.shipmentStatusCounts.in_transit.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-surface p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                        <span className="material-symbols-outlined text-emerald-600">
                          check_circle
                        </span>
                      </div>
                      <span className="font-bold text-on-surface">Delivered</span>
                    </div>
                    <span className="text-xl font-extrabold text-emerald-600">
                      {overview.shipmentStatusCounts.delivered.toLocaleString()}
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
