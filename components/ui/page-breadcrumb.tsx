import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/shadcn-ui/breadcrumb";

export type BreadcrumbItemDef = {
  label: string;
  href?: string;
};

type PageBreadcrumbProps = {
  items: BreadcrumbItemDef[];
  className?: string;
};

export function PageBreadcrumb({ items, className }: PageBreadcrumbProps) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <span key={item.label} className="inline-flex items-center gap-1.5">
              <BreadcrumbItem>
                {item.href && !isLast ? (
                  <BreadcrumbLink
                    asChild
                    className="text-on-surface-variant transition-colors hover:text-on-surface"
                  >
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="text-on-surface">{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>

              {!isLast && (
                <BreadcrumbSeparator>
                  <span className="material-symbols-outlined text-[14px] leading-none text-on-surface-variant">
                    chevron_right
                  </span>
                </BreadcrumbSeparator>
              )}
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
