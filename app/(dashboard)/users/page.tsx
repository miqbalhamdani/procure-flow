import { Suspense } from "react";

import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { BaseTable } from "@/components/ui/base-table";
import { columns } from "@/features/users/components/columns";
import { UserCreateModal } from "@/features/users/components/user-create-modal";
import { UserSearch } from "@/features/users/components/user-search";
import { listUsers } from "@/features/users/services/user-service";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const { page: pageParam, search = "" } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  let data: Awaited<ReturnType<typeof listUsers>>["data"] = [];
  let meta: Awaited<ReturnType<typeof listUsers>>["meta"] | null = null;
  let pageError: string | null = null;

  try {
    const result = await listUsers(page, search);
    data = result.data;
    meta = result.meta;
  } catch (error) {
    pageError = error instanceof Error ? error.message : "Failed to load users.";
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <PageBreadcrumb
        className="mb-4"
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "User Management" },
        ]}
      />

      {/* Page header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight text-on-background">
            Users
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Manage enterprise access, roles, and security permissions for all active staff members.
          </p>
        </div>
        <UserCreateModal />
      </div>

      {/* Error banner */}
      {pageError ? (
        <div className="mb-6 rounded-xl border border-error-container bg-error-container/40 px-4 py-3 text-sm font-medium text-on-error-container">
          {pageError}
        </div>
      ) : null}

      {/* Search + Table */}
      <Suspense>
        <div className="overflow-hidden rounded-3xl border border-outline-variant/5 bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant/5 px-8 py-6">
            <UserSearch defaultValue={search} />
          </div>
          <BaseTable
            title=""
            columns={columns}
            data={data}
            emptyMessage="No users found."
            emptyDescription={
              search
                ? `No users match "${search}".`
                : "Add your first user to get started."
            }
            pagination={meta}
          />
        </div>
      </Suspense>
    </div>
  );
}
