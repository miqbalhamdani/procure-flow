import type { Paginated } from "@/lib/pagination";

export type WorkspaceSummary = {
  id: string;
  name: string;
  parent_id: string | null;
  address: string | null;
  country: string | null;
};

export type ParentWorkspaceOption = Pick<WorkspaceSummary, "id" | "name">;

export type PaginatedWorkspaces = Paginated<WorkspaceSummary>;
