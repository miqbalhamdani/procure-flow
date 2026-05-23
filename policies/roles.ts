export const MEMBERSHIP_ROLES = [
  "admin",
  "manager",
  "procurement",
  "logistics",
  "supplier",
  "viewer",
] as const;

export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const SUPPLIER_MANAGEMENT_ROLES = ["admin", "manager"] as const satisfies readonly MembershipRole[];

export const PURCHASE_ORDER_MANAGEMENT_ROLES = [
  "admin",
  "manager",
  "procurement",
] as const satisfies readonly MembershipRole[];

export const PURCHASE_ORDER_APPROVAL_ROLES = ["admin", "manager"] as const satisfies readonly MembershipRole[];

export const SHIPMENT_MANAGEMENT_ROLES = [
  "admin",
  "manager",
  "supplier",
] as const satisfies readonly MembershipRole[];

export const SHIPMENT_TRANSIT_ROLES = [
  "admin",
  "supplier",
] as const satisfies readonly MembershipRole[];

export const SHIPMENT_DELIVERY_ROLES = [
  "admin",
  "logistics",
] as const satisfies readonly MembershipRole[];

export function isMembershipRole(value: string): value is MembershipRole {
  return MEMBERSHIP_ROLES.includes(value as MembershipRole);
}

export function hasRequiredRole(
  role: MembershipRole | null | undefined,
  allowedRoles: readonly MembershipRole[],
): boolean {
  return role != null && allowedRoles.includes(role);
}
