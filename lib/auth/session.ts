import { cache } from "react";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string;
  workspaceId: string;
  isSuperAdmin: boolean;
};

export function getPostLoginPath(user: SessionUser): string {
  return user.isSuperAdmin ? "/companies" : "/dashboard";
}

type SupabaseServerClient = ReturnType<typeof createClient>;

export type CurrentWorkspaceContext = {
  user: SessionUser;
  workspaceId: string;
  parentWorkspaceId: string | null;
  isChildWorkspace: boolean;
  accessibleWorkspaceIds: string[];
};

const getRequestSupabaseClient = cache(async (): Promise<SupabaseServerClient> => {
  return createClient(await cookies());
});

export const getCurrentUser = cache(async (
  existingClient?: ReturnType<typeof createClient>,
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

  const { data: membership } = await supabase
    .from("memberships")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    id: userRecord.id,
    email: userRecord.email,
    workspaceId: membership?.workspace_id,
    isSuperAdmin: userRecord.is_super_admin,
  };
});

export const getCurrentWorkspaceContext = cache(async (
  existingClient?: SupabaseServerClient,
): Promise<CurrentWorkspaceContext | null> => {
  const supabase = existingClient ?? await getRequestSupabaseClient();
  const user = await getCurrentUser(existingClient);

  if (!user?.workspaceId) {
    return null;
  }

  const workspaceId = user.workspaceId;
  let parentWorkspaceId: string | null = null;
  let isChildWorkspace = false;
  let accessibleWorkspaceIds = [workspaceId];

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, parent_id")
    .eq("id", workspaceId)
    .maybeSingle();

  if (workspace?.parent_id) {
    parentWorkspaceId = workspace.parent_id;
    isChildWorkspace = true;
  } else if (workspace) {
    const { data: children } = await supabase
      .from("workspaces")
      .select("id")
      .eq("parent_id", workspaceId);

    accessibleWorkspaceIds = [workspaceId, ...(children ?? []).map((child) => child.id)];
  }

  return {
    user,
    workspaceId,
    parentWorkspaceId,
    isChildWorkspace,
    accessibleWorkspaceIds,
  };
});
