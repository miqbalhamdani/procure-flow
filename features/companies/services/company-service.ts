import { buildPaginated } from "@/lib/pagination";
import { requireSuperAdmin } from "@/policies";
import type { PaginatedWorkspaces, WorkspaceSummary } from "@/features/companies/types";

export async function listWorkspacesForSuperAdmin(
  page: number = 1,
  pageSize: number = 10,
): Promise<PaginatedWorkspaces> {
  const auth = await requireSuperAdmin();
  if (auth.error || !auth.supabase) {
    throw new Error(auth.error ?? "Unauthorized");
  }

  const { supabase } = auth;

  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  // 1. Paginate over parent workspaces only
  const { data: parents, error: parentsError, count } = await supabase
    .from("workspaces")
    .select("id, name, parent_id, address, country", { count: "exact" })
    .is("parent_id", null)
    .range(rangeFrom, rangeTo);

  if (parentsError) {
    throw new Error(parentsError.message);
  }

  const parentIds = (parents ?? []).map((p) => p.id);

  // 2. Fetch all children belonging to this page's parents
  const { data: children, error: childrenError } = parentIds.length > 0
    ? await supabase
        .from("workspaces")
        .select("id, name, parent_id, address, country")
        .in("parent_id", parentIds)
        .order("name", { ascending: true })
    : { data: [], error: null };

  if (childrenError) {
    throw new Error(childrenError.message);
  }

  // 3. Interleave: parent → its children → next parent → …
  const childrenByParent = new Map<string, WorkspaceSummary[]>();
  for (const child of children ?? []) {
    const list = childrenByParent.get(child.parent_id!) ?? [];
    list.push(child);
    childrenByParent.set(child.parent_id!, list);
  }

  const rows: WorkspaceSummary[] = [];
  for (const parent of parents ?? []) {
    rows.push(parent);
    const kids = childrenByParent.get(parent.id) ?? [];
    rows.push(...kids);
  }

  return buildPaginated<WorkspaceSummary>(rows, count ?? 0, page, pageSize);
}
