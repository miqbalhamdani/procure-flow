import type { ReactNode } from "react";
import { cookies } from "next/headers";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Sidebar } from "@/components/layout/sidebar";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getMembershipsWithWorkspaces } from "@/features/membership-switch";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = createClient(await cookies());
  const user = await getCurrentUser(supabase);

  const memberships = user && !user.isSuperAdmin
    ? await getMembershipsWithWorkspaces(user.id)
    : [];

  return (
    <div className="min-h-screen bg-surface-container text-on-surface">
      <Sidebar user={user} />
      <div className="ml-64 flex min-h-screen flex-col">
        <DashboardHeader memberships={memberships} membershipId={user?.membershipId} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
