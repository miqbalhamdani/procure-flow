import { SwitchCompanyButton } from "@/features/membership-switch/components/switch-company-button";
import type { MembershipWithWorkspace } from "@/features/membership-switch/types";

type DashboardHeaderProps = {
  memberships: MembershipWithWorkspace[];
  membershipId: string | undefined;
};

export function DashboardHeader({ memberships, membershipId }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-end gap-4 border-b border-outline-variant/5 bg-surface/80 px-8 shadow-sm backdrop-blur-xl">
      {/* Switch Company */}
      <SwitchCompanyButton memberships={memberships} membershipId={membershipId} />

      {/* Divider */}
      <div className="h-6 w-px bg-outline-variant/30" />

      {/* Help */}
      <button
        type="button"
        className="text-on-surface-variant transition-colors hover:text-primary"
        aria-label="Help"
      >
        <span className="material-symbols-outlined text-[22px] leading-none">help</span>
      </button>

      {/* Notifications */}
      <div className="relative">
        <button
          type="button"
          className="flex items-center text-on-surface-variant transition-colors hover:text-primary"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined text-[22px] leading-none">notifications</span>
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-error ring-2 ring-surface" />
        </button>
      </div>
    </header>
  );
}
