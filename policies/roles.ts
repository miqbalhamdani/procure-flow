export const MEMBERSHIP_ROLES = [
  "admin",
  "manager",
  "procurement",
  "logistics",
  "supplier",
  "viewer",
] as const;

export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const OPERATIONAL_ROLES: readonly MembershipRole[] = [
  "logistics",
  "supplier",
];

// ─── Permission Types ─────────────────────────────────────────────────────────

export type SupplierPermission =
  | "supplier.view"
  | "supplier.create"
  | "supplier.edit"
  | "supplier.delete";

export type PurchaseOrderPermission =
  | "purchaseOrder.view"
  | "purchaseOrder.create"
  | "purchaseOrder.edit"
  | "purchaseOrder.delete"
  | "purchaseOrder.submit"
  | "purchaseOrder.approve"
  | "purchaseOrder.reject";

export type ShipmentPermission =
  | "shipment.view"
  | "shipment.create"
  | "shipment.edit"
  | "shipment.delete"
  | "shipment.markInTransit"
  | "shipment.markDelivered";

export type WorkspacePermission = "workspace.view" | "workspace.manage";

export type Permission =
  | SupplierPermission
  | PurchaseOrderPermission
  | ShipmentPermission
  | WorkspacePermission;

// ─── Role → Permission Map ────────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<MembershipRole, Permission[]> = {
  admin: [
    "supplier.view", "supplier.create", "supplier.edit", "supplier.delete",
    "purchaseOrder.view", "purchaseOrder.create", "purchaseOrder.edit",
    "purchaseOrder.delete", "purchaseOrder.submit", "purchaseOrder.approve",
    "purchaseOrder.reject",
    "shipment.view", "shipment.create", "shipment.edit", "shipment.delete",
    "shipment.markInTransit", "shipment.markDelivered",
    "workspace.view", "workspace.manage",
  ],
  manager: [
    "supplier.view", "supplier.create", "supplier.edit", "supplier.delete",
    "purchaseOrder.view", "purchaseOrder.approve", "purchaseOrder.reject",
    "shipment.view",
    "workspace.view",
  ],
  procurement: [
    "purchaseOrder.view", "purchaseOrder.create", "purchaseOrder.edit",
    "purchaseOrder.delete", "purchaseOrder.submit",
    "shipment.view",
    "workspace.view",
  ],
  logistics: [
    "purchaseOrder.view",
    "shipment.view", "shipment.markDelivered",
    "workspace.view",
  ],
  supplier: [
    "purchaseOrder.view",
    "shipment.view", "shipment.create", "shipment.edit",
    "shipment.delete", "shipment.markInTransit",
    "workspace.view",
  ],
  viewer: [
    "supplier.view",
    "purchaseOrder.view",
    "shipment.view",
    "workspace.view",
  ],
};

// ─── Role Display Labels ──────────────────────────────────────────────────────

export const ROLE_LABELS: Record<MembershipRole, string> = {
  admin: "Admin",
  manager: "Manager",
  procurement: "Procurement",
  logistics: "Logistics",
  supplier: "Supplier",
  viewer: "Viewer",
};

// ─── Permission Helpers ───────────────────────────────────────────────────────

export function hasPermission(
  role: MembershipRole | null | undefined,
  permission: Permission,
): boolean {
  return role != null && (ROLE_PERMISSIONS[role]?.includes(permission) ?? false);
}

/**
 * Unified permission check that accounts for Super Admin bypass.
 * Use this in pages/components instead of `isSuperAdmin || hasPermission(role, permission)`.
 */
export function can(
  isSuperAdmin: boolean,
  role: MembershipRole | null | undefined,
  permission: Permission,
): boolean {
  return isSuperAdmin || hasPermission(role, permission);
}

export function isOperationalRole(role: MembershipRole | null | undefined): boolean {
  return role != null && OPERATIONAL_ROLES.includes(role);
}

export function canViewPendingShipment(
  isSuperAdmin: boolean,
  role: MembershipRole | null | undefined,
): boolean {
  return isSuperAdmin || role === "admin" || role === "supplier" || role === "viewer";
}

export function isMembershipRole(value: string): value is MembershipRole {
  return MEMBERSHIP_ROLES.includes(value as MembershipRole);
}
