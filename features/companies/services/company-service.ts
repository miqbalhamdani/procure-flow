import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { WorkspaceSummary } from "@/features/companies/types";

export async function listWorkspacesForSuperAdmin(): Promise<WorkspaceSummary[]> {
  const user = await getCurrentUser();

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("workspaces")
    .select("id, name, parent_id")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as WorkspaceSummary[];
}
