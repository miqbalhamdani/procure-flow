import { cookies } from "next/headers";

import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { buildPaginated } from "@/lib/pagination";
import type { PaginatedWorkspaces, WorkspaceSummary } from "@/features/companies/types";

export async function listWorkspacesForSuperAdmin(
  page: number = 1,
  pageSize: number = 10,
): Promise<PaginatedWorkspaces> {
  const user = await getCurrentUser();

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  const { data, error, count } = await supabase
    .from("workspaces")
    .select("id, name, parent_id, address, country", { count: "exact" })
    .order("created_at", { ascending: true })
    .range(rangeFrom, rangeTo);

  if (error) {
    throw new Error(error.message);
  }

  return buildPaginated<WorkspaceSummary>(data ?? [], count ?? 0, page, pageSize);
}
