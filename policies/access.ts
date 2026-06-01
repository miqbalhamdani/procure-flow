import { cookies } from "next/headers";

import { getCurrentUser, type SessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  hasPermission,
  type MembershipRole,
  type Permission,
} from "@/policies/roles";

export type SupabaseServerClient = ReturnType<typeof createClient>;
type WorkspaceSessionUser = SessionUser & { workspaceId: string };

export type PolicyContextOptions = {
  existingClient?: SupabaseServerClient;
  existingUser?: SessionUser | null;
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
      ? await getCurrentUser()
      : options.existingUser;

  return { supabase, user };
}

export async function requirePermission(
  permission: Permission,
  options: PolicyContextOptions & { insufficientRoleMessage?: string } = {},
): Promise<RequiredRolesSuccess | RequiredRolesFailure> {
  const { supabase, user } = await getPolicyContext(options);

  if (!user || !user.membershipId || !user.workspaceId) {
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

  const role = user.role;

  if (!hasPermission(role, permission)) {
    return {
      error: options.insufficientRoleMessage ?? "Unauthorized: Insufficient permissions",
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
