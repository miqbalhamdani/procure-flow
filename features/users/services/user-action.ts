"use server";

import * as v from "valibot";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MembershipRole, WorkspaceOption } from "@/features/users/types";

// ─── Schemas ────────────────────────────────────────────────────────────────

const uuidSchema = v.pipe(v.string(), v.uuid("Invalid ID"));

const createUserSchema = v.object({
  name: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Name is required"),
    v.maxLength(255, "Name is too long"),
  ),
  email: v.pipe(
    v.string(),
    v.trim(),
    v.email("Invalid email address"),
    v.maxLength(255, "Email is too long"),
  ),
  password: v.pipe(
    v.string(),
    v.minLength(8, "Password must be at least 8 characters"),
    v.maxLength(255, "Password is too long"),
  ),
});

const updateUserSchema = v.object({
  id: uuidSchema,
  name: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Name is required"),
    v.maxLength(255, "Name is too long"),
  ),
  password: v.optional(
    v.pipe(
      v.string(),
      v.minLength(8, "Password must be at least 8 characters"),
      v.maxLength(255, "Password is too long"),
    ),
  ),
});

const addMembershipSchema = v.object({
  userId: uuidSchema,
  workspaceId: uuidSchema,
  role: v.picklist(
    ["admin", "manager", "procurement", "logistics", "supplier", "viewer"],
    "Invalid role",
  ),
});

const updateMembershipSchema = v.object({
  id: uuidSchema,
  role: v.picklist(
    ["admin", "manager", "procurement", "logistics", "supplier", "viewer"],
    "Invalid role",
  ),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type CreateUserInput = v.InferInput<typeof createUserSchema>;
export type UpdateUserInput = v.InferInput<typeof updateUserSchema>;
export type AddMembershipInput = v.InferInput<typeof addMembershipSchema>;
export type UpdateMembershipInput = v.InferInput<typeof updateMembershipSchema>;

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function createUser(input: CreateUserInput): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user?.isSuperAdmin) return { error: "Unauthorized" };

  const parsed = v.safeParse(createUserSchema, input);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const { name, email, password } = parsed.output;

  // Check if a user with this email already exists
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) return { error: "A user with this email already exists." };

  // Create the auth user directly so no invitation email is sent.
  const adminClient = createAdminClient();
  const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (createUserError || !createdUser.user) {
    return { error: createUserError?.message ?? "Failed to create auth user." };
  }

  // Upsert into our users table (auth trigger may already have created the row)
  const { error: upsertError } = await adminClient
    .from("users")
    .upsert(
      { id: createdUser.user.id, email, name, is_super_admin: false },
      { onConflict: "id" },
    );

  if (upsertError) return { error: upsertError.message };

  revalidatePath("/users");
  return {};
}

export async function updateUser(input: UpdateUserInput): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user?.isSuperAdmin) return { error: "Unauthorized" };

  const parsed = v.safeParse(updateUserSchema, input);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const { id, name, password } = parsed.output;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const adminClient = createAdminClient();

  const { error } = await supabase.from("users").update({ name }).eq("id", id);
  if (error) return { error: error.message };

  if (password) {
    const { error: authError } = await adminClient.auth.admin.updateUserById(id, { password });
    if (authError) return { error: authError.message };
  }

  revalidatePath(`/users/${id}`);
  revalidatePath("/users");
  return {};
}

export async function deleteUser(id: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user?.isSuperAdmin) return { error: "Unauthorized" };

  const parsed = v.safeParse(uuidSchema, id);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const adminClient = createAdminClient();

  // Delete all memberships first
  const { error: membershipError } = await supabase
    .from("memberships")
    .delete()
    .eq("user_id", id);

  if (membershipError) return { error: membershipError.message };

  // Delete from users table
  const { error: userError } = await adminClient.from("users").delete().eq("id", id);
  if (userError) return { error: userError.message };

  // Delete from Supabase Auth
  const { error: authError } = await adminClient.auth.admin.deleteUser(id);
  if (authError) return { error: authError.message };

  revalidatePath("/users");
  return {};
}

export async function addMembership(input: AddMembershipInput): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user?.isSuperAdmin) return { error: "Unauthorized" };

  const parsed = v.safeParse(addMembershipSchema, input);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const { userId, workspaceId, role } = parsed.output;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase
    .from("memberships")
    .insert({ user_id: userId, workspace_id: workspaceId, role });

  if (error) {
    if (error.code === "23505") return { error: "User is already a member of this company." };
    return { error: error.message };
  }

  revalidatePath(`/users/${userId}`);
  return {};
}

export async function updateMembership(
  input: UpdateMembershipInput,
  userId: string,
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user?.isSuperAdmin) return { error: "Unauthorized" };

  const parsed = v.safeParse(updateMembershipSchema, input);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const { id, role } = parsed.output;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase
    .from("memberships")
    .update({ role: role as MembershipRole })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/users/${userId}`);
  return {};
}

export async function deleteMembership(
  id: string,
  userId: string,
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user?.isSuperAdmin) return { error: "Unauthorized" };

  const parsed = v.safeParse(uuidSchema, id);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.from("memberships").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/users/${userId}`);
  return {};
}

export async function fetchAllWorkspacesAction(): Promise<{
  data: WorkspaceOption[];
  error: string | null;
}> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("workspaces")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to load companies.",
    };
  }
}
