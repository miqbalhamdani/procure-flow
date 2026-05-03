import { listWorkspacesForSuperAdmin } from "@/features/companies/services/company-service";

export default async function CompaniesPage() {
  let workspaces: Awaited<ReturnType<typeof listWorkspacesForSuperAdmin>> = [];
  let pageError: string | null = null;

  try {
    workspaces = await listWorkspacesForSuperAdmin();
  } catch (error) {
    pageError = error instanceof Error ? error.message : "Failed to load companies.";
  }

  return (
    <div className="min-h-screen bg-[#eaedff] font-sans text-[#131b2e]">
      <aside className="fixed top-0 left-0 z-50 flex h-screen w-64 flex-col bg-[#f2f3ff]">
        <div className="flex h-full flex-col justify-between py-8">
          <div className="flex-1 space-y-8">
            <div className="flex items-center gap-3 px-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#712ae2] to-[#8a4cfc] text-white">
                PF
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tighter">ProcureFlow</h1>
                <p className="text-xs font-medium tracking-widest text-[#464554] uppercase">Editorial</p>
              </div>
            </div>

            <nav className="flex flex-col gap-1 pr-4">
              <a className="rounded-r-full px-6 py-3 font-semibold text-[#464554] hover:bg-[#eaedff]" href="/dashboard">
                Dashboard
              </a>
              <a className="rounded-r-full bg-[#eaedff] px-6 py-3 font-bold text-[#712ae2]" href="/companies">
                Companies
              </a>
            </nav>
          </div>
        </div>
      </aside>

      <main className="ml-64 min-h-screen">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-end border-b border-[#c7c4d7]/30 bg-[#faf8ff]/80 px-8 backdrop-blur-xl">
          <div className="rounded-lg bg-[#f2f3ff] px-4 py-2 text-sm font-bold text-[#712ae2]">Super Admin</div>
        </header>

        <div className="p-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Companies</h2>
              <p className="mt-1 text-[#515f74]">Manage your corporate hierarchy and entity locations.</p>
            </div>
          </div>

          {pageError ? (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pageError}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-3xl border border-[#c7c4d7]/20 bg-white shadow-sm">
            <div className="border-b border-[#c7c4d7]/20 px-8 py-6">
              <h3 className="text-lg font-bold">Entity Directory</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-[#f2f3ff]/60">
                    <th className="px-8 py-4 text-[11px] font-bold tracking-widest text-[#464554] uppercase">
                      Company Name
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#464554] uppercase">
                      Parent
                    </th>
                    <th className="px-8 py-4 text-right text-[11px] font-bold tracking-widest text-[#464554] uppercase">
                      Workspace ID
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c7c4d7]/20">
                  {workspaces.length === 0 ? (
                    <tr>
                      <td className="px-8 py-8 text-sm text-[#515f74]" colSpan={3}>
                        No companies available.
                      </td>
                    </tr>
                  ) : (
                    workspaces.map((workspace) => (
                      <tr key={workspace.id} className="transition-colors hover:bg-[#faf8ff]">
                        <td className="px-8 py-5 text-sm font-semibold">{workspace.name}</td>
                        <td className="px-6 py-5 text-sm text-[#515f74]">
                          {workspace.parent_id ? "Child company" : "Parent company"}
                        </td>
                        <td className="px-8 py-5 text-right text-xs text-[#515f74]">{workspace.id}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
