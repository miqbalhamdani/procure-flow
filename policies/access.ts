import { cookies } from "next/headers";

import { getCurrentUser, type SessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  hasRequiredRole,
  isMembershipRole,
  type MembershipRole,
} from "@/policies/roles";

type SupabaseServerClient = ReturnType<typeof createClient>;
type WorkspaceSessionUser = SessionUser & { workspaceId: string };

type PolicyContextOptions = {
  existingClient?: SupabaseServerClient;
  existingUser?: SessionUser | null;
};

type MembershipFetchOptions = {
  throwOnError?: boolean;
};

type RequiredRolesSuccess = {
  error: null;
  supabase: SupabaseServerClient;
  user: WorkspaceSessionUser;
  role: MembershipRole | null;
};

type RequiredRolesFailure = {
  error: string;
  supabase: null;
  user: null;
  role: null;
};

type SuperAdminSuccess = {
  error: null;
  supabase: SupabaseServerClient;
  user: SessionUser;
};

type SuperAdminFailure = {
  error: string;
  supabase: null;
  user: null;
};

async function getPolicyContext(
  options: PolicyContextOptions = {},
): Promise<{ supabase: SupabaseServerClient; user: SessionUser | null }> {
  const supabase = options.existingClient ?? createClient(await cookies());
  const user =
    options.existingUser === undefined
      ? await getCurrentUser(supabase)
      : options.existingUser;

  return { supabase, user };
}

async function fetchCurrentMembershipRole(
  supabase: SupabaseServerClient,
  user: WorkspaceSessionUser,
  options: MembershipFetchOptions = {},
): Promise<MembershipRole | null> {
  const { data: membership, error } = await supabase
    .from("memberships")
    .select("role")
    .eq("workspace_id", user.workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    if (options.throwOnError) {
      throw new Error(error.message);
    }

    return null;
  }

  return membership?.role && isMembershipRole(membership.role)
    ? membership.role
    : null;
}

export async function requireRoles(
  allowedRoles: readonly MembershipRole[],
  options: PolicyContextOptions & { insufficientRoleMessage?: string } = {},
): Promise<RequiredRolesSuccess | RequiredRolesFailure> {
  const { supabase, user } = await getPolicyContext(options);

  if (!user || !user.workspaceId) {
    return { error: "Unauthorized", supabase: null, user: null, role: null };
  }

  if (user.isSuperAdmin) {
    return {
      error: null,
      supabase,
      user: user as WorkspaceSessionUser,
      role: null,
    };
  }

  const role = await fetchCurrentMembershipRole(
    supabase,
    user as WorkspaceSessionUser,
  );

  if (!hasRequiredRole(role, allowedRoles)) {
    return {
      error: options.insufficientRoleMessage ?? "Unauthorized: Insufficient role",
      supabase: null,
      user: null,
      role: null,
    };
  }

  return {
    error: null,
    supabase,
    user: user as WorkspaceSessionUser,
    role,
  };
}

export async function requireSuperAdmin(
  options: PolicyContextOptions = {},
): Promise<SuperAdminSuccess | SuperAdminFailure> {
  const { supabase, user } = await getPolicyContext(options);

  if (!user?.isSuperAdmin) {
    return { error: "Unauthorized", supabase: null, user: null };
  }

  return { error: null, supabase, user };
}
