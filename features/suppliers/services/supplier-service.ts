import { buildPaginated } from "@/lib/pagination";
import { requirePermission } from "@/policies";
import type { PaginatedSuppliers, SupplierSummary } from "@/features/suppliers/types";

export async function listSuppliers(
  page: number = 1,
  search: string = "",
  pageSize: number = 10,
): Promise<PaginatedSuppliers> {
  const { error: authError, supabase, user } = await requirePermission(
    "supplier.view",
    { insufficientRoleMessage: "Unauthorized" },
  );

  if (authError || !supabase || !user?.membershipId || !user.workspaceId) {
    throw new Error(authError ?? "Unauthorized");
  }

  const accessibleCompanyIds = user.accessibleWorkspaceIds;
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  let query = supabase
    .from("suppliers")
    .select("id, workspace_id, company_id, name, address, country, created_at", {
      count: "exact",
    })
    .in("company_id", accessibleCompanyIds)
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
