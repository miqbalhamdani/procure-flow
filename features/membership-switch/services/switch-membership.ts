"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { isMembershipRole } from "@/policies/roles";
import { createClient } from "@/lib/supabase/server";
import type { MembershipWithWorkspace, SwitchMembershipResult } from "@/features/membership-switch/types";
import { setActiveMembershipCookie } from "@/features/membership-switch/cookies";

/**
 * Returns all memberships for the given user joined with workspace name.
 * Ordered by created_at ascending for consistent display.
 */
export async function getMembershipsWithWorkspaces(
  userId: string,
): Promise<MembershipWithWorkspace[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("memberships")
    .select("id, workspace_id, role, workspaces(id, name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  const results: MembershipWithWorkspace[] = [];

  for (const m of data) {
    const ws = m.workspaces as unknown as { id: string; name: string } | null;
    if (!ws || !isMembershipRole(m.role)) continue;
    results.push({
      id: m.id,
      workspaceId: m.workspace_id,
      membershipId: m.id,
      workspaceName: ws.name,
      role: m.role,
    });
  }
  return results;
}

export async function switchMembership(membershipId: string): Promise<SwitchMembershipResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const user = await getCurrentUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify the user actually has a membership in the target workspace
  const { data: membership, error } = await supabase
    .from("memberships")
    .select("id, workspace_id")
    .eq("user_id", user.id)
    .eq("id", membershipId)
    .maybeSingle();

  if (error || !membership) {
    return { error: "You do not have access to this workspace." };
  }

  setActiveMembershipCookie(cookieStore, membershipId);
  revalidatePath("/", "layout");

  return {};
}
