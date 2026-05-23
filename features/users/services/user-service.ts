import { buildPaginated } from "@/lib/pagination";
import { requireSuperAdmin } from "@/policies";
import type {
  PaginatedUsers,
  UserDetail,
  UserMembership,
  UserSummary,
} from "@/features/users/types";

export async function listUsers(
  page: number = 1,
  search: string = "",
  pageSize: number = 10,
): Promise<PaginatedUsers> {
  const auth = await requireSuperAdmin();
  if (auth.error || !auth.supabase) {
    throw new Error(auth.error ?? "Unauthorized");
  }

  const { supabase } = auth;

  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  let query = supabase
    .from("users")
    .select("id, name, email, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo);

  if (search.trim()) {
    query = query.or(`name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
  }

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  return buildPaginated<UserSummary>(data ?? [], count ?? 0, page, pageSize);
}

export async function getUserById(id: string): Promise<UserDetail | null> {
  const auth = await requireSuperAdmin();
  if (auth.error || !auth.supabase) {
    throw new Error(auth.error ?? "Unauthorized");
  }

  const { supabase } = auth;

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id, name, email, created_at")
    .eq("id", id)
    .maybeSingle();

  if (userError) throw new Error(userError.message);
  if (!userRow) return null;

  const { data: membershipRows, error: membershipError } = await supabase
    .from("memberships")
    .select("id, workspace_id, role, workspaces(name)")
    .eq("user_id", id)
    .order("created_at", { ascending: true });

  if (membershipError) throw new Error(membershipError.message);

  const memberships: UserMembership[] = (membershipRows ?? []).map((m) => ({
    id: m.id,
    workspace_id: m.workspace_id,
    workspace_name: (m.workspaces as unknown as { name: string } | null)?.name ?? "Unknown",
    role: m.role as UserMembership["role"],
  }));

  return {
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
    created_at: userRow.created_at,
    memberships,
  };
}
