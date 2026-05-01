import type { ReactNode } from "react";

import { LogoutButton } from "@/features/auth/components/logout-button";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <>
      <div className="fixed top-4 right-4 z-[70]">
        <LogoutButton />
      </div>
      {children}
    </>
  );
}
