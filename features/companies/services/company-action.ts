"use server";

import * as v from "valibot";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ParentWorkspaceOption } from "@/features/companies/types";
import { requireSuperAdmin } from "@/policies";

// ─── Schemas ────────────────────────────────────────────────────────────────

const companyBaseSchema = v.object({
  name: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Company name is required"),
    v.maxLength(255, "Company name is too long"),
  ),
  address: v.optional(v.pipe(v.string(), v.maxLength(500, "Address is too long"))),
  country: v.optional(v.pipe(v.string(), v.maxLength(100, "Country is too long"))),
  parentId: v.optional(v.nullable(v.string())),
});

const createCompanySchema = companyBaseSchema;

const updateCompanySchema = v.object({
  id: v.pipe(v.string(), v.uuid("Invalid company ID")),
  ...companyBaseSchema.entries,
});

// ─── Actions ────────────────────────────────────────────────────────────────

export type CreateCompanyInput = v.InferInput<typeof createCompanySchema>;
export type UpdateCompanyInput = v.InferInput<typeof updateCompanySchema>;

export async function createCompany(input: CreateCompanyInput): Promise<{ error?: string }> {
  const { error: authError } = await requireSuperAdmin();
  if (authError) return { error: authError };

  const parsed = v.safeParse(createCompanySchema, input);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { name, address, country, parentId } = parsed.output;

  const { error } = await supabase.from("workspaces").insert({
    name,
    address: address || null,
    country: country || null,
    parent_id: parentId || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/companies");
  return {};
}

export async function updateCompany(input: UpdateCompanyInput): Promise<{ error?: string }> {
  const { error: authError } = await requireSuperAdmin();
  if (authError) return { error: authError };

  const parsed = v.safeParse(updateCompanySchema, input);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { id, name, address, country, parentId } = parsed.output;

  const { error } = await supabase
    .from("workspaces")
    .update({
      name,
      address: address || null,
      country: country || null,
      parent_id: parentId || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/companies");
  return {};
}

export async function deleteCompany(id: string): Promise<{ error?: string }> {
  const { error: authError } = await requireSuperAdmin();
  if (authError) return { error: authError };

  const parsed = v.safeParse(v.pipe(v.string(), v.uuid("Invalid company ID")), id);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Prevent deletion if the workspace has children
  const { count, error: countError } = await supabase
    .from("workspaces")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", id);

  if (countError) return { error: countError.message };
  if ((count ?? 0) > 0) return { error: "Cannot delete a company that has subsidiaries." };

  const { error } = await supabase.from("workspaces").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/companies");
  return {};
}

export async function fetchParentWorkspacesAction(): Promise<{
  data: ParentWorkspaceOption[];
  error: string | null;
}> {
  try {
    const { error: authError, supabase } = await requireSuperAdmin();
    if (authError || !supabase) {
      return { data: [], error: authError ?? "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("workspaces")
      .select("id, name")
      .is("parent_id", null)
      .order("name", { ascending: true });

    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : "Failed to load parent companies." };
  }
}
