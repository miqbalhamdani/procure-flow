function LoadingBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-surface-container-lowest/80 ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <section className="space-y-8 bg-surface-container p-8">
      <div className="space-y-2">
        <LoadingBlock className="h-4 w-44" />
        <LoadingBlock className="h-9 w-80" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <LoadingBlock className="h-40" />
        <LoadingBlock className="h-40" />
        <LoadingBlock className="h-40" />
        <LoadingBlock className="h-40" />
      </div>

      <LoadingBlock className="h-[520px] rounded-2xl" />
      <LoadingBlock className="h-52 rounded-2xl" />
    </section>
  );
}
