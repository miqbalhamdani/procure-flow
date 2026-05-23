"use server";

import * as v from "valibot";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  requireRoles,
  SHIPMENT_DELIVERY_ROLES,
  SHIPMENT_MANAGEMENT_ROLES,
  SHIPMENT_TRANSIT_ROLES,
} from "@/policies";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const uuidSchema = v.pipe(v.string(), v.uuid("Invalid ID"));

const shipmentBaseSchema = v.object({
  purchaseOrderId: uuidSchema,
  shipmentNumber: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Shipment number is required"),
    v.maxLength(100),
  ),
  shipmentDate: v.optional(v.pipe(v.string(), v.maxLength(20))),
});

const createShipmentSchema = shipmentBaseSchema;

const updateShipmentSchema = v.object({
  id: uuidSchema,
  ...shipmentBaseSchema.entries,
});

const shipmentItemBaseSchema = v.object({
  shipmentId: uuidSchema,
  purchaseOrderItemId: uuidSchema,
  quantity: v.pipe(v.number(), v.integer(), v.minValue(1, "Quantity must be at least 1")),
});

const updateShipmentItemSchema = v.object({
  id: uuidSchema,
  shipmentId: uuidSchema,
  purchaseOrderItemId: uuidSchema,
  quantity: v.pipe(v.number(), v.integer(), v.minValue(1, "Quantity must be at least 1")),
});

const markDeliveredSchema = v.object({
  id: uuidSchema,
  note: v.optional(v.pipe(v.string(), v.maxLength(1000))),
});

const submitShipmentSchema = v.object({
  id: uuidSchema,
  location: v.optional(v.pipe(v.string(), v.maxLength(500))),
  note: v.optional(v.pipe(v.string(), v.maxLength(1000))),
});

export type CreateShipmentInput = v.InferInput<typeof createShipmentSchema>;
export type UpdateShipmentInput = v.InferInput<typeof updateShipmentSchema>;
export type CreateShipmentItemInput = v.InferInput<typeof shipmentItemBaseSchema>;
export type UpdateShipmentItemInput = v.InferInput<typeof updateShipmentItemSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function revalidateShipmentPaths(poId: string, shipmentId?: string) {
  revalidatePath(`/purchase-orders/${poId}/manage`);
  if (shipmentId) {
    revalidatePath(`/purchase-orders/${poId}/shipments/${shipmentId}`);
  }
}

// ─── Auto-close PO helper ─────────────────────────────────────────────────────

async function checkAndClosePO(
  supabase: ReturnType<typeof createClient>,
  purchaseOrderId: string,
) {
  // Get all PO items
  const { data: poItems } = await supabase
    .from("purchase_order_items")
    .select("id, quantity")
    .eq("purchase_order_id", purchaseOrderId);

  if (!poItems?.length) return;

  // Get all delivered shipment IDs for this PO
  const { data: deliveredShipments } = await supabase
    .from("shipments")
    .select("id")
    .eq("purchase_order_id", purchaseOrderId)
    .eq("status", "delivered");

  const deliveredIds = (deliveredShipments ?? []).map((s) => s.id);
  if (!deliveredIds.length) return;

  // Sum delivered quantities per PO item
  const { data: deliveredItems } = await supabase
    .from("shipment_items")
    .select("purchase_order_item_id, quantity")
    .in("shipment_id", deliveredIds);

  const receivedMap = new Map<string, number>();
  for (const di of deliveredItems ?? []) {
    receivedMap.set(
      di.purchase_order_item_id,
      (receivedMap.get(di.purchase_order_item_id) ?? 0) + di.quantity,
    );
  }

  // Check if all items are fully received
  const allFulfilled = poItems.every(
    (item) => (receivedMap.get(item.id) ?? 0) >= item.quantity,
  );

  if (allFulfilled) {
    await supabase
      .from("purchase_orders")
      .update({ status: "closed", updated_at: new Date().toISOString() })
      .eq("id", purchaseOrderId)
      .eq("status", "in_progress");
  }
}

// ─── Shipment Actions ─────────────────────────────────────────────────────────

export async function createShipment(
  input: CreateShipmentInput,
): Promise<{ error?: string; id?: string }> {
  const { error: authError, supabase, user } = await requireRoles(
    SHIPMENT_MANAGEMENT_ROLES,
  );
  if (authError || !supabase || !user) return { error: authError ?? "Unauthorized" };

  const parsed = v.safeParse(createShipmentSchema, input);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const { purchaseOrderId, shipmentNumber, shipmentDate } = parsed.output;

  // PO must be in_progress
  const { data: po } = await supabase
    .from("purchase_orders")
    .select("workspace_id, status")
    .eq("id", purchaseOrderId)
    .maybeSingle();

  if (!po || po.workspace_id !== user.workspaceId) return { error: "Purchase order not found." };
  if (po.status !== "in_progress")
    return { error: "Shipments can only be created for approved (In Progress) purchase orders." };

  const { data, error } = await supabase
    .from("shipments")
    .insert({
      purchase_order_id: purchaseOrderId,
      workspace_id: user.workspaceId!,
      shipment_number: shipmentNumber,
      shipment_date: shipmentDate || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidateShipmentPaths(purchaseOrderId, data.id);
  return { id: data.id };
}

export async function updateShipment(
  input: UpdateShipmentInput,
): Promise<{ error?: string }> {
  const { error: authError, supabase, user } = await requireRoles(
    SHIPMENT_MANAGEMENT_ROLES,
  );
  if (authError || !supabase || !user) return { error: authError ?? "Unauthorized" };

  const parsed = v.safeParse(updateShipmentSchema, input);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const { id, purchaseOrderId, shipmentNumber, shipmentDate } = parsed.output;

  const { data: existing } = await supabase
    .from("shipments")
    .select("workspace_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!existing || existing.workspace_id !== user.workspaceId)
    return { error: "Shipment not found." };
  if (existing.status !== "pending") return { error: "Only pending shipments can be edited." };

  const { error } = await supabase
    .from("shipments")
    .update({
      shipment_number: shipmentNumber,
      shipment_date: shipmentDate || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateShipmentPaths(purchaseOrderId, id);
  return {};
}

export async function deleteShipment(
  id: string,
  purchaseOrderId: string,
): Promise<{ error?: string }> {
  const { error: authError, supabase, user } = await requireRoles(
    SHIPMENT_MANAGEMENT_ROLES,
  );
  if (authError || !supabase || !user) return { error: authError ?? "Unauthorized" };

  const { data: existing } = await supabase
    .from("shipments")
    .select("workspace_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!existing || existing.workspace_id !== user.workspaceId)
    return { error: "Shipment not found." };
  if (existing.status !== "pending") return { error: "Only pending shipments can be deleted." };

  const { error } = await supabase.from("shipments").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidateShipmentPaths(purchaseOrderId);
  return {};
}

// ─── Shipment Item Actions ────────────────────────────────────────────────────

async function validateRemainingQty(
  supabase: ReturnType<typeof createClient>,
  purchaseOrderItemId: string,
  shipmentId: string,
  requestedQty: number,
  currentItemId?: string,
): Promise<{ error?: string }> {
  // Get ordered qty
  const { data: poItem } = await supabase
    .from("purchase_order_items")
    .select("quantity, purchase_order_id")
    .eq("id", purchaseOrderItemId)
    .maybeSingle();

  if (!poItem) return { error: "PO item not found." };

  // Get all other shipments for the same PO (excluding current shipment)
  const { data: otherShipments } = await supabase
    .from("shipments")
    .select("id")
    .eq("purchase_order_id", poItem.purchase_order_id)
    .neq("id", shipmentId);

  const otherIds = (otherShipments ?? []).map((s) => s.id);

  let alreadyShipped = 0;

  if (otherIds.length > 0) {
    const { data: otherItems } = await supabase
      .from("shipment_items")
      .select("quantity")
      .in("shipment_id", otherIds)
      .eq("purchase_order_item_id", purchaseOrderItemId);

    alreadyShipped = (otherItems ?? []).reduce((sum, i) => sum + i.quantity, 0);
  }

  // Also count same-shipment items for the same PO item (except the item being updated)
  const sameShipmentQuery = supabase
    .from("shipment_items")
    .select("quantity")
    .eq("shipment_id", shipmentId)
    .eq("purchase_order_item_id", purchaseOrderItemId);

  if (currentItemId) {
    sameShipmentQuery.neq("id", currentItemId);
  }

  const { data: sameShipmentItems } = await sameShipmentQuery;
  const sameShipmentQty = (sameShipmentItems ?? []).reduce((sum, i) => sum + i.quantity, 0);

  const remaining = poItem.quantity - alreadyShipped - sameShipmentQty;

  if (requestedQty > remaining) {
    return {
      error: `Only ${remaining} unit(s) remaining for this item. Requested: ${requestedQty}.`,
    };
  }

  return {};
}

export async function addShipmentItem(
  input: CreateShipmentItemInput,
): Promise<{ error?: string; id?: string }> {
  const { error: authError, supabase, user } = await requireRoles(
    SHIPMENT_MANAGEMENT_ROLES,
  );
  if (authError || !supabase || !user) return { error: authError ?? "Unauthorized" };

  const parsed = v.safeParse(shipmentItemBaseSchema, input);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const { shipmentId, purchaseOrderItemId, quantity } = parsed.output;

  // Check shipment is pending
  const { data: shipment } = await supabase
    .from("shipments")
    .select("workspace_id, status, purchase_order_id")
    .eq("id", shipmentId)
    .maybeSingle();

  if (!shipment || shipment.workspace_id !== user.workspaceId)
    return { error: "Shipment not found." };
  if (shipment.status !== "pending") return { error: "Items can only be added to pending shipments." };

  // Validate remaining quantity
  const qtyCheck = await validateRemainingQty(
    supabase,
    purchaseOrderItemId,
    shipmentId,
    quantity,
  );
  if (qtyCheck.error) return qtyCheck;

  // Get price from PO item
  const { data: poItem } = await supabase
    .from("purchase_order_items")
    .select("price")
    .eq("id", purchaseOrderItemId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("shipment_items")
    .insert({
      shipment_id: shipmentId,
      purchase_order_item_id: purchaseOrderItemId,
      workspace_id: user.workspaceId!,
      quantity,
      price: poItem?.price ?? "0",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidateShipmentPaths(shipment.purchase_order_id, shipmentId);
  return { id: data.id };
}

export async function updateShipmentItem(
  input: UpdateShipmentItemInput,
): Promise<{ error?: string }> {
  const { error: authError, supabase, user } = await requireRoles(
    SHIPMENT_MANAGEMENT_ROLES,
  );
  if (authError || !supabase || !user) return { error: authError ?? "Unauthorized" };

  const parsed = v.safeParse(updateShipmentItemSchema, input);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const { id, shipmentId, purchaseOrderItemId, quantity } = parsed.output;

  const { data: shipment } = await supabase
    .from("shipments")
    .select("workspace_id, status, purchase_order_id")
    .eq("id", shipmentId)
    .maybeSingle();

  if (!shipment || shipment.workspace_id !== user.workspaceId)
    return { error: "Shipment not found." };
  if (shipment.status !== "pending") return { error: "Items can only be edited on pending shipments." };

  const qtyCheck = await validateRemainingQty(
    supabase,
    purchaseOrderItemId,
    shipmentId,
    quantity,
    id,
  );
  if (qtyCheck.error) return qtyCheck;

  const { error } = await supabase
    .from("shipment_items")
    .update({ quantity })
    .eq("id", id)
    .eq("shipment_id", shipmentId);

  if (error) return { error: error.message };

  revalidateShipmentPaths(shipment.purchase_order_id, shipmentId);
  return {};
}

export async function deleteShipmentItem(
  itemId: string,
  shipmentId: string,
): Promise<{ error?: string }> {
  const { error: authError, supabase, user } = await requireRoles(
    SHIPMENT_MANAGEMENT_ROLES,
  );
  if (authError || !supabase || !user) return { error: authError ?? "Unauthorized" };

  const { data: shipment } = await supabase
    .from("shipments")
    .select("workspace_id, status, purchase_order_id")
    .eq("id", shipmentId)
    .maybeSingle();

  if (!shipment || shipment.workspace_id !== user.workspaceId)
    return { error: "Shipment not found." };
  if (shipment.status !== "pending") return { error: "Items can only be deleted from pending shipments." };

  const { error } = await supabase
    .from("shipment_items")
    .delete()
    .eq("id", itemId)
    .eq("shipment_id", shipmentId);

  if (error) return { error: error.message };

  revalidateShipmentPaths(shipment.purchase_order_id, shipmentId);
  return {};
}

// ─── Status Transitions ───────────────────────────────────────────────────────

export async function submitShipment(
  input: v.InferInput<typeof submitShipmentSchema>,
): Promise<{ error?: string }> {
  const { error: authError, supabase, user } = await requireRoles(
    SHIPMENT_TRANSIT_ROLES,
  );
  if (authError || !supabase || !user) return { error: authError ?? "Unauthorized" };

  const parsed = v.safeParse(submitShipmentSchema, input);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const { id, location, note } = parsed.output;

  const { data: shipment } = await supabase
    .from("shipments")
    .select("workspace_id, status, purchase_order_id")
    .eq("id", id)
    .maybeSingle();

  if (!shipment || shipment.workspace_id !== user.workspaceId)
    return { error: "Shipment not found." };
  if (shipment.status !== "pending") return { error: "Only pending shipments can be submitted." };

  const { count } = await supabase
    .from("shipment_items")
    .select("id", { count: "exact", head: true })
    .eq("shipment_id", id);

  if (!count || count === 0) {
    return { error: "Shipment must have at least one item before submitting." };
  }

  const { error: updateError } = await supabase
    .from("shipments")
    .update({ status: "in_transit", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) return { error: updateError.message };

  // Create tracking event
  await supabase.from("shipment_tracking").insert({
    shipment_id: id,
    workspace_id: user.workspaceId!,
    status: "in_transit",
    location: location || null,
    note: note || "Shipment submitted and in transit.",
    performed_by: user.id,
  });

  revalidateShipmentPaths(shipment.purchase_order_id, id);
  return {};
}

export async function updateInTransitTracking(
  input: v.InferInput<typeof submitShipmentSchema>,
): Promise<{ error?: string }> {
  const { error: authError, supabase, user } = await requireRoles(
    SHIPMENT_TRANSIT_ROLES,
  );
  if (authError || !supabase || !user) return { error: authError ?? "Unauthorized" };

  const parsed = v.safeParse(submitShipmentSchema, input);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const { id, location, note } = parsed.output;

  const { data: shipment } = await supabase
    .from("shipments")
    .select("workspace_id, status, purchase_order_id")
    .eq("id", id)
    .maybeSingle();

  if (!shipment || shipment.workspace_id !== user.workspaceId)
    return { error: "Shipment not found." };
  if (shipment.status !== "in_transit") {
    return { error: "Tracking updates can only be added for in-transit shipments." };
  }

  const { error: trackingError } = await supabase.from("shipment_tracking").insert({
    shipment_id: id,
    workspace_id: user.workspaceId!,
    status: "in_transit",
    location: location || null,
    note: note || "Shipment tracking updated.",
    performed_by: user.id,
  });

  if (trackingError) return { error: trackingError.message };

  revalidateShipmentPaths(shipment.purchase_order_id, id);
  return {};
}

export async function markDelivered(
  input: v.InferInput<typeof markDeliveredSchema>,
): Promise<{ error?: string }> {
  const { error: authError, supabase, user } = await requireRoles(
    SHIPMENT_DELIVERY_ROLES,
  );
  if (authError || !supabase || !user) return { error: authError ?? "Unauthorized" };

  const parsed = v.safeParse(markDeliveredSchema, input);
  if (!parsed.success) return { error: parsed.issues[0].message };

  const { id, note } = parsed.output;

  const { data: shipment } = await supabase
    .from("shipments")
    .select("workspace_id, status, purchase_order_id")
    .eq("id", id)
    .maybeSingle();

  if (!shipment || shipment.workspace_id !== user.workspaceId)
    return { error: "Shipment not found." };
  if (shipment.status !== "in_transit")
    return { error: "Only in-transit shipments can be marked as delivered." };

  const { error: updateError } = await supabase
    .from("shipments")
    .update({ status: "delivered", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) return { error: updateError.message };

  // Create tracking event
  await supabase.from("shipment_tracking").insert({
    shipment_id: id,
    workspace_id: user.workspaceId!,
    status: "delivered",
    location: null,
    note: note || "Shipment delivered.",
    performed_by: user.id,
  });

  // Check if PO should be auto-closed
  await checkAndClosePO(supabase, shipment.purchase_order_id);

  revalidateShipmentPaths(shipment.purchase_order_id, id);
  revalidatePath("/purchase-orders");
  return {};
}
