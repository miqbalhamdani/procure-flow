"use client";

import { useState } from "react";

import { ActionsCell } from "@/components/ui/actions-cell";
import type { UserMembership } from "@/features/users/types";
import { deleteMembership } from "@/features/users/services/user-action";
import { MembershipModal } from "@/features/users/components/membership-modal";

const ROLE_BADGE_CLASSES: Record<string, string> = {
  admin: "border border-primary/10 bg-primary-fixed text-on-primary-fixed shadow-[0_10px_24px_rgba(113,42,226,0.16)]",
  manager: "border border-secondary/10 bg-secondary-container text-on-secondary-fixed shadow-[0_10px_24px_rgba(81,95,116,0.16)]",
  procurement: "border border-primary/10 bg-primary-container text-on-primary-container shadow-[0_10px_24px_rgba(138,76,252,0.2)]",
  logistics: "border border-tertiary/10 bg-tertiary-fixed text-on-tertiary-fixed shadow-[0_10px_24px_rgba(181,93,0,0.18)]",
  supplier: "border border-error/10 bg-error-container text-on-error-container shadow-[0_10px_24px_rgba(186,26,26,0.16)]",
  viewer: "border border-outline-variant/60 bg-surface-container-highest text-on-surface shadow-[0_10px_24px_rgba(70,69,84,0.12)]",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  procurement: "Procurement",
  logistics: "Logistics",
  supplier: "Supplier",
  viewer: "Viewer",
};

export function MembershipsColumn({
  userId,
  memberships,
}: {
  userId: string;
  memberships: UserMembership[];
}) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <section className="flex min-h-full flex-col overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/5 px-8 py-6">
        <div>
          <h3 className="font-headline text-xl font-bold text-on-surface">Company Memberships</h3>
          <p className="mt-0.5 text-sm text-on-surface-variant">
            Assigned roles across organizations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="editorial-gradient flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px] leading-none">add</span>
          Add Membership
        </button>
      </div>

      {/* Table */}
      {memberships.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-outline-variant">
            corporate_fare
          </span>
          <p className="text-sm font-medium text-on-surface-variant">No memberships yet.</p>
          <p className="text-xs text-outline">
            Add this user to a company to grant them access.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/5 bg-surface-container-low/50 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                <th className="px-8 py-4">Company Name</th>
                <th className="px-8 py-4">Role</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {memberships.map((m) => {
                const initials = m.workspace_name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase();

                return (
                  <tr
                    key={m.id}
                    className="transition-colors hover:bg-surface-container-low/40"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-xl bg-secondary-container text-xs font-bold text-primary">
                          {initials}
                        </div>
                        <span className="font-semibold text-on-background">
                          {m.workspace_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                       <span
                          className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] ${ROLE_BADGE_CLASSES[m.role] ?? "border border-outline-variant/60 bg-surface-container text-on-surface shadow-[0_10px_24px_rgba(70,69,84,0.12)]"}`}
                        >
                          {ROLE_LABELS[m.role] ?? m.role}
                        </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ActionsCell
                          editAction={{
                            type: "modal",
                            render: ({ open, onOpenChange }) => (
                              <MembershipModal
                                mode="edit"
                                userId={userId}
                                membership={m}
                                open={open}
                                onOpenChange={onOpenChange}
                              />
                            ),
                          }}
                          deleteAction={{
                            resourceName: "Membership",
                            itemName: m.workspace_name,
                            warning: "They will lose all access to that company.",
                            successMessage: "Membership removed.",
                            onConfirm: async () => deleteMembership(m.id, userId),
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <MembershipModal
        mode="add"
        userId={userId}
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </section>
  );
}
