"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/suppliers", label: "Suppliers", icon: "inventory_2" },
  { href: "/purchase-orders", label: "Purchase Order", icon: "receipt_long" },
  { href: "/billing", label: "Billing", icon: "payments" },
  { href: "/companies", label: "Companies", icon: "domain" },
  { href: "/users", label: "Users", icon: "group" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 pr-4">
      {NAV_ITEMS.map((item) => {
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
