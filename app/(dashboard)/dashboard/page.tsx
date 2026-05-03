export default function DashboardPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf8ff] p-8">
      <div className="rounded-xl border border-[#c7c4d7]/30 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-[#131b2e]">Dashboard</h1>
        <p className="mt-2 text-sm text-[#515f74]">
          You are logged in. This page is the non-super-admin post-login destination.
        </p>
      </div>
    </main>
  );
}
