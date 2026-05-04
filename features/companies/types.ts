import type { Paginated } from "@/lib/pagination";

export type WorkspaceSummary = {
  id: string;
  name: string;
  parent_id: string | null;
};

export type PaginatedWorkspaces = Paginated<WorkspaceSummary>;
