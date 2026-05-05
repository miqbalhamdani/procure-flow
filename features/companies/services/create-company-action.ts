"use server";

import * as v from "valibot";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ParentWorkspaceOption } from "@/features/companies/types";

const createCompanySchema = v.object({
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

export type CreateCompanyInput = v.InferInput<typeof createCompanySchema>;

export async function createCompany(input: CreateCompanyInput): Promise<{ error?: string }> {
  const user = await getCurrentUser();

  if (!user?.isSuperAdmin) {
    return { error: "Unauthorized" };
  }

  const parsed = v.safeParse(createCompanySchema, input);
  if (!parsed.success) {
    return { error: parsed.issues[0].message };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { name, address, country, parentId } = parsed.output;

  const { error } = await supabase.from("workspaces").insert({
    name,
    address: address || null,
    country: country || null,
    parent_id: parentId || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/companies");
  return {};
}

export async function fetchParentWorkspacesAction(): Promise<{ data: ParentWorkspaceOption[]; error: string | null }> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("workspaces")
      .select("id, name")
      .is("parent_id", null)
      .order("name", { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : "Failed to load parent companies." };
  }
}
