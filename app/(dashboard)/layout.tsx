import type { ReactNode } from "react";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Sidebar } from "@/components/layout/sidebar";
import { getCurrentUser } from "@/lib/auth/session";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-surface-container text-on-surface">
      <Sidebar user={user} />
      <div className="ml-64 flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
