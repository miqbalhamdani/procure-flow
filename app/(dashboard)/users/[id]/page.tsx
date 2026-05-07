import Link from "next/link";
import { notFound } from "next/navigation";

import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { MembershipsColumn } from "@/features/users/components/memberships-column";
import { UserProfileForm } from "@/features/users/components/user-profile-form";
import { getUserById } from "@/features/users/services/user-service";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUserById(id).catch(() => null);

  if (!user) notFound();

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <PageBreadcrumb
        className="mb-4"
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Users", href: "/users" },
          { label: user.name ?? user.email },
        ]}
      />

      {/* Page header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight text-on-background">
            User Details
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Manage personal information and organizational access levels.
          </p>
        </div>
        <Link
          href="/users"
          className="inline-flex items-center gap-1 pt-1 text-sm font-semibold text-primary"
        >
          <span className="material-symbols-outlined text-[16px] leading-none">arrow_back</span>
          Back to Users
        </Link>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Profile */}
        <div className="lg:col-span-1">
          <UserProfileForm user={user} />
        </div>

        {/* Right: Memberships */}
        <div className="lg:col-span-2">
          <MembershipsColumn userId={user.id} memberships={user.memberships} />
        </div>
      </div>
    </div>
  );
}
