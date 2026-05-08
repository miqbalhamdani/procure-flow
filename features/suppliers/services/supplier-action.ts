"use server";

import * as v from "valibot";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { CompanyOption } from "@/features/suppliers/types";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const uuidSchema = v.pipe(v.string(), v.uuid("Invalid ID"));

const supplierBaseSchema = v.object({
  name: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Supplier name is required"),
    v.maxLength(255, "Supplier name is too long"),
  ),
  companyId: v.pipe(v.string(), v.uuid("Invalid company ID")),
  address: v.optional(v.pipe(v.string(), v.maxLength(500, "Address is too long"))),
  country: v.optional(v.pipe(v.string(), v.maxLength(100, "Country is too long"))),
});

const createSupplierSchema = supplierBaseSchema;

const updateSupplierSchema = v.object({
  id: uuidSchema,
  ...supplierBaseSchema.entries,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateSupplierInput = v.InferInput<typeof createSupplierSchema>;
export type UpdateSupplierInput = v.InferInput<typeof updateSupplierSchema>;

// ─── RBAC helper ─────────────────────────────────────────────────────────────

async function requireAdminOrManager() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const user = await getCurrentUser(supabase);

  if (!user) return { error: "Unauthorized" as const, supabase: null, user: null };
  if (!user.workspaceId) return { error: "Unauthorized" as const, supabase: null, user: null };

  // Super admin bypasses role check
  if (user.isSuperAdmin) return { error: null, supabase, user };

  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("workspace_id", user.workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["admin", "manager"].includes(membership.role)) {
    return { error: "Unauthorized: Admin or Manager role required" as const, supabase: null, user: null };
  }

  return { error: null, supabase, user };
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function createSupplier(input: CreateSupplierInput): Promise<{ error?: string }> {
  const { error: authError, supabase, user } = await requireAdminOrManager();
  if (authError || !supabase || !user) return { error: authError ?? "Unauthorized" };

  const parsed = v.safeParse(createSupplierSchema, input);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const { name, companyId, address, country } = parsed.output;

  const { error } = await supabase.from("suppliers").insert({
    workspace_id: user.workspaceId!,
    company_id: companyId,
    name,
    address: address || null,
    country: country || null,
  });

  if (error) {
    if (error.code === "23505") return { error: "A supplier with this name already exists in this workspace." };
    return { error: error.message };
  }

  revalidatePath("/suppliers");
  return {};
}

export async function updateSupplier(input: UpdateSupplierInput): Promise<{ error?: string }> {
  const { error: authError, supabase, user } = await requireAdminOrManager();
  if (authError || !supabase || !user) return { error: authError ?? "Unauthorized" };

  const parsed = v.safeParse(updateSupplierSchema, input);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const { id, name, companyId, address, country } = parsed.output;

  // Verify the supplier belongs to this workspace
  const { data: existing } = await supabase
    .from("suppliers")
    .select("workspace_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing || existing.workspace_id !== user.workspaceId) {
    return { error: "Supplier not found." };
  }

  const { error } = await supabase
    .from("suppliers")
    .update({
      company_id: companyId,
      name,
      address: address || null,
      country: country || null,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "A supplier with this name already exists in this workspace." };
    return { error: error.message };
  }

  revalidatePath("/suppliers");
  return {};
}

export async function deleteSupplier(id: string): Promise<{ error?: string }> {
  const { error: authError, supabase, user } = await requireAdminOrManager();
  if (authError || !supabase || !user) return { error: authError ?? "Unauthorized" };

  const parsed = v.safeParse(uuidSchema, id);
  if (!parsed.success) return { error: parsed.issues[0].message };

  // Verify the supplier belongs to this workspace
  const { data: existing } = await supabase
    .from("suppliers")
    .select("workspace_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing || existing.workspace_id !== user.workspaceId) {
    return { error: "Supplier not found." };
  }

  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/suppliers");
  return {};
}

export async function fetchCompanyOptionsAction(): Promise<{
  data: CompanyOption[];
  error: string | null;
}> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const user = await getCurrentUser(supabase);

    if (!user?.workspaceId) return { data: [], error: "Unauthorized" };

    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .select("id, parent_id")
      .eq("id", user.workspaceId)
      .single();

    if (wsError || !workspace) return { data: [], error: "Workspace not found" };

    if (!workspace.parent_id) {
      // Parent workspace: own + all children
      const [{ data: own }, { data: children }] = await Promise.all([
        supabase.from("workspaces").select("id, name").eq("id", user.workspaceId).single(),
        supabase
          .from("workspaces")
          .select("id, name")
          .eq("parent_id", user.workspaceId)
          .order("name", { ascending: true }),
      ]);
      return {
        data: [
          ...(own ? [{ id: own.id, name: own.name }] : []),
          ...(children ?? []).map((c) => ({ id: c.id, name: c.name })),
        ],
        error: null,
      };
    }

    // Child workspace: only own
    const { data: own } = await supabase
      .from("workspaces")
      .select("id, name")
      .eq("id", user.workspaceId)
      .single();

    return { data: own ? [{ id: own.id, name: own.name }] : [], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to load company options.",
    };
  }
}
