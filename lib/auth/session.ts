import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string;
  workspaceId: string | null;
  isSuperAdmin: boolean;
};

export function getPostLoginPath(user: SessionUser): string {
  return user.isSuperAdmin ? "/companies" : "/dashboard";
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: userRecord, error: userRecordError } = await supabase
    .from("users")
    .select("id, email, workspace_id, is_super_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (userRecordError || !userRecord) {
    return null;
  }

  return {
    id: userRecord.id,
    email: userRecord.email,
    workspaceId: userRecord.workspace_id,
    isSuperAdmin: userRecord.is_super_admin,
  };
}
