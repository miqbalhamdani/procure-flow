"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasPermission, type MembershipRole } from "@/policies/roles";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  allowedFor: (isSuperAdmin: boolean, role: MembershipRole | null) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "dashboard",
    allowedFor: (isSuperAdmin) => !isSuperAdmin,
  },
  {
    href: "/suppliers",
    label: "Suppliers",
    icon: "inventory_2",
    allowedFor: (isSuperAdmin, role) => !isSuperAdmin && hasPermission(role, "supplier.view"),
  },
  {
    href: "/purchase-orders",
    label: "Purchase Order",
    icon: "receipt_long",
    allowedFor: (isSuperAdmin, role) =>
      !isSuperAdmin && hasPermission(role, "purchaseOrder.view"),
  },
  {
    href: "/companies",
    label: "Companies",
    icon: "domain",
    allowedFor: (isSuperAdmin) => isSuperAdmin,
  },
  {
    href: "/users",
    label: "Users",
    icon: "group",
    allowedFor: (isSuperAdmin) => isSuperAdmin,
  },
];

type SidebarNavProps = {
  isSuperAdmin: boolean;
  role: MembershipRole | null;
};

export function SidebarNav({ isSuperAdmin, role }: SidebarNavProps) {
  const pathname = usePathname();
  const visibleItems = NAV_ITEMS.filter((item) => item.allowedFor(isSuperAdmin, role));

  return (
    <nav className="flex flex-col gap-1 pr-4">
      {visibleItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive
                ? "flex items-center gap-3 rounded-r-full bg-surface-container px-6 py-3 text-sm font-bold text-primary transition-all duration-200 active:scale-95"
                : "flex items-center gap-3 rounded-r-full px-6 py-3 text-sm font-medium text-on-surface-variant transition-colors duration-200 hover:bg-surface-container"
            }
          >
            <span
              className="material-symbols-outlined text-[22px] leading-none"
              style={
                isActive
                  ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }
                  : undefined
              }
            >
              {item.icon}
            </span>
            <span className="font-headline text-sm">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
