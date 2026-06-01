"use server";

import * as v from "valibot";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { CompanyOption } from "@/features/suppliers/types";
import { requirePermission } from "@/policies";

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

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function createSupplier(input: CreateSupplierInput): Promise<{ error?: string }> {
  const { error: authError, supabase, user } = await requirePermission(
    "supplier.create",
  );
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
  const { error: authError, supabase, user } = await requirePermission(
    "supplier.edit",
  );
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
  const { error: authError, supabase, user } = await requirePermission(
    "supplier.delete",
  );
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
    const user = await getCurrentUser();

    if (!user?.workspaceId) return { data: [], error: "Unauthorized" };

    const { data, error } = await supabase
      .from("workspaces")
      .select("id, name")
      .in("id", user.accessibleWorkspaceIds)
      .order("name", { ascending: true });

    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to load company options.",
    };
  }
}
