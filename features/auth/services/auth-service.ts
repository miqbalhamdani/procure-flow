"use server";

import { cookies } from "next/headers";
import * as v from "valibot";

import type { LoginCredentials, SignInResult, SignOutResult } from "@/features/auth/types";
import { getPostLoginPath } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const signInSchema = v.object({
  email: v.pipe(v.string(), v.trim(), v.email("Please enter a valid email")),
  password: v.pipe(v.string(), v.minLength(8, "Password must be at least 8 characters")),
});

export async function signInWithPassword(values: LoginCredentials): Promise<SignInResult> {
  const parsed = v.safeParse(signInSchema, values);

  if (!parsed.success) {
    return {
      error: "Invalid email or password.",
    };
  }

  const sanitizedValues = {
    email: parsed.output.email.toLowerCase(),
    password: parsed.output.password,
  };

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: sanitizedValues.email,
    password: sanitizedValues.password,
  });

  if (error || !data.user) {
    return {
      error: error?.message ?? "Invalid email or password.",
    };
  }

  const { data: userRecord, error: userRecordError } = await supabase
    .from("users")
    .select("id, is_super_admin")
    .eq("id", data.user.id)
    .maybeSingle();

  if (userRecordError || !userRecord) {
    return {
      error: userRecordError?.message ?? "Your user account is not available.",
    };
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("workspace_id")
    .eq("user_id", userRecord.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    redirectTo: getPostLoginPath({
      id: userRecord.id,
      email: data.user.email ?? "",
      workspaceId: membership?.workspace_id,
      isSuperAdmin: userRecord.is_super_admin,
    }),
  };
}

export async function signOut(): Promise<SignOutResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.auth.signOut();

  if (error) {
    return {
      error: error.message,
    };
  }

  return {};
}
