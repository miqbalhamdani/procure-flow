"use server";

import * as v from "valibot";
import { revalidatePath } from "next/cache";

import type { CompanyOption, SupplierOption } from "@/features/purchase-orders/types";
import { requirePermission } from "@/policies";
import { isSettingEnabled } from "@/features/company-settings";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const uuidSchema = v.pipe(v.string(), v.uuid("Invalid ID"));

const poBaseSchema = v.object({
  companyId: v.pipe(v.string(), v.uuid("Please select a company")),
  supplierId: v.pipe(v.string(), v.uuid("Please select a supplier")),
  poNumber: v.pipe(v.string(), v.trim(), v.minLength(1, "PO Number is required"), v.maxLength(100)),
});

const createPoSchema = poBaseSchema;

const updatePoSchema = v.object({
  id: uuidSchema,
  ...poBaseSchema.entries,
});

const poItemBaseSchema = v.object({
  purchaseOrderId: uuidSchema,
  sku: v.pipe(v.string(), v.trim(), v.minLength(1, "SKU is required"), v.maxLength(100)),
  name: v.pipe(v.string(), v.trim(), v.minLength(1, "Item name is required"), v.maxLength(255)),
  quantity: v.pipe(v.number(), v.integer(), v.minValue(1, "Quantity must be at least 1")),
  price: v.pipe(v.number(), v.minValue(0, "Price must be non-negative")),
});

const updatePoItemSchema = v.object({
  id: uuidSchema,
  ...poItemBaseSchema.entries,
});

const approvePoSchema = v.object({
  id: uuidSchema,
  approvalNote: v.optional(v.pipe(v.string(), v.maxLength(1000))),
});

const rejectPoSchema = v.object({
  id: uuidSchema,
  rejectionReason: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Rejection reason is required"),
    v.maxLength(1000),
  ),
});

export type CreatePoInput = v.InferInput<typeof createPoSchema>;
export type UpdatePoInput = v.InferInput<typeof updatePoSchema>;
export type CreatePoItemInput = v.InferInput<typeof poItemBaseSchema>;
export type UpdatePoItemInput = v.InferInput<typeof updatePoItemSchema>;
export type ApprovePoInput = v.InferInput<typeof approvePoSchema>;
export type RejectPoInput = v.InferInput<typeof rejectPoSchema>;

// ─── Purchase Order Actions ───────────────────────────────────────────────────

export async function createPurchaseOrder(
  input: CreatePoInput,
): Promise<{ error?: string; id?: string }> {
  const { error: authError, supabase, user } = await requirePermission(
    "purchaseOrder.create",
  );
  if (authError || !supabase || !user) return { error: authError ?? "Unauthorized" };

  const parsed = v.safeParse(createPoSchema, input);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const { companyId, supplierId, poNumber } = parsed.output;

  const { data, error } = await supabase
    .from("purchase_orders")
    .insert({
      workspace_id: user.workspaceId!,
      company_id: companyId,
      supplier_id: supplierId,
      po_number: poNumber,
      status: "draft",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "A PO with this number already exists." };
    return { error: error.message };
  }

  revalidatePath("/purchase-orders");
  return { id: data.id };
}

export async function updatePurchaseOrder(
  input: UpdatePoInput,
): Promise<{ error?: string }> {
  const { error: authError, supabase, user } = await requirePermission(
    "purchaseOrder.edit",
  );
  if (authError || !supabase || !user) return { error: authError ?? "Unauthorized" };

  const parsed = v.safeParse(updatePoSchema, input);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const { id, companyId, supplierId, poNumber } = parsed.output;

  const { data: existing } = await supabase
    .from("purchase_orders")
    .select("workspace_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!existing || existing.workspace_id !== user.workspaceId) return { error: "PO not found." };
  if (existing.status !== "draft") return { error: "Only draft POs can be edited." };

  const { error } = await supabase
    .from("purchase_orders")
    .update({
      company_id: companyId,
      supplier_id: supplierId,
      po_number: poNumber,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "A PO with this number already exists." };
    return { error: error.message };
  }

  revalidatePath("/purchase-orders");
  revalidatePath(`/purchase-orders/${id}`);
  return {};
}

export async function deletePurchaseOrder(id: string): Promise<{ error?: string }> {
  const { error: authError, supabase, user } = await requirePermission(
    "purchaseOrder.delete",
  );
  if (authError || !supabase || !user) return { error: authError ?? "Unauthorized" };

  const parsed = v.safeParse(uuidSchema, id);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const { data: existing } = await supabase
    .from("purchase_orders")
    .select("workspace_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!existing || existing.workspace_id !== user.workspaceId) return { error: "PO not found." };
  if (existing.status !== "draft") return { error: "Only draft POs can be deleted." };

  const { error } = await supabase.from("purchase_orders").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/purchase-orders");
  return {};
}

// ─── PO Item Actions ──────────────────────────────────────────────────────────

export async function addPurchaseOrderItem(
  input: CreatePoItemInput,
): Promise<{ error?: string; id?: string }> {
  const { error: authError, supabase, user } = await requirePermission(
    "purchaseOrder.edit",
  );
  if (authError || !supabase || !user) return { error: authError ?? "Unauthorized" };

  const parsed = v.safeParse(poItemBaseSchema, input);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const { purchaseOrderId, sku, name, quantity, price } = parsed.output;

  // Verify PO belongs to workspace and is draft
  const { data: po } = await supabase
    .from("purchase_orders")
    .select("workspace_id, status")
    .eq("id", purchaseOrderId)
    .maybeSingle();

  if (!po || po.workspace_id !== user.workspaceId) return { error: "PO not found." };
  if (po.status !== "draft") return { error: "Items can only be added to draft POs." };

  const { data, error } = await supabase
    .from("purchase_order_items")
    .insert({
      purchase_order_id: purchaseOrderId,
      workspace_id: user.workspaceId!,
      sku,
      name,
      quantity,
      price: String(price),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/purchase-orders/${purchaseOrderId}`);
  return { id: data.id };
}

export async function updatePurchaseOrderItem(
  input: UpdatePoItemInput,
): Promise<{ error?: string }> {
  const { error: authError, supabase, user } = await requirePermission(
    "purchaseOrder.edit",
  );
  if (authError || !supabase || !user) return { error: authError ?? "Unauthorized" };

  const parsed = v.safeParse(updatePoItemSchema, input);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const { id, purchaseOrderId, sku, name, quantity, price } = parsed.output;

  // Verify PO is draft
  const { data: po } = await supabase
    .from("purchase_orders")
    .select("workspace_id, status")
    .eq("id", purchaseOrderId)
    .maybeSingle();

  if (!po || po.workspace_id !== user.workspaceId) return { error: "PO not found." };
  if (po.status !== "draft") return { error: "Items can only be edited on draft POs." };

  const { error } = await supabase
    .from("purchase_order_items")
    .update({ sku, name, quantity, price: String(price) })
    .eq("id", id)
    .eq("purchase_order_id", purchaseOrderId);

  if (error) return { error: error.message };

  revalidatePath(`/purchase-orders/${purchaseOrderId}`);
  return {};
}

export async function deletePurchaseOrderItem(
  itemId: string,
  purchaseOrderId: string,
): Promise<{ error?: string }> {
  const { error: authError, supabase, user } = await requirePermission(
    "purchaseOrder.edit",
  );
  if (authError || !supabase || !user) return { error: authError ?? "Unauthorized" };

  const { data: po } = await supabase
    .from("purchase_orders")
    .select("workspace_id, status")
    .eq("id", purchaseOrderId)
    .maybeSingle();

  if (!po || po.workspace_id !== user.workspaceId) return { error: "PO not found." };
  if (po.status !== "draft") return { error: "Items can only be deleted from draft POs." };

  const { error } = await supabase
    .from("purchase_order_items")
    .delete()
    .eq("id", itemId)
    .eq("purchase_order_id", purchaseOrderId);

  if (error) return { error: error.message };

  revalidatePath(`/purchase-orders/${purchaseOrderId}`);
  return {};
}

// ─── Status Transitions ───────────────────────────────────────────────────────

export async function submitPurchaseOrder(id: string): Promise<{ error?: string }> {
  const { error: authError, supabase, user } = await requirePermission(
    "purchaseOrder.submit",
  );
  if (authError || !supabase || !user) return { error: authError ?? "Unauthorized" };

  const { data: po } = await supabase
    .from("purchase_orders")
    .select("workspace_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!po || po.workspace_id !== user.workspaceId) return { error: "PO not found." };
  if (po.status !== "draft") return { error: "Only draft POs can be submitted." };

  // Must have at least one item
  const { count } = await supabase
    .from("purchase_order_items")
    .select("id", { count: "exact", head: true })
    .eq("purchase_order_id", id);

  if (!count || count === 0) return { error: "PO must have at least one item before submitting." };

  const skipApproval = await isSettingEnabled(
    supabase,
    user.workspaceId!,
    "purchase-order",
    "skip_approval",
  );

  const { error } = await supabase
    .from("purchase_orders")
    .update(
      skipApproval
        ? { status: "in_progress" }
        : { status: "submitted", updated_at: new Date().toISOString() },
    )
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/purchase-orders");
  revalidatePath(`/purchase-orders/${id}`);
  revalidatePath(`/purchase-orders/${id}/manage`);
  return {};
}

export async function approvePurchaseOrder(input: ApprovePoInput): Promise<{ error?: string }> {
  const { error: authError, supabase, user } = await requirePermission(
    "purchaseOrder.approve",
  );
  if (authError || !supabase || !user) return { error: authError ?? "Unauthorized" };

  const parsed = v.safeParse(approvePoSchema, input);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const { id, approvalNote } = parsed.output;

  const { data: po } = await supabase
    .from("purchase_orders")
    .select("workspace_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!po || po.workspace_id !== user.workspaceId) return { error: "PO not found." };
  if (po.status !== "submitted") return { error: "Only submitted POs can be approved." };

  const { error } = await supabase
    .from("purchase_orders")
    .update({
      status: "in_progress",
      approval_note: approvalNote ?? null,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/purchase-orders");
  revalidatePath(`/purchase-orders/${id}/manage`);
  return {};
}

export async function rejectPurchaseOrder(input: RejectPoInput): Promise<{ error?: string }> {
  const { error: authError, supabase, user } = await requirePermission(
    "purchaseOrder.reject",
  );
  if (authError || !supabase || !user) return { error: authError ?? "Unauthorized" };

  const parsed = v.safeParse(rejectPoSchema, input);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const { id, rejectionReason } = parsed.output;

  const { data: po } = await supabase
    .from("purchase_orders")
    .select("workspace_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!po || po.workspace_id !== user.workspaceId) return { error: "PO not found." };
  if (po.status !== "submitted") return { error: "Only submitted POs can be rejected." };

  const { error } = await supabase
    .from("purchase_orders")
    .update({
      status: "rejected",
      rejection_reason: rejectionReason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/purchase-orders");
  revalidatePath(`/purchase-orders/${id}/manage`);
  return {};
}

// ─── Fetch Options (for form dropdowns) ──────────────────────────────────────

export async function fetchCompanyOptionsAction(): Promise<{
  data?: CompanyOption[];
  error?: string;
}> {
  const options = {};
  const { error: authError, supabase, user, role } = await requirePermission(
    "purchaseOrder.create",
    options,
  );

  if (authError || !supabase || !user || (!user.isSuperAdmin && !role)) {
    return { error: authError ?? "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("workspaces")
    .select("id, name, address, country")
    .in("id", user.accessibleWorkspaceIds)
    .order("name", { ascending: true });

  if (error) return { error: error.message };

  return {
    data: (data ?? []).map((w) => ({
      id: w.id,
      name: w.name,
      address: w.address ?? null,
      country: w.country ?? null,
    })),
  };
}

export async function fetchSupplierOptionsAction(companyId: string): Promise<{
  data?: SupplierOption[];
  error?: string;
}> {
  const options = {};
  const { error: authError, supabase, user, role } = await requirePermission(
    "purchaseOrder.create",
    options,
  );

  if (authError || !supabase || !user || (!user.isSuperAdmin && !role)) {
    return { error: authError ?? "Unauthorized" };
  }

  const { data } = await supabase
    .from("suppliers")
    .select("id, name, address, country")
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  return {
    data: (data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address ?? null,
      country: s.country ?? null,
    })),
  };
}
