import { cache } from "react";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { type MembershipRole } from "@/policies/roles";
import { ACTIVE_MEMBERSHIP_COOKIE } from "@/features/membership-switch/constants";

export type SessionUser = {
  id: string;
  email: string;
  workspaceId: string;
  membershipId: string;
  role: MembershipRole;
  isSuperAdmin: boolean;
  isChildWorkspace: boolean;
  accessibleWorkspaceIds: string[];
};

export function getPostLoginPath(user: Pick<SessionUser, "isSuperAdmin">): string {
  return user.isSuperAdmin ? "/companies" : "/dashboard";
}

type SupabaseServerClient = ReturnType<typeof createClient>;

const getRequestSupabaseClient = cache(async (): Promise<SupabaseServerClient> => {
  return createClient(await cookies());
});

export const getCurrentUser = cache(async (
  existingClient?: SupabaseServerClient,
): Promise<SessionUser | null> => {
  const supabase = existingClient ?? await getRequestSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: userRecord, error: userRecordError } = await supabase
    .from("users")
    .select("id, email, is_super_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (userRecordError || !userRecord) {
    return null;
  }

  const cookieStore = await cookies();
  const activeMembershipId = cookieStore.get(ACTIVE_MEMBERSHIP_COOKIE)?.value;

  // Try to use the cookie-stored active membership first
  let membership: { id: string; workspace_id: string; role: string } | null = null;

  if (activeMembershipId) {
    const { data } = await supabase
      .from("memberships")
      .select("id, workspace_id, role")
      .eq("user_id", user.id)
      .eq("id", activeMembershipId)
      .maybeSingle();

    membership = data;
  }

  // Fall back to first membership if cookie is absent or stale
  if (!membership) {
    const { data } = await supabase
      .from("memberships")
      .select("id, workspace_id, role")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    membership = data;
  }

  if (!membership) {
    return null;
  }

  const workspaceId = membership.workspace_id;
  let isChildWorkspace = false;
  let accessibleWorkspaceIds = [workspaceId];

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, parent_id")
    .eq("id", workspaceId)
    .maybeSingle();

  if (workspace?.parent_id) {
    isChildWorkspace = true;
  } else if (workspace) {
    const { data: children } = await supabase
      .from("workspaces")
      .select("id")
      .eq("parent_id", workspaceId);

    accessibleWorkspaceIds = [workspaceId, ...(children ?? []).map((child) => child.id)];
  }

  return {
    id: userRecord.id,
    email: userRecord.email,
    workspaceId,
    membershipId: membership.id,
    role: membership.role as MembershipRole,
    isSuperAdmin: userRecord.is_super_admin,
    isChildWorkspace,
    accessibleWorkspaceIds,
  };
});
