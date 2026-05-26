import type { MembershipRole } from "@/policies/roles";
import type { WorkspaceSummary } from "@/features/companies/types";

export type MembershipWithWorkspace = {
  id: string;
  workspaceId: string;
  membershipId: string;
  workspaceName: string;
  role: MembershipRole;
};

export type SwitchMembershipResult = {
  error?: string;
};
