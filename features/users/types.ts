import type { Paginated } from "@/lib/pagination";

export type MembershipRole =
  | "admin"
  | "manager"
  | "procurement"
  | "logistics"
  | "supplier"
  | "viewer";

export const MEMBERSHIP_ROLES: MembershipRole[] = [
  "admin",
  "manager",
  "procurement",
  "logistics",
  "supplier",
  "viewer",
];

export type UserSummary = {
  id: string;
  name: string | null;
  email: string;
  created_at: string;
};

export type UserMembership = {
  id: string;
  workspace_id: string;
  workspace_name: string;
  role: MembershipRole;
};

export type UserDetail = UserSummary & {
  memberships: UserMembership[];
};

export type PaginatedUsers = Paginated<UserSummary>;

export type WorkspaceOption = {
  id: string;
  name: string;
};
