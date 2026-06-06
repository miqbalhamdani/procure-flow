import type { ReactNode } from "react";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { NavigationProgressBar } from "@/components/layout/navigation-progress";
import { Sidebar } from "@/components/layout/sidebar";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembershipsWithWorkspaces } from "@/features/membership-switch";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getCurrentUser();

  const memberships = user && !user.isSuperAdmin
    ? await getMembershipsWithWorkspaces(user.id)
    : [];

  return (
    <div className="min-h-screen bg-surface-container text-on-surface">
      <Sidebar user={user} />
      <div className="ml-64 flex min-h-screen flex-col">
        <DashboardHeader memberships={memberships} membershipId={user?.membershipId} />
        <NavigationProgressBar className="sticky top-16 z-30" />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
