import { buildPaginated } from "@/lib/pagination";
import { requireRoles, SUPPLIER_MANAGEMENT_ROLES } from "@/policies";
import type { PaginatedSuppliers, SupplierSummary } from "@/features/suppliers/types";

export async function listSuppliers(
  page: number = 1,
  search: string = "",
  pageSize: number = 10,
): Promise<PaginatedSuppliers> {
  const { error: authError, supabase, user } = await requireRoles(
    SUPPLIER_MANAGEMENT_ROLES,
    { insufficientRoleMessage: "Unauthorized" },
  );

  if (authError || !supabase || !user?.workspaceId) {
    throw new Error(authError ?? "Unauthorized");
  }

  // Resolve workspace hierarchy
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .select("id, parent_id")
    .eq("id", user.workspaceId)
    .single();

  if (wsError || !workspace) throw new Error("Workspace not found");

  let workspaceIds: string[] = [user.workspaceId];

  // Parent workspace (no parent_id) can see its children's suppliers too
  if (!workspace.parent_id) {
    const { data: children } = await supabase
      .from("workspaces")
      .select("id")
      .eq("parent_id", user.workspaceId);

    workspaceIds = [user.workspaceId, ...(children ?? []).map((c) => c.id)];
  }

  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  let query = supabase
    .from("suppliers")
    .select("id, workspace_id, company_id, name, address, country, created_at", {
      count: "exact",
    })
    .in("workspace_id", workspaceIds)
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo);

  if (search.trim()) {
    query = query.ilike("name", `%${search.trim()}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  // Fetch company names for the returned rows
  const companyIds = [...new Set((data ?? []).map((s) => s.company_id))];
  const companyMap = new Map<string, string>();

  if (companyIds.length > 0) {
    const { data: companies } = await supabase
      .from("workspaces")
      .select("id, name")
      .in("id", companyIds);

    for (const c of companies ?? []) {
      companyMap.set(c.id, c.name);
    }
  }

  const rows: SupplierSummary[] = (data ?? []).map((s) => ({
    id: s.id,
    workspace_id: s.workspace_id,
    company_id: s.company_id,
    company_name: companyMap.get(s.company_id) ?? null,
    name: s.name,
    address: s.address,
    country: s.country,
    created_at: s.created_at,
  }));

  return buildPaginated<SupplierSummary>(rows, count ?? 0, page, pageSize);
}

